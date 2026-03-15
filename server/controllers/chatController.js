const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

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

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversation: req.params.id })
            .sort({ timestamp: 1 })
            .limit(100);
        res.json(messages);
    } catch (err) {
        console.error("❌ Get Messages Error:", err);
        res.status(500).json({ msg: "Error fetching message history" });
    }
};
