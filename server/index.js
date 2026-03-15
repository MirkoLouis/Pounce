const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');

// Models
const User = require('./models/User');
const Gig = require('./models/Gig');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/api/socket.io',
    cors: { origin: "*" }
});

// Redis Connection
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect()
    .then(() => console.log('✅ Connected to Redis'))
    .catch(err => console.error('❌ Redis Connection Error:', err));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    req.io = io; // Attach Socket.io instance
    console.log(`🐾 ${req.method} ${req.url}`);
    next();
});
app.use(cors({ origin: true, credentials: true })); 
app.use(helmet({ contentSecurityPolicy: false })); 

// Import Controllers and Middleware
const authController = require('./controllers/authController');
const gigController = require('./controllers/gigController');
const chatController = require('./controllers/chatController');
const auth = require('./middleware/auth');

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', auth, authController.me);
app.put('/api/auth/profile', auth, authController.updateProfile);

// Gig Routes
app.get('/api/gigs/public', gigController.getPublicGigs); 
app.post('/api/gigs', auth, gigController.createGig);
app.get('/api/gigs/dashboard', auth, gigController.getDashboardFeed);
app.get('/api/gigs/feed', auth, gigController.getPaginatedGigs);
app.post('/api/gigs/pounce/:id', auth, gigController.pounceGig);
app.post('/api/gigs/complete/:id', auth, gigController.completeGig);

// Chat Routes
app.get('/api/chat/conversations', auth, chatController.getConversations);
app.get('/api/chat/messages/:id', auth, chatController.getMessages);

// Socket.io Middleware for Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.userId = decoded.id;
        next();
    });
});

// Socket.io Real-time Logic
io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🐾 Cat ${userId} connected:`, socket.id);
    
    // Add to Redis Presence
    try {
        await redisClient.sAdd('online_users', userId);
        io.emit('user_status_change', { userId, status: 'online' });
    } catch (err) {
        console.error("❌ Redis Presence Error (Add):", err);
    }

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`Cat joined chat room: ${chatId}`);
    });

    socket.on('check_online', async (targetUserId) => {
        try {
            const isOnline = await redisClient.sIsMember('online_users', targetUserId);
            socket.emit('online_status', { userId: targetUserId, isOnline });
        } catch (err) {
            console.error("❌ Redis Presence Error (Check):", err);
        }
    });

    socket.on('send_message', async (data) => {
        socket.to(data.chatId).emit('receive_message', data);
        try {
            const newMessage = new Message({
                conversation: data.chatId,
                sender: data.sender,
                encryptedPayload: data.encryptedPayload,
                timestamp: data.timestamp || new Date()
            });
            await newMessage.save();
            await Conversation.findByIdAndUpdate(data.chatId, { lastMessageAt: new Date() });
        } catch (err) {
            console.error("❌ Message Persist Error:", err);
        }
    });

    socket.on('gig_completed', (data) => {
        socket.to(data.chatId).emit('gig_completed_received', data);
    });

    socket.on('disconnect', async () => {
        console.log(`😿 Cat ${userId} disconnected`);
        try {
            await redisClient.sRem('online_users', userId);
            io.emit('user_status_change', { userId, status: 'offline' });
        } catch (err) {
            console.error("❌ Redis Presence Error (Remove):", err);
        }
    });
});

// Basic Routes
app.get('/api/health', (req, res) => res.json({ status: 'Pouncing!' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐱 Alab is live on http://0.0.0.0:${PORT}`);
});
