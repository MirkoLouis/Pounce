import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Plus, Check, DollarSign, Gift, ChevronRight, Info } from 'lucide-react';
import collegeData from '../data/colleges.json';
import api from '../services/api';

/**
 * RequestGigModal Component.
 * A multi-step form for creating and posting new gigs to the platform.
 * Guides users through defining task details, targeting specific expertise, and setting rewards.
 */
const RequestGigModal = ({ isOpen, onClose, onGigCreated }) => {
    // UI state for the multi-step navigation (1: Info, 2: Expertise, 3: Reward)
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Centralized form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targeted_expertises: [], // Stores specific course names selected by the user
        reward: { type: 'PHP', value: '' },
        images: []
    });

    // Tracking selected colleges to dynamically filter the courses/programs shown in Step 2
    const [selectedColleges, setSelectedColleges] = useState([]);

    /**
     * Toggles a college selection.
     * Automatically manages the selection/deselection of all associated courses.
     */
    const toggleCollege = (collegeName) => {
        if (selectedColleges.includes(collegeName)) {
            setSelectedColleges(selectedColleges.filter(c => c !== collegeName));
            // Cleanup: remove all courses belonging to this college from targeted_expertises
            const college = collegeData.colleges.find(c => c.name === collegeName);
            const collegeCourses = [...college.programs.undergraduate, ...college.programs.graduate];
            setFormData(prev => ({
                ...prev,
                targeted_expertises: prev.targeted_expertises.filter(course => !collegeCourses.includes(course))
            }));
        } else {
            setSelectedColleges([...selectedColleges, collegeName]);
        }
    };

    /**
     * Toggles a specific course/expertise requirement for the gig.
     */
    const toggleCourse = (courseName) => {
        setFormData(prev => ({
            ...prev,
            targeted_expertises: prev.targeted_expertises.includes(courseName)
                ? prev.targeted_expertises.filter(c => c !== courseName)
                : [...prev.targeted_expertises, courseName]
        }));
    };

    /**
     * Advances the form to the next step after basic validation.
     */
    const handleNext = () => {
        if (step === 1) {
            if (!formData.title.trim()) return alert("Please provide a gig title 🐾");
            if (!formData.description.trim()) return alert("Please provide a description 🐾");
            setStep(2);
        } else if (step === 2) {
            if (selectedColleges.length === 0) return alert("Please select at least one college 🐾");
            if (formData.targeted_expertises.length === 0) return alert("Please select at least one specific expertise 🐾");
            setStep(3);
        }
    };

    /**
     * Validates and updates the reward value based on its type (numeric for PHP, text for CUSTOM).
     */
    const handleRewardChange = (val) => {
        if (formData.reward.type === 'PHP') {
            const cleaned = val.replace(/[^0-9]/g, ''); // Ensure only numbers for currency
            setFormData({ ...formData, reward: { ...formData.reward, value: cleaned } });
        } else {
            if (val.length <= 50) {
                setFormData({ ...formData, reward: { ...formData.reward, value: val } });
            }
        }
    };

    /**
     * Processes image uploads, converting them to Base64 for easier transmission/display.
     * Limits the total number of images to 10.
     */
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (formData.images.length + files.length > 10) {
            alert("Maximum 10 images allowed 🐾");
            return;
        }

        const uploadPromises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(uploadPromises).then(newImages => {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
            }));
        });
    };

    /**
     * Final submission of the gig data to the backend.
     */
    const handleSubmit = async () => {
        if (!formData.title || !formData.description || formData.targeted_expertises.length === 0 || !formData.reward.value) {
            alert("Please fill in all required fields, including the reward.");
            return;
        }
        setLoading(true);
        try {
            await api.post('/gigs', formData);
            onGigCreated(); // Refresh the parent's gig list
            onClose();
        } catch (err) {
            alert("Error creating gig. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Overlay */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Form Container */}
            <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header: Title and contextual help */}
                <div className="bg-alab-orange p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black">Post a New Gig 🐾</h2>
                        <p className="text-orange-100 text-sm">Target the expertise you need from fellow Cats.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                    {/* Step 1: Basic Info - Core task details and visual aids */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Gig Title</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-100 rounded-2xl focus:ring-2 focus:ring-alab-orange outline-none font-bold"
                                    placeholder="e.g., Need a Logo for my Org"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
                                    <span className={`text-[10px] font-bold ${formData.description.length > 450 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {formData.description.length}/500
                                    </span>
                                </div>
                                <textarea 
                                    maxLength={500}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-100 rounded-2xl focus:ring-2 focus:ring-alab-orange outline-none resize-none text-sm"
                                    placeholder="Describe what you need help with..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Images (Max 10)</label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})}
                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.images.length < 10 && (
                                        <label className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                                            <Plus className="w-6 h-6 text-slate-400" />
                                            <input type="file" multiple hidden onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Targeted Expertise - Filtering by College and Course */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-700">
                                <Info className="w-5 h-5 shrink-0" />
                                <p className="text-xs font-medium">Select one or more colleges, then check the specific courses you want to target.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {collegeData.colleges.map(college => (
                                    <button
                                        key={college.id}
                                        onClick={() => toggleCollege(college.name)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                            selectedColleges.includes(college.name)
                                                ? 'bg-alab-orange border-alab-orange text-white'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-alab-orange'
                                        }`}
                                    >
                                        {college.acronym}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                {selectedColleges.map(collegeName => {
                                    const college = collegeData.colleges.find(c => c.name === collegeName);
                                    return (
                                        <div key={college.id} className="bg-slate-50 p-4 rounded-2xl">
                                            <h3 className="text-xs font-black text-slate-500 uppercase mb-3">{college.name}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {[...college.programs.undergraduate, ...college.programs.graduate].map(course => (
                                                    <label key={course} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors group">
                                                        <input 
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={formData.targeted_expertises.includes(course)}
                                                            onChange={() => toggleCourse(course)}
                                                        />
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                            formData.targeted_expertises.includes(course)
                                                                ? 'bg-alab-orange border-alab-orange'
                                                                : 'bg-white border-slate-200'
                                                        }`}>
                                                            {formData.targeted_expertises.includes(course) && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span className={`text-[11px] font-bold ${
                                                            formData.targeted_expertises.includes(course) ? 'text-slate-900' : 'text-slate-500'
                                                        }`}>
                                                            {course}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Reward - Defining the incentive for the provider */}
                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 py-4">
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setFormData({...formData, reward: { type: 'PHP', value: '' }})}
                                    className={`flex-1 p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                                        formData.reward.type === 'PHP' ? 'border-alab-orange bg-orange-50' : 'border-slate-100'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        formData.reward.type === 'PHP' ? 'bg-alab-orange text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <span className="font-black text-sm">Cash Payment (PHP)</span>
                                </button>

                                <button 
                                    onClick={() => setFormData({...formData, reward: { type: 'CUSTOM', value: '' }})}
                                    className={`flex-1 p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                                        formData.reward.type === 'CUSTOM' ? 'border-alab-orange bg-orange-50' : 'border-slate-100'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        formData.reward.type === 'CUSTOM' ? 'bg-alab-orange text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <span className="font-black text-sm">Custom Reward</span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {formData.reward.type === 'PHP' ? 'Amount (₱)' : 'Describe Reward'}
                                </label>
                                <input 
                                    className="w-full px-6 py-4 bg-slate-100 rounded-3xl focus:ring-2 focus:ring-alab-orange outline-none font-black text-lg"
                                    placeholder={formData.reward.type === 'PHP' ? '0.00' : 'e.g., Will treat you to lunch!'}
                                    maxLength={formData.reward.type === 'CUSTOM' ? 50 : undefined}
                                    value={formData.reward.value}
                                    onChange={e => handleRewardChange(e.target.value)}
                                />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer Controls: Navigation and submission buttons */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between">
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    
                    <button 
                        onClick={() => step < 3 ? handleNext() : handleSubmit()}
                        disabled={loading}
                        className="px-8 py-3 bg-alab-orange text-white font-black rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2 group"
                    >
                        {loading ? 'Posting...' : step < 3 ? 'Next Step' : 'Launch Gig!'}
                        {step < 3 && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default RequestGigModal;
