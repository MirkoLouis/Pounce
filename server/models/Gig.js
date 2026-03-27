const mongoose = require('mongoose');

// Stores marketplace requests, including targeted expertise and fulfillment status.
const gigSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Multiple pouncers are supported for squad-based collaboration.
    pouncers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    description: { type: String, required: true, maxlength: 500 },
    images: [String],
    // Academic programs targeted for specific expertise requirements.
    targeted_expertises: [String],
    reward: {
        type: { type: String, enum: ['PHP', 'CUSTOM'], default: 'PHP' },
        value: { type: String, required: true }
    },
    status: { 
        type: String, 
        enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], 
        default: 'OPEN' 
    }
}, { timestamps: true });

// Performance Optimization: Indexes for high-volume dashboard queries and analytics
gigSchema.index({ status: 1, createdAt: -1 });
gigSchema.index({ requester: 1 });
gigSchema.index({ targeted_expertises: 1 });
gigSchema.index({ 'reward.type': 1 });

// Full-text search index for keyword discovery
gigSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
