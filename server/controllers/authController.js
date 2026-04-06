const User = require('../models/User');
const Gig = require('../models/Gig');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { seed } = require('../populate');

// Handles new user registration, including password hashing and generating an initial authentication token.
exports.register = async (req, res) => {
    try {
        const { name, msu_email, password, college, course } = req.body;

        // 1. Check if user exists
        let user = await User.findOne({ msu_email });
        if (user) return res.status(400).json({ msg: "Cat already exists!" });

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create User
        user = new User({
            name,
            msu_email,
            password: hashedPassword,
            college,
            course
        });

        await user.save();

        // 4. Return JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user._id, name, college, course } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Alab error during registration");
    }
};

// Authenticates users by verifying credentials and returning a signed JWT for subsequent API access.
exports.login = async (req, res) => {
    try {
        const { msu_email, password } = req.body;

        const user = await User.findOne({ msu_email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id, course: user.course }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, college: user.college } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Alab error during login");
    }
};

// Returns the full profile of the currently authenticated user, excluding sensitive fields like passwords.
exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// Allows users to update their profile information, including academic details and security credentials.
exports.updateProfile = async (req, res) => {
    try {
        const { name, college, course, auto_pounce_message, password, publicKey } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ msg: "User not found" });

        if (name) user.name = name;
        if (college) user.college = college;
        if (course) user.course = course;
        if (auto_pounce_message) user.auto_pounce_message = auto_pounce_message;
        if (publicKey) user.publicKey = publicKey;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ msg: "Profile updated successfully! 🐾", user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Triggers a database reset, wiping all bots and gigs while preserving real user identities.
// This is an administrative action restricted to the Monitor/Admin account.
exports.resetDatabase = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.msu_email !== 'markleo.bagood@g.msuiit.edu.ph') {
            return res.status(403).json({ msg: "Only the Monitor Cat can reset the marketplace! 🐾" });
        }

        // Trigger the internal seed process (100 users, 200 gigs by default)
        await seed(100, 200, true);

        // Broadcast a global logout signal via Socket.io to ensure all UIs refresh their state
        // req.io is attached in index.js
        req.io.emit('force_logout');

        res.json({ msg: "Marketplace reset successfully! All Cats have been force-logged for synchronization. 🐾" });
    } catch (err) {
        console.error("❌ Database Reset Error:", err);
        res.status(500).json({ msg: "Error resetting database" });
    }
};

// Aggregates and exports all system-wide data to a JSON file to satisfy the database management and backup requirements.
// Access restricted to the Monitor/Admin account for security.
exports.backupData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Security check: Only the monitor account can perform a full database backup
        if (user.msu_email !== 'markleo.bagood@g.msuiit.edu.ph') {
            return res.status(403).json({ msg: "Only the Monitor Cat can export the entire pride's data! 🐾" });
        }

        // Fetching all documents from core collections for a full database dump
        const users = await User.find().select('-password');
        const gigs = await Gig.find();
        const conversations = await Conversation.find();
        const messages = await Message.find();

        // Perform Data Analysis using Aggregation (Satisfying Step 4 of NoSQL Activity)
        const stats = await Gig.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const collegeActivity = await Gig.aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'requester',
                    foreignField: '_id',
                    as: 'requester_info'
                }
            },
            { $unwind: '$requester_info' },
            { $group: { _id: '$requester_info.college', totalGigs: { $sum: 1 } } },
            { $sort: { totalGigs: -1 } }
        ]);

        const backup = {
            project: "Pounce (Alab-MSUIIT)",
            description: "NoSQL Database System Backup",
            timestamp: new Date().toISOString(),
            meta: {
                total_users: users.length,
                total_gigs: gigs.length,
                total_conversations: conversations.length,
                total_messages: messages.length
            },
            database: {
                users,
                gigs,
                conversations,
                messages
            },
            analytics: {
                gig_status_distribution: stats,
                top_colleges_by_activity: collegeActivity
            }
        };

        res.json(backup);
    } catch (err) {
        console.error("❌ Database Backup Error:", err);
        res.status(500).json({ msg: "Error generating database backup" });
    }
};
