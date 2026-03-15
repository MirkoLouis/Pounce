const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    encryptedPayload: { type: String, required: true }, // The Base64 IV + Ciphertext
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
