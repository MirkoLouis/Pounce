const User = require('../models/User');
const Gig = require('../models/Gig');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// Aggregates and exports all user-specific data to provide transparency and a portable backup for the user.
exports.backupData = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch all data related to the user
        const userData = await User.findById(userId).select('-password');
        const submittedGigs = await Gig.find({ requester: userId });
        const pouncedGigs = await Gig.find({ pouncers: userId });
        
        // Find conversations the user is a member of
        const conversations = await Conversation.find({ members: userId }).populate('gig', 'title');
        
        // Find messages sent by the user
        const messages = await Message.find({ sender: userId });

        const backup = {
            timestamp: new Date().toISOString(),
            user: userData,
            submittedGigs,
            pouncedGigs,
            conversations,
            messages
        };

        res.json(backup);
    } catch (err) {
        console.error("❌ Backup Error:", err);
        res.status(500).json({ msg: "Error generating backup" });
    }
};

