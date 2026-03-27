import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cat, Trash2, MessageSquare, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';

const MyGigs = () => {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);

    // Synchronize user profile and their submitted gigs for management
    const fetchData = async () => {
        try {
            const [userRes, gigsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/gigs/my')
            ]);
            setUser(userRes.data);
            setGigs(gigsRes.data);
        } catch (err) {
            console.error("Fetch My Gigs Error:", err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Perform permanent deletion of a gig request with user confirmation
    const handleDelete = async (gigId) => {
        if (!window.confirm("Are you sure you want to delete this request? 😿")) return;
        
        setIsDeleting(gigId);
        try {
            await api.delete(`/gigs/${gigId}`);
            setGigs(prev => prev.filter(g => g._id !== gigId));
        } catch (err) {
            alert("Failed to delete gig");
            console.error(err);
        } finally {
            setIsDeleting(null);
        }
    };

    // Full-screen loading state for initial data retrieval
    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
                <Loader2 className="w-12 h-12 text-alab-orange animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-sm italic">Gathering your requests...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Minimal Header for secondary navigation */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Cat className="w-10 h-10 text-alab-orange" />
                            <span className="text-3xl font-black text-slate-900 italic tracking-tighter">My Gigs</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/chat')}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative"
                        >
                            <MessageSquare className="w-6 h-6" />
                        </button>

                        <div 
                            onClick={() => setIsProfileOpen(true)}
                            className="w-12 h-12 bg-alab-orange rounded-2xl flex items-center justify-center text-white font-black border-4 border-white shadow-lg shadow-orange-200 cursor-pointer hover:rotate-6 transition-transform uppercase select-none"
                        >
                            {user?.name?.charAt(0) || 'C'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Management Interface - Displays list of user-owned gigs */}
            <main className="max-w-4xl mx-auto pt-12 px-6">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tight mb-2">Manage Your Requests 🐾</h1>
                    <p className="text-slate-500 text-lg font-bold uppercase tracking-tight opacity-60">You have {gigs.length} active or past requests</p>
                </div>

                <div className="grid gap-6">
                    {gigs.map((gig) => (
                        <motion.div 
                            layout
                            key={gig._id}
                            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                        >
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                        gig.status === 'OPEN' ? 'bg-green-50 text-green-600' : 
                                        gig.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {gig.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] font-black text-alab-orange uppercase bg-orange-50 px-3 py-1 rounded-full">
                                        {gig.reward?.type === 'PHP' ? `₱${gig.reward?.value}` : gig.reward?.value}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 italic">{gig.title}</h3>
                                <p className="text-slate-500 font-medium line-clamp-2 max-w-xl">{gig.description}</p>
                            </div>

                            {/* Contextual actions: Deletion only available for OPEN gigs */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {gig.status === 'OPEN' && (
                                    <button 
                                        onClick={() => handleDelete(gig._id)}
                                        disabled={isDeleting === gig._id}
                                        className="p-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-3xl transition-all active:scale-95 disabled:opacity-50"
                                        title="Delete Request"
                                    >
                                        {isDeleting === gig._id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                                    </button>
                                )}
                                {gig.status !== 'OPEN' && (
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase italic px-4">
                                        <AlertCircle className="w-4 h-4" />
                                        Locked
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Empty state placeholder with CTA */}
                    {gigs.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Cat className="w-20 h-20 opacity-10 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 italic uppercase">No requests yet</h3>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="mt-4 text-alab-orange font-black uppercase tracking-widest text-sm hover:underline"
                            >
                                Post your first gig 🐾
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence mode="wait">
                {isProfileOpen && (
                    <ProfileModal 
                        user={user}
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                        onUpdate={(updatedUser) => setUser(populatedUser => ({...populatedUser, ...updatedUser}))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyGigs;
