import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cat, Plus, Sparkles, Zap, Box, Compass, ChevronLeft, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestGigModal from '../components/RequestGigModal';
import GigDetailsModal from '../components/GigDetailsModal';
import ProfileModal from '../components/ProfileModal';
import { useSocket } from '../components/GlobalSetup';

const GigCarousel = ({ title, category, icon: Icon, initialGigs, onGigClick, user }) => {
    const scrollRef = useRef(null);
    const [gigs, setGigs] = useState(initialGigs);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        setGigs(initialGigs);
    }, [initialGigs]);

    // Handle Real-time updates for THIS carousel
    useEffect(() => {
        if (!socket) return;

        const handleNewGig = (newGig) => {
            let shouldAdd = false;
            if (category === 'all') shouldAdd = true;
            else if (category === 'recommended' && user && newGig.targeted_expertises.includes(user.course)) shouldAdd = true;
            else if (category === 'misc' && newGig.reward.type === 'CUSTOM') shouldAdd = true;

            if (shouldAdd) {
                setGigs(prev => {
                    if (prev.find(g => g._id === newGig._id)) return prev;
                    return [newGig, ...prev];
                });
            }
        };

        const handleGigStatusUpdate = (updatedGig) => {
            setGigs(prev => {
                // If it's no longer OPEN, remove it from all carousels (since they usually show OPEN gigs)
                if (updatedGig.status !== 'OPEN') {
                    return prev.filter(g => g._id !== updatedGig._id);
                }
                // If it's still open but details changed, update it
                return prev.map(g => g._id === updatedGig._id ? updatedGig : g);
            });
        };

        socket.on('new_gig', handleNewGig);
        socket.on('gig_status_update', handleGigStatusUpdate);

        return () => {
            socket.off('new_gig', handleNewGig);
            socket.off('gig_status_update', handleGigStatusUpdate);
        };
    }, [socket, user, category]);

    const fetchMore = useCallback(async () => {
        if (loading || !hasMore || category === 'random') return;
        setLoading(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/gigs/feed?category=${category}&page=${nextPage}&limit=10`);
            
            if (res.data.length === 0) {
                setHasMore(false);
            } else {
                setGigs(prev => {
                    // Filter out any duplicates that might have been added by real-time events
                    const existingIds = new Set(prev.map(g => g._id));
                    const newGigs = res.data.filter(g => !existingIds.has(g._id));
                    return [...prev, ...newGigs];
                });
                setPage(nextPage);
            }
        } catch (err) {
            console.error("Fetch more error:", err);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore, category]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If we're within 200px of the end, fetch more
        if (scrollWidth - (scrollLeft + clientWidth) < 300) {
            fetchMore();
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-12 relative group">
            <div className="flex items-center gap-2 mb-4 px-6 text-alab-orange">
                <Icon className="w-6 h-6" />
                <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">{title}</h2>
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => scroll('left')}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                >
                    <ChevronRight className="w-6 h-6 text-slate-600" />
                </button>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 py-2"
                >
                    {gigs.map((gig) => (
                        <motion.div 
                            key={gig._id}
                            onClick={() => onGigClick(gig)}
                            whileHover={{ y: -8, rotate: 0.5 }}
                            className="min-w-[calc(20%-1rem)] max-w-[calc(20%-1rem)] h-[220px] bg-white rounded-3xl p-5 shadow-sm border border-slate-100 snap-start flex flex-col justify-between cursor-pointer group/card hover:shadow-xl hover:shadow-orange-100/50 transition-all"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-black text-alab-orange uppercase bg-orange-50 px-2 py-0.5 rounded-lg">
                                        {gig.reward?.type}
                                    </span>
                                </div>
                                <h3 className="font-black text-slate-900 line-clamp-1 mb-1 text-base leading-tight group-hover/card:text-alab-orange transition-colors italic">{gig.title}</h3>
                                <p className="text-[13px] text-slate-500 line-clamp-3 leading-snug font-medium">{gig.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-50">
                                <div className="h-8 flex items-center">
                                    <span className="text-[13px] font-black text-slate-900 line-clamp-2 leading-tight">
                                        {gig.reward?.type === 'PHP' ? `₱${gig.reward?.value}` : gig.reward?.value}
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 group-hover/card:text-alab-orange transition-colors uppercase tracking-widest">
                                    Pounce!
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="min-w-[100px] flex items-center justify-center p-10">
                            <Loader2 className="w-8 h-8 text-alab-orange animate-spin" />
                        </div>
                    )}
                    {gigs.length === 0 && !loading && (
                        <div className="min-w-[300px] h-[200px] flex items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl italic">
                            No gigs here yet 😿
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [feed, setFeed] = useState({ all: [], recommended: [], misc: [], random: [] });
    const [conversationsCount, setConversationsCount] = useState(0);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedGig, setSelectedGig] = useState(null);
    const socket = useSocket();

    const fetchDashboard = async () => {
        try {
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);

            const res = await api.get('/gigs/dashboard');
            setFeed(res.data);
            
            const chatRes = await api.get('/chat/conversations');
            setConversationsCount(chatRes.data.length);
        } catch (err) {
            const res = await api.get('/gigs/public');
            setFeed({ all: res.data, recommended: [], misc: [], random: res.data });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Listen for new conversations to update the notification dot
    useEffect(() => {
        if (!socket) return;

        const handleNewConversation = () => {
            setConversationsCount(prev => prev + 1);
        };

        socket.on('new_conversation', handleNewConversation);
        return () => socket.off('new_conversation', handleNewConversation);
    }, [socket]);

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Cat className="w-10 h-10 text-alab-orange" />
                        <span className="text-3xl font-black text-slate-900 italic tracking-tighter">Pounce</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/chat')}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative"
                        >
                            <MessageSquare className="w-6 h-6" />
                            {conversationsCount > 0 && (
                                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-alab-orange rounded-full border-2 border-white shadow-sm" />
                            )}
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

            <main className="max-w-7xl mx-auto pt-12 text-slate-900">
                <div className="px-6 mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 italic tracking-tight mb-2">Hello, {user?.name?.split(' ')[0] || 'Cat'}! 🐾</h1>
                        <p className="text-slate-500 text-lg font-bold uppercase tracking-tight opacity-60">{user?.college || 'MSUIIT Pride'}</p>
                    </div>
                </div>

                <GigCarousel title="Recommended" category="recommended" icon={Sparkles} initialGigs={feed.recommended} onGigClick={setSelectedGig} user={user} />
                <GigCarousel title="Live Ticker" category="all" icon={Zap} initialGigs={feed.all} onGigClick={setSelectedGig} user={user} />
                <GigCarousel title="Misc Rewards" category="misc" icon={Box} initialGigs={feed.misc} onGigClick={setSelectedGig} user={user} />
                <GigCarousel title="Random Jobs" category="random" icon={Compass} initialGigs={feed.random} onGigClick={setSelectedGig} user={user} />
            </main>

            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-10 right-10 w-20 h-20 bg-alab-orange hover:bg-orange-600 text-white rounded-3xl shadow-2xl shadow-orange-300 flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 group z-40"
            >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform mb-1" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Request</span>
            </button>

            {/* Modals */}
            <AnimatePresence mode="wait">
                {isModalOpen && (
                    <RequestGigModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                        onGigCreated={fetchDashboard}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {selectedGig && (
                    <GigDetailsModal 
                        gig={selectedGig} 
                        isOpen={!!selectedGig} 
                        onClose={() => setSelectedGig(null)} 
                    />
                )}
            </AnimatePresence>

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

export default Dashboard;
