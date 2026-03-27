const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io } = require('socket.io-client');
const axios = require('axios');
const User = require('./models/User');
const Gig = require('./models/Gig');
const Conversation = require('./models/Conversation');
const { faker } = require('@faker-js/faker');
const crypto = require('node:crypto').webcrypto;

// Configuration for bot simulation behavior
const SERVER_URL = 'http://localhost:5000';
const NUM_BOTS = 50; // Use 50 active bots for chaotic realism

// Predefined messages to simulate natural chat interactions
const CHAT_MESSAGES = [
    "Hey! I can help with this.", "Is this still available?", "I have experience with this kind of task.",
    "When do you need this done?", "Can we discuss the reward?", "I'm ready to pounce!",
    "Just let me know the details.", "I'm from the same college, I can definitely help!",
    "Sounds like a plan.", "Great! I'll get started right away.", "Mission accomplished!",
    "Just finished the task. Please check.", "Thanks for the opportunity!", "Pouncing now!", "On it!"
];

/**
 * Initializes End-to-End Encryption for a bot user.
 * Generates ECDH keys to allow secure communication with other users.
 */
async function setupE2EE(user) {
    const keyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
    const exported = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = Buffer.from(exported).toString('base64');
    await User.findByIdAndUpdate(user._id, { publicKey: publicKeyBase64 });
    return keyPair;
}

/**
 * Encrypts a text message using a shared AES-GCM key.
 * Ensures that bot messages follow the platform's E2EE protocol.
 */
async function encrypt(text, sharedKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encodedText);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return Buffer.from(combined).toString('base64');
}

/**
 * Derives a shared secret between the bot and another user.
 * Necessary for participating in encrypted conversations.
 */
async function deriveSecret(privateKey, otherPubKeyBase64) {
    const binaryKey = Buffer.from(otherPubKeyBase64, 'base64');
    const importedPubKey = await crypto.subtle.importKey("spki", binaryKey, { name: "ECDH", namedCurve: "P-256" }, true, []);
    return await crypto.subtle.deriveKey({ name: "ECDH", public: importedPubKey }, privateKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

/**
 * Orchestrates a single bot's lifecycle.
 * Manages socket connections, state, and decision-making logic.
 */
async function startBot(user) {
    // Initialize security context
    const keyPair = await setupE2EE(user);
    const token = jwt.sign({ id: user._id, course: user.course }, process.env.JWT_SECRET);
    const socket = io(SERVER_URL, { path: '/api/socket.io', auth: { token } });
    
    // Tracking bot identity and active session state
    let botId = `🤖 ${user.name.split(' ')[0]}`;
    let activeSharedKeys = new Map();
    let myCurrentGig = null; // Memory of what I'm currently working on

    socket.on('connect', () => console.log(`${botId} is now active.`));

    /**
     * Core decision loop for the bot.
     * Randomly chooses between chatting, posting new gigs, or fulfilling existing ones.
     */
    const runAction = async () => {
        const rand = Math.random();

        try {
            // PHASE 1: CHAT & COMPLETE (Logic for when the bot is already engaged in a gig)
            if (myCurrentGig) {
                const gigCheck = await Gig.findById(myCurrentGig._id);
                if (!gigCheck || gigCheck.status !== 'IN_PROGRESS') {
                    myCurrentGig = null; // Reset if gig status changed externally
                } else {
                    // Simulate active communication during the task
                    if (rand < 0.40) {
                        const conv = await Conversation.findOne({ gig: myCurrentGig._id }).populate('members', 'publicKey');
                        if (conv) {
                            const otherMember = conv.members.find(m => m._id.toString() !== user._id.toString());
                            if (otherMember && otherMember.publicKey) {
                                let sharedKey = activeSharedKeys.get(conv._id.toString());
                                if (!sharedKey) {
                                    sharedKey = await deriveSecret(keyPair.privateKey, otherMember.publicKey);
                                    activeSharedKeys.set(conv._id.toString(), sharedKey);
                                }
                                const msgText = faker.helpers.arrayElement(CHAT_MESSAGES);
                                const encryptedPayload = await encrypt(msgText, sharedKey);
                                socket.emit('send_message', { chatId: conv._id, sender: user._id, encryptedPayload, timestamp: new Date() });
                                console.log(`${botId} 💬 WHISPERED.`);
                            }
                        }
                    }
                    
                    // Logic to finalize a gig to simulate completed transactions
                    if (rand > 0.90) {
                        const requester = await User.findById(myCurrentGig.requester);
                        const reqToken = jwt.sign({ id: requester._id, course: requester.course }, process.env.JWT_SECRET);
                        await axios.post(`${SERVER_URL}/api/gigs/complete/${myCurrentGig._id}`, {}, {
                            headers: { 'x-auth-token': reqToken }
                        });
                        console.log(`✅ GIG FINISHED: "${myCurrentGig.title}"`);
                        myCurrentGig = null;
                    }
                }
            } 
            
            // PHASE 2: IDLE ACTIONS (Logic for when the bot is looking for work or needs help)
            else {
                // Creates a new gig to populate the marketplace
                if (rand < 0.25) {
                    const title = faker.hacker.phrase();
                    const isPHP = Math.random() > 0.3;
                    const reward = {
                        type: isPHP ? 'PHP' : 'CUSTOM',
                        value: isPHP ? faker.commerce.price({ min: 100, max: 1000 }) : "Coffee treat"
                    };

                    await axios.post(`${SERVER_URL}/api/gigs`, {
                        title,
                        description: faker.lorem.paragraph().substring(0, 500),
                        reward,
                        targeted_expertises: [user.course],
                        images: []
                    }, { headers: { 'x-auth-token': token } });
                    console.log(`${botId} 📢 NEW GIG: "${title}"`);
                } 
                // Accepts an open gig to simulate platform activity
                else if (rand < 0.40) {
                    const randomGigs = await Gig.aggregate([
                        { $match: { status: 'OPEN', requester: { $ne: user._id } } },
                        { $sample: { size: 1 } }
                    ]);
                    if (randomGigs[0]) {
                        const target = randomGigs[0];
                        const res = await axios.post(`${SERVER_URL}/api/gigs/pounce/${target._id}`, {}, {
                            headers: { 'x-auth-token': token }
                        });
                        if (res.status === 200) {
                            myCurrentGig = target;
                            console.log(`${botId} 🐾 POUNCED: "${target.title}"`);
                        }
                    }
                }
            }
        } catch (e) {
            // Silently handle errors to keep the simulation running smoothly
        }

        // Schedule next action with random jitter to avoid synchronized behavior
        setTimeout(runAction, 2000 + Math.random() * 3000);
    };

    runAction();
}

/**
 * Entry point for the bot swarm.
 * Connects to the database and initializes multiple bot routines.
 */
async function startSwarm() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🐾 Swarm Engine V5 (Fully Independent Bots) Initialized...');

    // Select a subset of users to act as bots
    const users = await User.find({ msu_email: { $ne: 'monitor@g.msuiit.edu.ph' } }).limit(NUM_BOTS);
    
    console.log(`🚀 Launching ${users.length} independent bot routines...`);
    for (const user of users) {
        // Staggered starts to prevent overwhelming the server on startup
        setTimeout(() => startBot(user), Math.random() * 5000);
    }
}

// Kick off the simulation
startSwarm();
