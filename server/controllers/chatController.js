const Conversation = require('../models/Conversation');

exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ members: req.user.id })
            .populate('gig', 'title status requester')
            .populate('members', 'name college course publicKey')
            .sort({ lastMessageAt: -1 });
        res.json(conversations);
    } catch (err) {
        console.error("❌ Get Conversations Error:", err);
        res.status(500).json({ msg: "Error fetching conversations" });
    }
};
