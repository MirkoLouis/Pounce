const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        let conversations = await Conversation.find({ members: userId })
            .populate('gig', 'title status requester')
            .populate('members', 'name college course publicKey')
            .sort({ lastMessageAt: -1 });
        
        // Map to include unread status
        const results = conversations.map(c => {
            const lastRead = c.lastRead?.get(userId);
            const hasUnread = !lastRead || new Date(c.lastMessageAt) > new Date(lastRead);
            return {
                ...c.toObject(),
                hasUnread
            };
        });

        res.json(results);
    } catch (err) {
        console.error("❌ Get Conversations Error:", err);
        res.status(500).json({ msg: "Error fetching conversations" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ msg: "Conversation not found" });

        if (!conversation.lastRead) conversation.lastRead = new Map();
        conversation.lastRead.set(userId, new Date());
        await conversation.save();

        res.json({ msg: "Marked as read" });
    } catch (err) {
        console.error("❌ Mark Read Error:", err);
        res.status(500).json({ msg: "Server Error" });
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
