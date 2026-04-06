const mongoose = require('mongoose');

// Encrypted squad communication
const messageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Encrypted hash (IV + Ciphertext) for E2EE privacy
    encryptedPayload: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
