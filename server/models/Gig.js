const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pouncers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array for Squad Gigs
    title: { type: String, required: true },
    description: { type: String, required: true, maxlength: 500 },
    images: [String], // Up to 10 URLs or hashes
    targeted_expertises: [String], // Array of course names or IDs
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

module.exports = mongoose.model('Gig', gigSchema);
