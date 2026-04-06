const path = require('path');
// Load config for DB and secrets
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

// Data models for core entities
const User = require('./models/User');
const Gig = require('./models/Gig');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Init server for REST and WebSockets
const app = express();
const server = http.createServer(app);
// Socket.io for real-time comms
const io = new Server(server, {
    path: '/api/socket.io',
    cors: { origin: "*" }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Track online users in-memory for speed
const onlineCats = new Map(); // userId -> Set of socket IDs

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Update 'last seen' on every request
app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await User.findByIdAndUpdate(decoded.id, { lastSeen: new Date() });
        } catch (e) { /* Invalid token */ }
    }
    next();
});

// Make Socket.io available in controllers
app.use((req, res, next) => {
    req.io = io; 
    console.log(`🐾 ${req.method} ${req.url}`);
    next();
});
app.use(cors({ origin: true, credentials: true })); 
app.use(helmet({ contentSecurityPolicy: false })); 

// Controller imports
const authController = require('./controllers/authController');
const gigController = require('./controllers/gigController');
const chatController = require('./controllers/chatController');
const auth = require('./middleware/auth');

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', auth, authController.me);
app.put('/api/auth/profile', auth, authController.updateProfile);
app.get('/api/auth/backup', auth, authController.backupData);
app.post('/api/auth/reset-database', auth, authController.resetDatabase);

// Gig Routes
app.get('/api/gigs/public', gigController.getPublicGigs); 
app.post('/api/gigs', auth, gigController.createGig);
app.get('/api/gigs/dashboard', auth, gigController.getDashboardFeed);
app.get('/api/gigs/feed', auth, gigController.getPaginatedGigs);
app.get('/api/gigs/my', auth, gigController.getMyGigs);
app.get('/api/gigs/stats', auth, gigController.getGigStats);
app.get('/api/gigs/analytics', auth, gigController.getAdvancedAnalytics);
app.post('/api/gigs/pounce/:id', auth, gigController.pounceGig);
app.post('/api/gigs/complete/:id', auth, gigController.completeGig);
app.delete('/api/gigs/:id', auth, gigController.deleteGig);

// Chat Routes
app.get('/api/chat/conversations', auth, chatController.getConversations);
app.post('/api/chat/read/:id', auth, chatController.markAsRead);
app.get('/api/chat/messages/:id', auth, chatController.getMessages);

// Authenticate WebSocket connections via JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.userId = decoded.id;
        next();
    });
});

// Handle real-time messaging and presence
io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🐾 Cat ${userId} connected:`, socket.id);
    
    // Manage user presence and notify peers
    try {
        socket.join(`user_${userId}`);

        if (!onlineCats.has(userId)) {
            onlineCats.set(userId, new Set());
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

    // Persist and broadcast messages to participants
    socket.on('send_message', async (data) => {
        try {
            const newMessage = new Message({
                conversation: data.chatId,
                sender: userId,
                encryptedPayload: data.encryptedPayload,
                timestamp: data.timestamp || new Date()
            });
            await newMessage.save();
            
            // Update last read and message timestamps
            const updateData = { lastMessageAt: new Date() };
            const conversation = await Conversation.findById(data.chatId);
            if (conversation) {
                if (!conversation.lastRead) conversation.lastRead = new Map();
                conversation.lastRead.set(userId, new Date());
                await conversation.save();
            }
            
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            const messageToEmit = { ...data, _id: newMessage._id };

            // Broadcast to all member sessions
            const conv = await Conversation.findById(data.chatId).select('members');
            if (conv) {
                conv.members.forEach(memberId => {
                    const memberStr = memberId.toString();
                    if (memberStr === userId) {
                        socket.to(`user_${memberStr}`).emit('receive_message', messageToEmit);
                    } else {
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

    // Handle disconnects and update online status
    socket.on('disconnect', async () => {
        console.log(`😿 Cat ${userId} disconnected`);
        try {
            const userSockets = onlineCats.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineCats.delete(userId);
                    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
                    io.emit('user_status_change', { userId, status: 'offline' });
                }
            }
        } catch (err) {
            console.error("❌ Presence Error (Disconnect):", err);
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'Pouncing!' }));

// Force logout all for system resets
app.get('/api/system/force-logout-all', (req, res) => {
    io.emit('force_logout');
    console.log('📢 GLOBAL LOGOUT BROADCAST SENT (DB RESET)');
    res.json({ success: true });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐱 Alab is live on http://0.0.0.0:${PORT}`);
});

