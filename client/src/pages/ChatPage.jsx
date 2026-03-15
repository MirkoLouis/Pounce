import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cat, Send, User as UserIcon, Briefcase, ShieldCheck, Search, MessageSquareQuote, Lock, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import * as crypto from '../services/crypto';

const ChatPage = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [sharedKey, setSharedKey] = useState(null);
    const [gigStatus, setGigStatus] = useState('IN_PROGRESS');
    
    const socketRef = useRef();
    const scrollRef = useRef();
    const myKeyPair = useRef(null);

    useEffect(() => {
        socketRef.current = io('/', { path: '/api/socket.io' });

        const setup = async () => {
            try {
                myKeyPair.current = await crypto.generateKeyPair();
                const pubKeyBase64 = await crypto.exportPublicKey(myKeyPair.current.publicKey);

                const userRes = await api.get('/auth/me');
                setCurrentUser(userRes.data);

                await api.put('/auth/profile', { publicKey: pubKeyBase64 });

                const res = await api.get('/chat/conversations');
                setConversations(res.data);
            } catch (err) {
                console.error("Setup Error:", err);
            }
        };
        setup();

        return () => socketRef.current.disconnect();
    }, []);

    useEffect(() => {
        if (selectedChat && currentUser) {
            socketRef.current.emit('join_chat', selectedChat._id);
            setMessages([]);
            setSharedKey(null);
            setGigStatus(selectedChat.gig?.status || 'IN_PROGRESS');

            const performHandshake = async () => {
                const otherCat = selectedChat.members.find(m => m._id !== currentUser._id);
                if (otherCat?.publicKey) {
                    try {
                        const importedPubKey = await crypto.importPublicKey(otherCat.publicKey);
                        const derived = await crypto.deriveSharedSecret(myKeyPair.current.privateKey, importedPubKey);
                        setSharedKey(derived);
                    } catch (err) {
                        console.error("Handshake Failed:", err);
                    }
                }
            };
            performHandshake();
        }
    }, [selectedChat, currentUser]);

    useEffect(() => {
        const handleNewMessage = async (data) => {
            if (data.chatId === selectedChat?._id && sharedKey) {
                const decryptedText = await crypto.decryptMessage(data.encryptedPayload, sharedKey);
                setMessages(prev => [...prev, { ...data, text: decryptedText }]);
            }
        };

        const handleGigCompleted = (data) => {
            if (data.chatId === selectedChat?._id) {
                setGigStatus('COMPLETED');
            }
        };

        socketRef.current.on('receive_message', handleNewMessage);
        socketRef.current.on('gig_completed_received', handleGigCompleted);
        return () => {
            socketRef.current.off('receive_message');
            socketRef.current.off('gig_completed_received');
        };
    }, [selectedChat, sharedKey]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedChat || !sharedKey || gigStatus === 'COMPLETED') return;

        const encryptedPayload = await crypto.encryptMessage(message, sharedKey);
        const messageData = {
            chatId: selectedChat._id,
            sender: currentUser._id,
            encryptedPayload,
            timestamp: new Date()
        };

        socketRef.current.emit('send_message', messageData);
        setMessages(prev => [...prev, { ...messageData, text: message }]);
        setMessage('');
    };

    const handleCompleteGig = async () => {
        if (!window.confirm("Mark this gig as done and confirm payment? 🐾")) return;
        
        try {
            await api.post(`/gigs/complete/${selectedChat.gig._id}`);
            setGigStatus('COMPLETED');
            socketRef.current.emit('gig_completed', { chatId: selectedChat._id });
        } catch (err) {
            alert("Error completing gig");
        }
    };

    const isRequester = selectedChat?.gig?.requester === currentUser?._id;

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden text-slate-900">
            {/* Sidebar */}
            <div className="w-full md:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-6 text-slate-900">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="w-10 h-10 bg-alab-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                                <Cat className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-black italic tracking-tighter uppercase">Pounce Inbox</span>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Search chats..."
                            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto no-scrollbar px-4 space-y-2">
                    {conversations.map((chat) => (
                        <div 
                            key={chat._id}
                            onClick={() => setSelectedChat(chat)}
                            className={`p-4 rounded-[2rem] cursor-pointer transition-all border-2 ${
                                selectedChat?._id === chat._id 
                                ? 'bg-white border-alab-orange shadow-xl shadow-orange-100/50 scale-[1.02]' 
                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-2xl flex-shrink-0 flex items-center justify-center relative">
                                    <UserIcon className="w-6 h-6 text-slate-400" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                </div>
                                <div className="min-w-0 flex-grow">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="font-black text-slate-900 truncate text-sm uppercase italic tracking-tight">{chat.gig?.title}</h4>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 truncate uppercase">
                                        {chat.members.find(m => m._id !== currentUser?._id)?.name || "Squad Chat"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-grow flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-alab-orange">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg leading-tight uppercase italic">{selectedChat.gig?.title}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {gigStatus === 'COMPLETED' ? (
                                            <>
                                                <PartyPopper className="w-3.5 h-3.5 text-green-500" />
                                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Project Completed 🐾</span>
                                            </>
                                        ) : sharedKey ? (
                                            <>
                                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Whisper P2P Active</span>
                                            </>
                                        ) : selectedChat?.members.find(m => m._id !== currentUser?._id)?.publicKey ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-alab-orange rounded-full animate-spin" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Handshaking...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Waiting for Cat to come online...</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {isRequester && gigStatus !== 'COMPLETED' && (
                                <button 
                                    onClick={handleCompleteGig}
                                    className="px-6 py-2 bg-alab-orange hover:bg-orange-600 text-white shadow-lg shadow-orange-100 rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter active:scale-95"
                                >
                                    Done & Paid 🐾
                                </button>
                            )}
                        </div>

                        <div ref={scrollRef} className="flex-grow overflow-y-auto p-10 space-y-4 no-scrollbar bg-slate-50/20">
                            {gigStatus === 'COMPLETED' && (
                                <div className="flex flex-col items-center mb-8">
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        className="p-6 bg-green-50 border border-green-100 rounded-[2.5rem] shadow-sm text-center max-w-xs"
                                    >
                                        <PartyPopper className="w-8 h-8 text-green-500 mx-auto mb-3" />
                                        <h4 className="text-green-900 font-black text-xs uppercase italic tracking-tighter mb-1">Mission Accomplished!</h4>
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-relaxed">
                                            The requester has confirmed the completion of this gig.
                                        </p>
                                    </motion.div>
                                </div>
                            )}

                            {messages.length === 0 && gigStatus !== 'COMPLETED' && (
                                <div className="flex flex-col items-center mb-8">
                                    <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-center max-w-xs">
                                        <Lock className="w-8 h-8 text-alab-orange mx-auto mb-3 opacity-20" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                            This is a WhisperSquad secure channel. Messages are encrypted locally and never visible to the server.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === currentUser?._id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-4 rounded-3xl font-medium text-sm shadow-sm ${
                                        msg.sender === currentUser?._id 
                                        ? 'bg-alab-orange text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-white border-t border-slate-50">
                            <form className="relative flex items-center gap-4" onSubmit={handleSendMessage}>
                                <div className="flex-grow relative">
                                    <input 
                                        value={message}
                                        disabled={!sharedKey || gigStatus === 'COMPLETED'}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={gigStatus === 'COMPLETED' ? "Chat disabled for completed gigs" : sharedKey ? "Whisper to the squad..." : "Establishing secure link..."}
                                        className="w-full pl-6 pr-16 py-5 bg-slate-50 rounded-[2rem] border-none focus:ring-2 focus:ring-alab-orange outline-none font-medium transition-all disabled:opacity-50"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!sharedKey || !message.trim() || gigStatus === 'COMPLETED'}
                                        className="absolute right-3 top-2.5 p-3 bg-alab-orange text-white rounded-[1.5rem] hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-90 disabled:opacity-30 disabled:grayscale"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                        <Cat className="w-20 h-20 opacity-10 mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 italic tracking-tight mb-2 uppercase">Silence in the pride</h3>
                        <p className="max-w-xs font-bold text-slate-400 text-sm">Select a squad from the left to start whispering securely.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
