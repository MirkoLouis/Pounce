import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cat, User, Lock, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import collegeData from '../data/colleges.json';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [nameParts, setNameParts] = useState({
        first: '',
        middle: '',
        last: ''
    });
    const [formData, setFormData] = useState({
        msu_email: '',
        password: '',
        college: '',
        course: ''
    });

    const [selectedCollege, setSelectedCollege] = useState(null);

    // Update form state when a college is picked to filter relevant courses
    const handleCollegeSelect = (college) => {
        setSelectedCollege(college);
        setFormData({ ...formData, college: college.name, course: '' });
    };

    // Register a new user and transition them directly to the marketplace
    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match! 😿");
            return;
        }
        try {
            // Reconstruct full name from parts for a standardized user profile
            const fullName = `${nameParts.first} ${nameParts.middle ? nameParts.middle + '. ' : ''}${nameParts.last}`.trim();
            
            const res = await api.post('/auth/register', {
                ...formData,
                name: fullName
            });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.msg || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Visual Side - Brand storytelling and onboarding context */}
                <div className="md:w-1/4 bg-alab-orange p-8 text-white flex flex-col justify-between">
                    <div>
                        <Cat className="w-12 h-12 mb-4" />
                        <h2 className="text-3xl font-black italic">Join the Pride.</h2>
                        <p className="mt-2 text-orange-100 text-sm">Every Cat at MSUIIT has a talent. Share yours with the campus.</p>
                    </div>
                    <Link to="/login" className="flex items-center gap-2 text-sm font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>

                {/* Form Side - Structured input for comprehensive user identity */}
                <div className="md:w-3/4 p-8">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                                <input 
                                    required
                                    className="w-full mt-1 px-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none transition-all"
                                    placeholder="Juan"
                                    onChange={(e) => setNameParts({...nameParts, first: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">M.I.</label>
                                <input 
                                    maxLength={1}
                                    className="w-full mt-1 px-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none transition-all"
                                    placeholder="D"
                                    onChange={(e) => setNameParts({...nameParts, middle: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                                <input 
                                    required
                                    className="w-full mt-1 px-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none transition-all"
                                    placeholder="Dela Cruz"
                                    onChange={(e) => setNameParts({...nameParts, last: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">MSUIIT Email</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        required
                                        type="email"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none transition-all"
                                        placeholder="juan.delacruz@g.msuiit.edu.ph"
                                        onChange={(e) => setFormData({...formData, msu_email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        required
                                        type="password"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none transition-all"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm Password</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        required
                                        type="password"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none transition-all"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Select College</label>
                            <select 
                                required
                                className="w-full mt-1 px-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none"
                                onChange={(e) => handleCollegeSelect(collegeData.colleges.find(c => c.name === e.target.value))}
                            >
                                <option value="">Choose your college...</option>
                                {collegeData.colleges.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedCollege && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Program/Course</label>
                                <select 
                                    required
                                    className="w-full mt-1 px-4 py-2 bg-slate-100 rounded-xl focus:ring-2 focus:ring-alab-orange outline-none"
                                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                                >
                                    <option value="">Choose your course...</option>
                                    {[...selectedCollege.programs.undergraduate, ...selectedCollege.programs.graduate].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        <button 
                            type="submit"
                            className="w-full mt-4 py-4 bg-alab-orange text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2 group"
                        >
                            Complete Registration <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
