import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Cat, Lock, Mail, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [publicGigs, setPublicGigs] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const fetchGigs = async () => {
            try {
                const res = await api.get('/gigs/public');
                setPublicGigs(res.data);
            } catch (err) {
                console.error("❌ Alab Alert: Could not connect to the backend server.");
                console.dir(err);
            }
        };
        fetchGigs();
        const interval = setInterval(fetchGigs, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { msu_email: email, password });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.msg || "Login failed");
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-50 flex items-center justify-center overflow-hidden font-sans">
            {/* Background Animation - Floating Gig Cards */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <AnimatePresence>
                    {publicGigs.map((gig, idx) => (
                        <motion.div
                            key={gig._id} // Stable key for smooth transition
                            initial={{ 
                                opacity: 0, 
                                scale: 0.8,
                                x: `${(idx * 7) % 100}vw`, // Deterministic but spread out
                                y: "110vh" 
                            }}
                            animate={{ 
                                y: "-20vh",
                                opacity: 0.9,
                                scale: 1
                            }}
                            exit={{ 
                                opacity: 0,
                                scale: 0.5,
                                transition: { duration: 2 }
                            }}
                            transition={{ 
                                duration: 25 + (idx % 10) * 5, 
                                repeat: Infinity, 
                                ease: "linear",
                                delay: (idx % 20) * 0.5 
                            }}
                            className="absolute bg-white/70 p-3 rounded-xl shadow-lg border border-white/80 w-44 min-h-[7rem] h-auto flex flex-col justify-between backdrop-blur-[4px]"
                        >
                            <p className="text-[9px] font-black text-alab-orange uppercase truncate tracking-tighter mb-1">{gig.requester?.college}</p>
                            <div className="flex-grow overflow-hidden">
                                <p className="text-[11px] font-bold line-clamp-3 leading-tight text-slate-900 break-words">{gig.title}</p>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-600 mt-2 pt-1 border-t border-slate-200/50">
                                <span className="font-black text-slate-800">₱{gig.reward?.value}</span>
                                <span className="opacity-40 italic font-bold">Pounce!</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>


            {/* Login Card */}
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-alab-orange rounded-full mb-4 shadow-lg shadow-orange-200">
                        <Cat className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Pounce</h1>
                    <p className="text-slate-500">Connecting MSUIIT's brightest CATS.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">MSUIIT Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input 
                                type="email" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-alab-orange transition-all"
                                placeholder="name@g.msuiit.edu.ph"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-alab-orange transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-4 bg-alab-orange hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 group transition-all transform active:scale-95"
                    >
                        Start Pouncing
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-slate-500">
                    Not a member of the pride yet? <Link to="/register" className="text-alab-orange font-bold hover:underline">Sign up</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
