import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, GraduationCap, Briefcase, Zap, CheckCircle2, Loader2, Maximize2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Detail modal for gigs.
 * Handles 'Pounce' action to start chats and fullscreen image preview.
 */
const GigDetailsModal = ({ gig, isOpen, onClose }) => {
    const navigate = useNavigate();
    
    // UI states for async actions, image loading, and fullscreen preview
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Reset image loading on gig change
    React.useEffect(() => {
        if (gig?.images?.length > 0) {
            setImageLoading(true);
        } else {
            setImageLoading(false);
        }
        setIsFullscreen(false); // Reset fullscreen state when gig changes
    }, [gig]);

    // Guard against empty/closed state
    if (!isOpen || !gig) return null;

    /**
     * Create/Retrieve conversation and redirect to chat.
     */
    const handlePounce = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/gigs/pounce/${gig._id}`);
            
            // Check if first pounce to trigger intro message
            const isFirstPounce = res.data.msg.toLowerCase().includes("pounce successful");
            
            onClose();
            // Redirect with conversation context
            navigate(`/chat?id=${res.data.conversationId}${isFirstPounce ? '&pounce=true' : ''}`);
        } catch (err) {
            alert(err.response?.data?.msg || "Error during pounce");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop for the modal */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px]"
                >
                    {/* Image Section: Visual representation of the gig */}
                    <div className="md:w-1/2 bg-white relative overflow-hidden group cursor-zoom-in" onClick={() => setIsFullscreen(true)}>
                        {gig.images && gig.images.length > 0 ? (
                            <>
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                        <Loader2 className="w-10 h-10 text-alab-orange animate-spin opacity-20" />
                                    </div>
                                )}
                                <img 
                                    src={gig.images[0]} 
                                    alt={gig.title}
                                    onLoad={() => setImageLoading(false)}
                                    className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                />
                                {/* Fullscreen Hint */}
                                <div className="absolute bottom-4 left-4 p-2 bg-white/20 backdrop-blur rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <Briefcase className="w-20 h-20 opacity-20" />
                                <span className="font-black italic uppercase tracking-widest text-sm opacity-40">No Images Provided</span>
                            </div>
                        )}
                    </div>

                    {/* Content Section: Detailed gig information */}
                    <div className="md:w-1/2 flex flex-col h-full bg-white relative">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur shadow-sm rounded-full hover:bg-white transition-all z-10"
                        >
                            <X className="w-5 h-5 text-slate-900" />
                        </button>

                        <div className="p-6 md:p-8 overflow-y-auto bg-white">
                            {/* Header: Title and Requester info */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 bg-orange-50 text-alab-orange text-[9px] font-black uppercase tracking-widest rounded-full">
                                        {gig.reward?.type} REWARD
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter leading-tight mb-3">
                                    {gig.title}
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-black text-slate-400 uppercase tracking-widest leading-none">Requester</p>
                                            <p className="text-md font-black text-slate-900">{gig.requester?.name || "The Cat"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description: Task context */}
                            <div className="mb-4 p-4 bg-white rounded-[1.5rem] border border-slate-100">
                                <h3 className="text-[16px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-alab-orange" /> Gig Details
                                </h3>
                                <p className="text-slate-600 font-medium leading-relaxed text-xs">
                                    {gig.description}
                                </p>
                            </div>

                            {/* Info Rows: Requirements and Rewards */}
                            <div className="flex flex-col gap-3 mb-6">
                                {/* Filter for college programs */}
                                <div className="p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GraduationCap className="w-4 h-4 text-alab-orange" />
                                        <p className="text-[16px] font-black text-slate-400 uppercase tracking-widest">Targeted Expertise</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {gig.targeted_expertises && gig.targeted_expertises.length > 0 ? (
                                            gig.targeted_expertises.map((expertise, index) => (
                                                <p key={index} className="text-[12px] font-black text-slate-900 italic border-l-2 border-orange-100 pl-3 py-0.5 leading-tight">
                                                    {expertise}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-xs font-black text-slate-900 italic">Open to All Programs</p>
                                        )}
                                    </div>
                                </div>

                                {/* Reward info */}
                                <div className="p-4 bg-alab-orange text-white rounded-[1.5rem] shadow-xl shadow-orange-100">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Zap className="w-4 h-4 text-orange-100" />
                                        <p className="text-[12px] font-black text-orange-100 uppercase tracking-widest">Payout</p>
                                    </div>
                                    <p className="text-lg font-black italic leading-tight">
                                        {gig.reward?.type === 'PHP' ? `₱${gig.reward?.value}` : gig.reward?.value}
                                    </p>
                                </div>
                            </div>

                            {/* Action Area: Interaction buttons */}
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handlePounce}
                                    disabled={loading}
                                    className="flex-grow py-4 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 group flex items-center justify-center gap-3"
                                >
                                    {loading ? "Pouncing..." : (
                                        <>
                                            Pounce? 🐾
                                            <CheckCircle2 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Fullscreen Overlay */}
            <AnimatePresence>
                {isFullscreen && gig.images?.[0] && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 md:p-12"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={gig.images[0]} 
                            alt="Fullscreen Preview"
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GigDetailsModal;
