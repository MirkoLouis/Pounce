import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cat, Plus, Sparkles, Zap, Box, Compass, ChevronLeft, ChevronRight, MessageSquare, Briefcase, Search, X, Banknote, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestGigModal from '../components/RequestGigModal';
import GigDetailsModal from '../components/GigDetailsModal';
import ProfileModal from '../components/ProfileModal';
import { useSocket } from '../components/GlobalSetup';
import collegesData from '../data/colleges.json';

/**
 * GigCarousel Component.
 * A horizontal scrolling container for displaying a specific category of gigs.
 * Handles its own pagination and real-time updates for added/updated gigs.
 */
const GigCarousel = ({ title, category, icon: Icon, initialGigs, onGigClick, user, onGigStatusUpdate }) => {
    const scrollRef = useRef(null);
    const [gigs, setGigs] = useState(initialGigs);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const socket = useSocket();

    // Synchronize local gigs when initialGigs prop changes from parent
    useEffect(() => {
        setGigs(initialGigs);
    }, [initialGigs]);

    // Listener for status changes (e.g., OPEN to IN_PROGRESS) to remove/update cards in real-time
    useEffect(() => {
        if (!onGigStatusUpdate) return;
        onGigStatusUpdate((updatedGig) => {
            setGigs(prev => {
                // If a gig is no longer open, it shouldn't be in the general discovery feed
                if (updatedGig.status !== 'OPEN') return prev.filter(g => g._id !== updatedGig._id);
                return prev.map(g => g._id === updatedGig._id ? updatedGig : g);
            });
        });
    }, [onGigStatusUpdate]);

    // Handle incoming real-time gig creation events
    useEffect(() => {
        if (!socket) return;

        const handleNewGig = (newGig) => {
            let shouldAdd = false;
            // Filter logic to decide if the new gig belongs in this specific carousel
            if (category === 'all') shouldAdd = true;
            else if (category === 'recommended' && user && newGig.targeted_expertises.includes(user.course)) shouldAdd = true;
            else if (category === 'misc' && newGig.reward.type === 'CUSTOM') shouldAdd = true;

            if (shouldAdd) {
                setGigs(prev => {
                    if (prev.find(g => g._id === newGig._id)) return prev;
                    const newList = [newGig, ...prev];
                    // Keep the "Live Ticker" extremely concise, others reasonably limited for performance
                    if (category === 'all') return newList.slice(0, 5);
                    return newList.slice(0, 50);
                });
            }
        };

        socket.on('new_gig', handleNewGig);
        return () => socket.off('new_gig', handleNewGig);
    }, [socket, user, category]);

    /**
     * Fetches more gigs for pagination as the user scrolls.
     */
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

    /**
     * Infinite scroll trigger logic.
     */
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollWidth - (scrollLeft + clientWidth) < 300) {
            fetchMore();
        }
    };

    /**
     * Manual arrow navigation for the carousel.
     */
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
                {/* Navigation Arrows: Only shown on hover for cleaner UI */}
                {category !== 'all' && (
                    <>
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
                    </>
                )}

                {/* Horizontal Scroll Area */}
                <div 
                    ref={scrollRef}
                    onScroll={category === 'all' ? undefined : handleScroll}
                    className={`flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 py-2 ${category === 'all' ? 'overflow-hidden' : ''}`}
                >
                    {gigs.map((gig) => (
                        <motion.div 
                            key={gig._id}
                            onClick={() => onGigClick(gig)}
                            whileHover={{ y: -8, rotate: 0.5 }}
                            className="min-w-[calc(20%-1rem)] max-w-[calc(20%-1rem)] h-[220px] bg-white rounded-3xl p-5 shadow-sm border border-slate-100 snap-start flex flex-col justify-between cursor-pointer group/card hover:shadow-xl hover:shadow-orange-100/50 transition-all"
                        >
                            {/* Card Header & Content */}
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-black text-alab-orange uppercase bg-orange-50 px-2 py-0.5 rounded-lg">
                                        {gig.reward?.type}
                                    </span>
                                </div>
                                <h3 className="font-black text-slate-900 line-clamp-1 mb-1 text-base leading-tight group-hover/card:text-alab-orange transition-colors italic">{gig.title}</h3>
                                <p className="text-[13px] text-slate-500 line-clamp-3 leading-snug font-medium">{gig.description}</p>
                            </div>
                            {/* Card Footer: Reward details */}
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
                            No recommended gigs yet 😿
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Dashboard Component.
 * The central hub of the application where users discover gigs, view platform analytics, and manage their profile.
 */
const Dashboard = () => {
    const navigate = useNavigate();
    
    // Core data state
    const [feed, setFeed] = useState({ all: [], recommended: [], php: [], misc: [], random: [] });
    const [stats, setStats] = useState({ OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0 });
    const [analytics, setAnalytics] = useState({ collegeActivity: [], rewardStats: [] });
    const [hasUnread, setHasUnread] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal visibility state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedGig, setSelectedGig] = useState(null);
    
    // Search functionality state
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const socket = useSocket();

    /**
     * Executes real-time search queries as the user types.
     */
    const handleSearch = async (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        
        if (val.trim().length > 2) {
            setSearchLoading(true);
            setIsSearching(true);
            try {
                const res = await api.get(`/gigs/feed?category=all&search=${val}&limit=20`);
                setSearchResults(res.data);
            } catch (err) {
                console.error("Search Error:", err);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    /**
     * Fetches all primary dashboard data on mount.
     */
    const fetchDashboard = async () => {
        try {
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);

            const res = await api.get('/gigs/dashboard');
            setFeed(res.data);
            
            const [chatRes, statsRes, analyticsRes] = await Promise.all([
                api.get('/chat/conversations'),
                api.get('/gigs/stats'),
                api.get('/gigs/analytics')
            ]);
            setHasUnread(chatRes.data.some(c => c.hasUnread));
            setStats(statsRes.data);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            // Fallback for public/guest view or connectivity issues
            const res = await api.get('/gigs/public');
            setFeed({ all: res.data, recommended: [], misc: [], random: res.data });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Global event listeners for system-wide notifications and data refreshes
    useEffect(() => {
        if (!socket) return;

        const handleNewUnread = () => setHasUnread(true);

        const refreshStats = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get('/gigs/stats'),
                    api.get('/gigs/analytics')
                ]);
                setStats(statsRes.data);
                setAnalytics(analyticsRes.data);
            } catch (err) {
                console.error("Stats refresh error:", err);
            }
        };

        const handleGigStatus = (updatedGig) => {
            setSearchResults(prev => prev.filter(g => g._id !== updatedGig._id || updatedGig.status === 'OPEN'));
            refreshStats();
        };

        socket.on('new_conversation', handleNewUnread);
        socket.on('receive_message', handleNewUnread);
        socket.on('new_gig', refreshStats);
        socket.on('gig_status_update', handleGigStatus);
        socket.on('gig_deleted', refreshStats);
        
        return () => {
            socket.off('new_conversation', handleNewUnread);
            socket.off('receive_message', handleNewUnread);
            socket.off('new_gig', refreshStats);
            socket.off('gig_status_update', handleGigStatus);
            socket.off('gig_deleted', refreshStats);
        };
    }, [socket]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header: Core navigation and identity */}
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
                            {hasUnread && (
                                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-alab-orange rounded-full border-2 border-white shadow-sm" />
                            )}
                        </button>

                        <button 
                            onClick={() => navigate('/my-gigs')}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            <Briefcase className="w-6 h-6" />
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
                {/* Hero & Search Section */}
                <div className="px-6 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 italic tracking-tight mb-2">Hello, {user?.name?.split(' ')[0] || 'Cat'}! 🐾</h1>
                        <p className="text-slate-500 text-lg font-bold uppercase tracking-tight opacity-60">{user?.college || 'MSUIIT Pride'}</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchTerm ? 'text-alab-orange' : 'text-slate-400'}`} />
                        <input 
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search for a gig..."
                            className="w-full pl-14 pr-12 py-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 italic"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => { setSearchTerm(''); setIsSearching(false); }}
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Platform Insights: Real-time visualization of gig lifecycle */}
                <div className="px-6 mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="max-w-xs">
                                <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-2">Pride Activity</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    Real-time overview of gig distribution across the university pride.
                                </p>
                            </div>
                            
                            <div className="flex-grow w-full flex flex-col gap-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <span className="block text-2xl font-black text-slate-900">{stats.OPEN + stats.IN_PROGRESS + stats.COMPLETED}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gigs</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-2xl font-black text-green-500">{stats.OPEN}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-2xl font-black text-alab-orange">{stats.IN_PROGRESS}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pounced</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-2xl font-black text-blue-500">{stats.COMPLETED}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
                                    </div>
                                </div>

                                <div className="h-4 w-full bg-slate-50 rounded-full flex overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.OPEN / (stats.OPEN + stats.IN_PROGRESS + stats.COMPLETED || 1)) * 100}%` }}
                                        className="h-full bg-green-400"
                                        title={`Open: ${stats.OPEN}`}
                                    />
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.IN_PROGRESS / (stats.OPEN + stats.IN_PROGRESS + stats.COMPLETED || 1)) * 100}%` }}
                                        className="h-full bg-alab-orange"
                                        title={`In Progress: ${stats.IN_PROGRESS}`}
                                    />
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.COMPLETED / (stats.OPEN + stats.IN_PROGRESS + stats.COMPLETED || 1)) * 100}%` }}
                                        className="h-full bg-blue-400"
                                        title={`Completed: ${stats.COMPLETED}`}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400" /> Open</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-alab-orange" /> Pounced</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" /> Finished</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Colleges Leaderboard */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Top Colleges 🏆</h3>
                        <div className="flex-grow space-y-4">
                            {analytics.collegeActivity.slice(0, 3).map((college, idx) => {
                                const collegeInfo = collegesData.colleges.find(c => c.name === college._id);
                                const acronym = collegeInfo?.acronym || college._id.split(' ').map(w => w[0]).join('');
                                
                                return (
                                    <div key={college._id} className="relative">
                                        <div className="flex justify-between items-center mb-1 relative z-10">
                                            <span className="text-[10px] font-black text-slate-700 uppercase truncate pr-4">{acronym} - {college._id}</span>
                                            <span className="text-[10px] font-black text-alab-orange">{college.totalGigs}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(college.totalGigs / (analytics.collegeActivity[0]?.totalGigs || 1)) * 100}%` }}
                                                className="h-full bg-alab-orange opacity-60"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {analytics.collegeActivity.length === 0 && (
                                <p className="text-[10px] font-bold text-slate-300 uppercase italic py-8 text-center">Waiting for activity...</p>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Conditional Rendering: Search Results vs. Discovery Feed */}
                    {isSearching ? (
                        <motion.div 
                            key="search-results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="px-6 min-h-[400px]"
                        >
                            <div className="flex items-center gap-2 mb-8 text-alab-orange">
                                <Sparkles className="w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight">Search Results for "{searchTerm}"</h2>
                            </div>

                            {searchLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-12 h-12 text-alab-orange animate-spin" />
                                    <p className="font-black text-slate-300 uppercase italic tracking-widest text-xs">Sniffing out matches...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {searchResults.map((gig) => (
                                        <motion.div 
                                            key={gig._id}
                                            onClick={() => setSelectedGig(gig)}
                                            whileHover={{ y: -8 }}
                                            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer group/card hover:shadow-xl hover:shadow-orange-100/50 transition-all aspect-square"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-black text-alab-orange uppercase bg-orange-50 px-3 py-1 rounded-full">
                                                        {gig.reward?.type}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 line-clamp-2 mb-3 leading-tight group-hover/card:text-alab-orange transition-colors italic">{gig.title}</h3>
                                                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">{gig.description}</p>
                                            </div>
                                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-black text-slate-900">
                                                        {gig.reward?.type === 'PHP' ? `₱${gig.reward?.value}` : gig.reward?.value}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 group-hover/card:text-alab-orange transition-colors uppercase tracking-widest">
                                                        Pounce!
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                    <Cat className="w-20 h-20 opacity-10 mb-6" />
                                    <h3 className="text-xl font-black text-slate-900 italic uppercase">No gigs found 😿</h3>
                                    <p className="font-bold text-slate-400 text-sm mt-2">Try searching for a different gig...</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="dashboard-feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Discovery Feed: Categorized carousels for easy browsing */}
                            <GigCarousel title="Recommended" category="recommended" icon={Sparkles} initialGigs={feed.recommended} onGigClick={setSelectedGig} user={user} onGigStatusUpdate={(cb) => socket?.on('gig_status_update', cb)} />
                            <GigCarousel title="Live Ticker" category="all" icon={Zap} initialGigs={feed.all} onGigClick={setSelectedGig} user={user} onGigStatusUpdate={(cb) => socket?.on('gig_status_update', cb)} />
                            <div className="relative">
                                <GigCarousel title="PHP Rewards" category="php" icon={Banknote} initialGigs={feed.php} onGigClick={setSelectedGig} user={user} onGigStatusUpdate={(cb) => socket?.on('gig_status_update', cb)} />
                            </div>
                            <GigCarousel title="Misc Rewards" category="misc" icon={Box} initialGigs={feed.misc} onGigClick={setSelectedGig} user={user} onGigStatusUpdate={(cb) => socket?.on('gig_status_update', cb)} />
                            <GigCarousel title="Random Jobs" category="random" icon={Compass} initialGigs={feed.random} onGigClick={setSelectedGig} user={user} onGigStatusUpdate={(cb) => socket?.on('gig_status_update', cb)} />

                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Floating Action Button: Rapid gig creation entry point */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-10 right-10 w-20 h-20 bg-alab-orange hover:bg-orange-600 text-white rounded-3xl shadow-2xl shadow-orange-300 flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 group z-40"
            >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform mb-1" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Request</span>
            </button>

            {/* Application Modals */}
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
