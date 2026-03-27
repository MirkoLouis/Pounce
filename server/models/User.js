const mongoose = require('mongoose');

// Defines student identity, security credentials, and real-time presence state.
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    msu_email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    college: { type: String, required: true },
    course: { type: String, required: true },
    rating: { type: Number, default: 0 },
    // Default intro message sent automatically when a user pounces on a gig.
    auto_pounce_message: { 
        type: String, 
        default: "Hello I'm [Name], I'm a student from [College] and I want to help you with this job." 
    },
    // ECDH Public Key (Base64) used for deriving E2EE shared secrets.
    publicKey: String,
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
