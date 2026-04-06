const mongoose = require('mongoose');

// Student identity, security, and presence state
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    msu_email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    college: { type: String, required: true },
    course: { type: String, required: true },
    rating: { type: Number, default: 0 },
    // Default intro for pounces
    auto_pounce_message: { 
        type: String, 
        default: "Hello I'm [Name], I'm a student from [College] and I want to help you with this job." 
    },
    // ECDH Public Key (Base64) for E2EE shared secrets
    publicKey: String,
    isBot: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

// Optimize lookups for gigs and analytics
userSchema.index({ college: 1 });
userSchema.index({ course: 1 });

module.exports = mongoose.model('User', userSchema);
