const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file!');
    process.exit(1);
}

// Masking for privacy
const maskedUri = uri.replace(/\/\/.*?:.*?@/, '//<user>:<password>@');
console.log(`🐾 Attempting to connect to: ${maskedUri}`);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Success! Connected to MongoDB Atlas.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
