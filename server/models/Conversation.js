const mongoose = require('mongoose');

// Squad relationships and notification tracking
const conversationSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, default: Date.now },
    // UserID -> last read timestamp for unread tracking
    lastRead: {
        type: Map,
        of: Date,
        default: {}
    }
}, { timestamps: true });

// Optimize squad message retrieval and presence
conversationSchema.index({ gig: 1 });
conversationSchema.index({ members: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
