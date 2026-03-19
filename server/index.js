const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Presence tracking (in-memory for multi-tab handling, synced to MongoDB)
const onlineCats = new Map(); // userId -> Set of socket IDs

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Track activity for all /api routes
app.use(async (req, res, next) => {
    // Attempt to track activity if a token is present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Only update if it's been more than a minute (to save DB ops)
            // But for this project, let's just do a simple update
            await User.findByIdAndUpdate(decoded.id, { lastSeen: new Date() });
        } catch (e) { /* Invalid token */ }
    }
    next();
});

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
    
    // Join personal room and update MongoDB presence
    try {
        socket.join(`user_${userId}`);

        if (!onlineCats.has(userId)) {
            onlineCats.set(userId, new Set());
            // First tab/session: Mark online in DB and notify others
            await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
            io.emit('user_status_change', { userId, status: 'online' });
        }
        onlineCats.get(userId).add(socket.id);
    } catch (err) {
        console.error("❌ Presence Error (Connect):", err);
    }

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`Cat joined chat room: ${chatId}`);
    });

    socket.on('check_online', async (targetUserId) => {
        try {
            const user = await User.findById(targetUserId).select('isOnline lastSeen');
            socket.emit('online_status', { 
                userId: targetUserId, 
                isOnline: !!user?.isOnline,
                lastSeen: user?.lastSeen 
            });
        } catch (err) {
            console.error("❌ Presence Error (Check):", err);
        }
    });

    socket.on('send_message', async (data) => {
        // 1. Save to database FIRST for reliability
        try {
            const newMessage = new Message({
                conversation: data.chatId,
                sender: userId,
                encryptedPayload: data.encryptedPayload,
                timestamp: data.timestamp || new Date()
            });
            await newMessage.save();
            await Conversation.findByIdAndUpdate(data.chatId, { lastMessageAt: new Date() });
            
            // Also update sender's activity for AFK/Away calculation
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            const messageToEmit = { ...data, _id: newMessage._id };

            // Broadcast to the personal rooms of ALL members (except sender)
            const conv = await Conversation.findById(data.chatId).select('members');
            if (conv) {
                conv.members.forEach(memberId => {
                    const memberStr = memberId.toString();
                    if (memberStr === userId) {
                        // Send to the sender's OTHER tabs/sessions (excludes current socket)
                        socket.to(`user_${memberStr}`).emit('receive_message', messageToEmit);
                    } else {
                        // Send to the other member's sessions
                        io.to(`user_${memberStr}`).emit('receive_message', messageToEmit);
                    }
                });
            }
        } catch (err) {
            console.error("❌ Message Persist/Send Error:", err);
            socket.emit('error', { msg: "Failed to send message" });
        }
    });

    socket.on('gig_completed', (data) => {
        socket.to(data.chatId).emit('gig_completed_received', data);
    });

    socket.on('disconnect', async () => {
        console.log(`😿 Cat ${userId} disconnected`);
        try {
            const userSockets = onlineCats.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineCats.delete(userId);
                    // Last tab closed: Mark offline in DB and notify others
                    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
                    io.emit('user_status_change', { userId, status: 'offline' });
                }
            }
        } catch (err) {
            console.error("❌ Presence Error (Disconnect):", err);
        }
    });
});

// Basic Routes
app.get('/api/health', (req, res) => res.json({ status: 'Pouncing!' }));

// System Routes (Internal Reset)
app.get('/api/system/force-logout-all', (req, res) => {
    io.emit('force_logout');
    console.log('📢 GLOBAL LOGOUT BROADCAST SENT (DB RESET)');
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐱 Alab is live on http://0.0.0.0:${PORT}`);
});
