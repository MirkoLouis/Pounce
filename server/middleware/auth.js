const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User for verification

// Protect routes by verifying JWT and user existence
module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure user is still active in DB
        const user = await User.findById(decoded.id).select('_id');
        if (!user) {
            return res.status(401).json({ msg: "User no longer exists, session invalidated" });
        }

        req.user = decoded; // Attach user ID to request
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

