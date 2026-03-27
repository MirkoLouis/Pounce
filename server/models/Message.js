const mongoose = require('mongoose');

// Stores encrypted communication payloads between squad members.
const messageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Encrypted hash (IV + Ciphertext) to maintain E2EE privacy on the server.
    encryptedPayload: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
