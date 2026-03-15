import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Mail, GraduationCap, MessageSquare, LogOut, Check, ArrowRight } from 'lucide-react';
import collegeData from '../data/colleges.json';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState({ name: false, academic: false, message: false, security: false });
    
    // Local states for each section
    const [nameParts, setNameParts] = useState({ first: '', middle: '', last: '' });
    const [academic, setAcademic] = useState({ college: '', course: '' });
    const [pounceMsg, setPounceMsg] = useState('');
    const [security, setSecurity] = useState({ password: '', confirmPassword: '' });

    useEffect(() => {
        if (user) {
            const parts = user.name.split(' ');
            let first = parts[0] || '';
            let middle = '';
            let last = '';
            if (parts.length === 3) {
                middle = parts[1].replace('.', '');
                last = parts[2];
            } else if (parts.length === 2) {
                last = parts[1];
            }

            setNameParts({ first, middle, last });
            setAcademic({ college: user.college, course: user.course });
            setPounceMsg(user.auto_pounce_message);
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const updateSection = async (section, data) => {
        setLoading(prev => ({ ...prev, [section]: true }));
        try {
            const res = await api.put('/auth/profile', data);
            onUpdate(res.data.user);
            // Clear passwords if security was updated
            if (section === 'security') setSecurity({ password: '', confirmPassword: '' });
        } catch (err) {
            alert(err.response?.data?.msg || "Update failed");
        } finally {
            setLoading(prev => ({ ...prev, [section]: false }));
        }
    };

    const hasNameChanged = () => {
        const fullName = `${nameParts.first} ${nameParts.middle ? nameParts.middle + '. ' : ''}${nameParts.last}`.trim();
        return fullName !== user?.name;
    };

    const hasAcademicChanged = () => {
        return academic.college !== user?.college || academic.course !== user?.course;
    };

    const hasMessageChanged = () => {
        return pounceMsg !== user?.auto_pounce_message;
    };

    const selectedCollegeData = collegeData.colleges.find(c => c.name === academic.college);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-alab-orange p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/30 text-3xl font-black uppercase">
                            {user?.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic tracking-tight">Cat Profile</h2>
                            <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest">{user?.msu_email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-10 no-scrollbar">
                    {/* Name Section */}
                    <div className="relative group">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-alab-orange" /> Personal Name
                            </h3>
                            {hasNameChanged() && (
                                <motion.button 
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    onClick={() => updateSection('name', { 
                                        name: `${nameParts.first} ${nameParts.middle ? nameParts.middle + '. ' : ''}${nameParts.last}`.trim() 
                                    })}
                                    disabled={loading.name}
                                    className="px-4 py-1.5 bg-alab-orange text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                                >
                                    {loading.name ? '...' : 'Apply Name'}
                                </motion.button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input 
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                placeholder="First Name"
                                value={nameParts.first}
                                onChange={e => setNameParts({...nameParts, first: e.target.value})}
                            />
                            <input 
                                maxLength={1}
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                placeholder="M.I."
                                value={nameParts.middle}
                                onChange={e => setNameParts({...nameParts, middle: e.target.value})}
                            />
                            <input 
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                placeholder="Last Name"
                                value={nameParts.last}
                                onChange={e => setNameParts({...nameParts, last: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Academic Section */}
                    <div className="relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5 text-alab-orange" /> Academic Info
                            </h3>
                            {hasAcademicChanged() && (
                                <motion.button 
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    onClick={() => updateSection('academic', academic)}
                                    disabled={loading.academic}
                                    className="px-4 py-1.5 bg-alab-orange text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                                >
                                    {loading.academic ? '...' : 'Apply Academic'}
                                </motion.button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select 
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                value={academic.college}
                                onChange={e => setAcademic({ college: e.target.value, course: '' })}
                            >
                                {collegeData.colleges.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <select 
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                value={academic.course}
                                onChange={e => setAcademic({ ...academic, course: e.target.value })}
                            >
                                <option value="">Select course...</option>
                                {selectedCollegeData && [...selectedCollegeData.programs.undergraduate, ...selectedCollegeData.programs.graduate].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Auto Message Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-alab-orange" /> Pounce Intro
                            </h3>
                            {hasMessageChanged() && (
                                <motion.button 
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    onClick={() => updateSection('message', { auto_pounce_message: pounceMsg })}
                                    disabled={loading.message}
                                    className="px-4 py-1.5 bg-alab-orange text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                                >
                                    {loading.message ? '...' : 'Apply Intro'}
                                </motion.button>
                            )}
                        </div>
                        <textarea 
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-medium text-sm resize-none"
                            value={pounceMsg}
                            onChange={e => setPounceMsg(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 mt-2 italic">Placeholders: [Name], [College]</p>
                    </div>

                    {/* Security Section */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-alab-orange" /> Password
                            </h3>
                            {security.password && security.password === security.confirmPassword && (
                                <motion.button 
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    onClick={() => updateSection('security', { password: security.password })}
                                    disabled={loading.security}
                                    className="px-4 py-1.5 bg-alab-orange text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                                >
                                    {loading.security ? '...' : 'Update Password'}
                                </motion.button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="password"
                                placeholder="New Password"
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                value={security.password}
                                onChange={e => setSecurity({...security, password: e.target.value})}
                            />
                            <input 
                                type="password"
                                placeholder="Confirm New Password"
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-alab-orange outline-none font-bold text-sm"
                                value={security.confirmPassword}
                                onChange={e => setSecurity({...security, confirmPassword: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button 
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Log Out 🐾
                    </button>
                    <p className="text-[10px] font-black text-slate-300 uppercase italic">Pounce v1.0 • MSUIIT</p>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileModal;
