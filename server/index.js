const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('redis');

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
app.post('/api/gigs/pounce/:id', auth, gigController.pounceGig);
app.post('/api/gigs/complete/:id', auth, gigController.completeGig);

// Chat Routes
app.get('/api/chat/conversations', auth, chatController.getConversations);

// Socket.io Real-time Logic
io.on('connection', (socket) => {
    console.log('🐾 A Cat connected:', socket.id);
    
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`Cat joined chat room: ${chatId}`);
    });

    socket.on('send_message', (data) => {
        socket.to(data.chatId).emit('receive_message', data);
    });

    socket.on('gig_completed', (data) => {
        socket.to(data.chatId).emit('gig_completed_received', data);
    });

    socket.on('disconnect', () => {
        console.log('😿 A Cat disconnected');
    });
});

// Basic Routes
app.get('/api/health', (req, res) => res.json({ status: 'Pouncing!' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐱 Alab is live on http://0.0.0.0:${PORT}`);
});
