const path = require('path');
// Loads environment variables from .env file to configure database URIs and secrets.
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

// Initialize Express and HTTP server to handle both REST API and WebSocket connections.
const app = express();
const server = http.createServer(app);
// Sets up Socket.io for real-time communication with a specific path to avoid conflicts with other routes.
const io = new Server(server, {
    path: '/api/socket.io',
    cors: { origin: "*" }
});

// Establishes a persistent connection to MongoDB for data storage and retrieval.
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Manages real-time user presence in-memory to quickly track online status across multiple browser tabs.
const onlineCats = new Map(); // userId -> Set of socket IDs

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Tracks user activity on every API request to maintain accurate 'last seen' timestamps in the database.
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

// Attaches the Socket.io instance to the request object for use within route controllers.
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
app.get('/api/auth/backup', auth, authController.backupData);

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

// Authenticates WebSocket connections using JWT to ensure only authorized users can connect.
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.userId = decoded.id;
        next();
    });
});

// Handles real-time events for messaging, presence tracking, and gig status updates.
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

    // Processes outgoing messages, persists them to the DB, and broadcasts them to all participants.
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
            
            // Update conversation: new last message time AND sender has read it
            const updateData = { lastMessageAt: new Date() };
            const conversation = await Conversation.findById(data.chatId);
            if (conversation) {
                if (!conversation.lastRead) conversation.lastRead = new Map();
                conversation.lastRead.set(userId, new Date());
                await conversation.save();
            }
            
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

    // Cleans up presence tracking when a socket disconnects, updating DB if no sessions remain.
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

// Provides a global reset mechanism to force all users to re-authenticate if needed.
app.get('/api/system/force-logout-all', (req, res) => {
    io.emit('force_logout');
    console.log('📢 GLOBAL LOGOUT BROADCAST SENT (DB RESET)');
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐱 Alab is live on http://0.0.0.0:${PORT}`);
});

