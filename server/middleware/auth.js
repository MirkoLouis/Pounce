const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model to verify existence

// Protects routes by verifying the JWT in the request header and ensuring the corresponding user still exists.
module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure the user still exists in the database
        const user = await User.findById(decoded.id).select('_id');
        if (!user) {
            return res.status(401).json({ msg: "User no longer exists, session invalidated" });
        }

        req.user = decoded; // Contains the user's ID
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

