const Gig = require('../models/Gig');
const User = require('../models/User'); 

// Public route for login page animation (Masonry grid)
exports.getPublicGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({ status: 'OPEN' })
            .limit(50)
            .populate('requester', 'name college course')
            .sort({ createdAt: -1 });
        res.json(gigs);
    } catch (err) {
        console.error("❌ Gig Controller Error:", err);
        res.status(500).json({ msg: "Error fetching public gigs" });
    }
};

// Create a new Gig
exports.createGig = async (req, res) => {
    try {
        const { title, description, targeted_expertises, reward, images } = req.body;
        const newGig = new Gig({
            requester: req.user.id,
            title,
            description,
            targeted_expertises,
            reward,
            images,
            status: 'OPEN'
        });
        let gig = await newGig.save();
        
        // Populate requester for the real-time feed
        gig = await Gig.findById(gig._id).populate('requester', 'name college course');

        // Emit to all connected clients
        req.io.emit('new_gig', gig);

        res.status(201).json(gig);
    } catch (err) {
        console.error("❌ Gig Creation Error:", err);
        res.status(500).json({ msg: "Error creating gig" });
    }
};

// Get Paginated Gigs for a specific category
exports.getPaginatedGigs = async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const userCourse = req.user.course;
        const populateFields = 'name college course';

        let query = { status: 'OPEN' };
        let sort = { createdAt: -1 };

        if (category === 'recommended') {
            query.targeted_expertises = userCourse;
        } else if (category === 'misc') {
            query['reward.type'] = 'CUSTOM';
        }

        if (category === 'random') {
            const randomGigs = await Gig.aggregate([
                { $match: { status: 'OPEN' } },
                { $sample: { size: parseInt(limit) } }
            ]);
            const populated = await User.populate(randomGigs, { path: "requester", select: populateFields });
            return res.json(populated);
        }

        const gigs = await Gig.find(query)
            .populate('requester', populateFields)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        res.json(gigs);
    } catch (err) {
        console.error("❌ Pagination Error:", err);
        res.status(500).json({ msg: "Error fetching more gigs" });
    }
};

// Get Dashboard Feed (Initial load)
exports.getDashboardFeed = async (req, res) => {
    try {
        const userCourse = req.user.course;
        const populateFields = 'name college course';

        // 1. All Jobs (Recent first)
        const allJobs = await Gig.find({ status: 'OPEN' })
            .populate('requester', populateFields)
            .sort({ createdAt: -1 })
            .limit(20);

        // 2. Recommended (Matches user's expertise)
        const recommendedJobs = await Gig.find({ 
            status: 'OPEN', 
            targeted_expertises: userCourse 
        })
        .populate('requester', populateFields)
        .limit(20);

        // 3. Misc Jobs (Non-monetary rewards)
        const miscJobs = await Gig.find({ 
            status: 'OPEN', 
            'reward.type': 'CUSTOM' 
        })
        .populate('requester', populateFields)
        .limit(20);

        // 4. Random Jobs
        const randomJobs = await Gig.aggregate([
            { $match: { status: 'OPEN' } },
            { $sample: { size: 20 } }
        ]);
        const populatedRandom = await User.populate(randomJobs, {path: "requester", select: populateFields});

        res.json({
            all: allJobs,
            recommended: recommendedJobs,
            misc: miscJobs,
            random: populatedRandom
        });

    } catch (err) {
        console.error("❌ Dashboard Feed Error:", err);
        res.status(500).json({ msg: "Error fetching dashboard" });
    }
};

// Pounce on a Gig (Join Squad)
const Conversation = require('../models/Conversation');

exports.pounceGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate('requester', 'name college course auto_pounce_message');
        if (!gig) return res.status(404).json({ msg: "Gig not found" });

        // Check if requester is the pouncer
        if (gig.requester._id.toString() === req.user.id) {
            return res.status(400).json({ msg: "You cannot pounce on a request you personally made." });
        }

        // Initialize or find Conversation
        let conversation = await Conversation.findOne({ gig: gig._id });
        if (!conversation) {
            conversation = new Conversation({
                gig: gig._id,
                members: [gig.requester._id]
            });
        }
        
        // Add current user if not already in conversation
        if (!conversation.members.includes(req.user.id)) {
            conversation.members.push(req.user.id);
        }
        await conversation.save();

        if (gig.pouncers.includes(req.user.id)) {
            return res.json({ 
                msg: "You are already in this squad!", 
                gig,
                requester: gig.requester,
                conversationId: conversation._id
            });
        }

        gig.pouncers.push(req.user.id);
        if (gig.status === 'OPEN') gig.status = 'IN_PROGRESS';
        
        await gig.save();

        res.json({ 
            msg: "Pounce successful!", 
            gig,
            requester: gig.requester,
            conversationId: conversation._id
        });

        // Broadcast to everyone that the gig status changed (e.g. OPEN -> IN_PROGRESS)
        req.io.emit('gig_status_update', gig);

        // Notify both parties about the new conversation for real-time sidebar updates
        conversation.members.forEach(memberId => {
            req.io.to(`user_${memberId.toString()}`).emit('new_conversation', conversation);
        });

    } catch (err) {
        console.error("❌ Pounce Error:", err);
        res.status(500).json({ msg: "Error during pounce" });
    }
};

// Complete Gig (Requester Only)
exports.completeGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ msg: "Gig not found" });

        // Security: Only requester can finish
        if (gig.requester.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Only the requester can mark this as done!" });
        }

        gig.status = 'COMPLETED';
        await gig.save();

        // Broadcast to everyone that the gig is no longer available
        req.io.emit('gig_status_update', gig);

        res.json({ msg: "Gig marked as COMPLETED! 🐾", gig });
    } catch (err) {
        console.error("❌ Complete Gig Error:", err);
        res.status(500).json({ msg: "Error completing gig" });
    }
};
