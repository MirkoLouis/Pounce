const Gig = require('../models/Gig');
const User = require('../models/User'); 

// Fetch OPEN gigs for landing page (anonymous access)
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

// Create gig and broadcast in real-time
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
        
        // Populate requester for real-time feed
        gig = await Gig.findById(gig._id).populate('requester', 'name college course');

        // Emit to all connected clients
        req.io.emit('new_gig', gig);

        res.status(201).json(gig);
    } catch (err) {
        console.error("❌ Gig Creation Error:", err);
        res.status(500).json({ msg: "Error creating gig" });
    }
};

// Paginated gig fetch with filtering and search
exports.getPaginatedGigs = async (req, res) => {
    try {
        const { category, page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;
        const userCourse = req.user.course;
        const populateFields = 'name college course';

        let query = { status: 'OPEN' };
        let sort = { createdAt: -1 };

        if (category === 'recommended') {
            query.targeted_expertises = userCourse;
        } else if (category === 'php') {
            query['reward.type'] = 'PHP';
        } else if (category === 'misc') {
            query['reward.type'] = 'CUSTOM';
        }

        // Add search filtering
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
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

// Load dashboard feed with mixed categories
exports.getDashboardFeed = async (req, res) => {
    try {
        const userCourse = req.user.course;
        const populateFields = 'name college course';

        // Parallel fetch for dashboard performance
        const [allJobs, recommendedJobs, phpJobs, miscJobs, randomGigsResult] = await Promise.all([
            // Recent jobs
            Gig.find({ status: 'OPEN' })
                .populate('requester', populateFields)
                .sort({ createdAt: -1 })
                .limit(20),

            // Recommended (Expertise match)
            Gig.find({ 
                status: 'OPEN', 
                targeted_expertises: userCourse 
            })
            .populate('requester', populateFields)
            .limit(20),

            // PHP Rewards
            Gig.find({ 
                status: 'OPEN', 
                'reward.type': 'PHP' 
            })
            .populate('requester', populateFields)
            .limit(20),

            // Custom rewards
            Gig.find({ 
                status: 'OPEN', 
                'reward.type': 'CUSTOM' 
            })
            .populate('requester', populateFields)
            .limit(20),

            // Random sampler
            Gig.aggregate([
                { $match: { status: 'OPEN' } },
                { $sample: { size: 20 } }
            ])
        ]);

        const populatedRandom = await User.populate(randomGigsResult, {path: "requester", select: populateFields});

        res.json({
            all: allJobs,
            recommended: recommendedJobs,
            php: phpJobs,
            misc: miscJobs,
            random: populatedRandom
        });

    } catch (err) {
        console.error("❌ Dashboard Feed Error:", err);
        res.status(500).json({ msg: "Error fetching dashboard" });
    }
};

// Initialize conversation and update gig status on pounce
const Conversation = require('../models/Conversation');

exports.pounceGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate('requester', 'name college course auto_pounce_message');
        if (!gig) return res.status(404).json({ msg: "Gig not found" });

        // Prevent pouncing on non-OPEN or already pounced gigs
        if (gig.status !== 'OPEN' && !gig.pouncers.includes(req.user.id)) {
            return res.status(400).json({ msg: "This gig is already being handled by another Cat! 🐾" });
        }

        // Prevent self-pouncing
        if (gig.requester._id.toString() === req.user.id) {
            return res.status(400).json({ msg: "You cannot pounce on a request you personally made." });
        }

        // Init or find Conversation
        let conversation = await Conversation.findOne({ gig: gig._id });
        if (!conversation) {
            conversation = new Conversation({
                gig: gig._id,
                members: [gig.requester._id],
                lastRead: new Map([[gig.requester._id.toString(), new Date()]])
            });
        }
        
        // Add current user to conversation
        if (!conversation.members.includes(req.user.id)) {
            conversation.members.push(req.user.id);
            if (!conversation.lastRead) conversation.lastRead = new Map();
            conversation.lastRead.set(req.user.id, new Date());
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

        // Sync status and notify members
        req.io.emit('gig_status_update', gig);
        conversation.members.forEach(memberId => {
            req.io.to(`user_${memberId.toString()}`).emit('new_conversation', conversation);
        });

    } catch (err) {
        console.error("❌ Pounce Error:", err);
        res.status(500).json({ msg: "Error during pounce" });
    }
};

// Close gig and notify participants
exports.completeGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ msg: "Gig not found" });

        // Requester only
        if (gig.requester.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Only the requester can mark this as done!" });
        }

        gig.status = 'COMPLETED';
        await gig.save();

        // Broadcast availability change
        req.io.emit('gig_status_update', gig);

        res.json({ msg: "Gig marked as COMPLETED! 🐾", gig });
    } catch (err) {
        console.error("❌ Complete Gig Error:", err);
        res.status(500).json({ msg: "Error completing gig" });
    }
};

// Fetch user's own submitted gigs
exports.getMyGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({ requester: req.user.id })
            .populate('requester', 'name college course')
            .sort({ createdAt: -1 });
        res.json(gigs);
    } catch (err) {
        console.error("❌ Get My Gigs Error:", err);
        res.status(500).json({ msg: "Error fetching your gigs" });
    }
};

// Delete gig and remove from client feeds
exports.deleteGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ msg: "Gig not found" });

        // Requester only
        if (gig.requester.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You can only delete your own gigs!" });
        }

        await Gig.findByIdAndDelete(req.params.id);

        // Sync deletion
        req.io.emit('gig_deleted', { gigId: req.params.id });

        res.json({ msg: "Gig deleted successfully! 🐾" });
    } catch (err) {
        console.error("❌ Delete Gig Error:", err);
        res.status(500).json({ msg: "Error deleting gig" });
    }
};

// Aggregate gig counts by status for charts
exports.getGigStats = async (req, res) => {
    try {
        const stats = await Gig.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        const formattedStats = {
            OPEN: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0
        };
        
        stats.forEach(s => {
            formattedStats[s._id] = s.count;
        });
        
        res.json(formattedStats);
    } catch (err) {
        console.error("❌ Gig Stats Error:", err);
        res.status(500).json({ msg: "Error fetching stats" });
    }
};

// Advanced analytics for activity and rewards
exports.getAdvancedAnalytics = async (req, res) => {
    try {
        // Top colleges by COMPLETED gigs
        const collegeActivity = await Gig.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $project: { requester: 1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'requester',
                    foreignField: '_id',
                    as: 'requester_info'
                }
            },
            { $unwind: '$requester_info' },
            {
                $group: {
                    _id: '$requester_info.college',
                    totalGigs: { $sum: 1 }
                }
            },
            { $sort: { totalGigs: -1 } },
            { $limit: 5 }
        ]);

        // Reward type distribution and avg monetary value
        const rewardStats = await Gig.aggregate([
            {
                $group: {
                    _id: '$reward.type',
                    count: { $sum: 1 },
                    avgValue: { 
                        $avg: { 
                            $cond: [
                                { $eq: ['$reward.type', 'PHP'] },
                                { $toDouble: '$reward.value' },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        res.json({
            collegeActivity,
            rewardStats
        });
    } catch (err) {
        console.error("❌ Analytics Error:", err);
        res.status(500).json({ msg: "Error calculating analytics" });
    }
};

