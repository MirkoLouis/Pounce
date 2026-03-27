const mongoose = require('mongoose');

// Tracks relationships between a gig and its squad members, including notification read status.
const conversationSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, default: Date.now },
    // Maps UserIDs to their last read timestamps for unread message tracking.
    lastRead: {
        type: Map,
        of: Date,
        default: {}
    }
}, { timestamps: true });

// Performance Optimization: Indexes for fast squad message retrieval and presence tracking
conversationSchema.index({ gig: 1 });
conversationSchema.index({ members: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
