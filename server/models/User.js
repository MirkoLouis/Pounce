const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    msu_email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    college: { type: String, required: true },
    course: { type: String, required: true },
    skills: [String],
    rating: { type: Number, default: 0 },
    auto_pounce_message: { 
        type: String, 
        default: "Hello I'm [Name], I'm a student from [College] and I want to help you with this job." 
    },
    publicKey: String, // Store ECDH Public Key (Base64)
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
