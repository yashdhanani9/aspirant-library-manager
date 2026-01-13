import React, { useState } from 'react';
import { PlanType, PlanDuration, AdmissionRequest } from '../types';
import { PRICING, LOCKER_PRICE_PER_MONTH, TIME_SLOTS, getSlotCountForPlan } from '../constants';
import { Camera, CreditCard, Send, ArrowLeft, Home, Clock, FileText, Upload, Check, AlertCircle, X } from 'lucide-react';
import { MockService } from '../services/mockDatabase';

interface AdmissionFormProps {
    onBack: () => void;
    onSubmitSuccess: () => void;
    initialSeat?: string; // Pre-filled seat number
    occupiedSlots?: string[]; // List of slot IDs that are already taken
}

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Driving License", "Voter ID", "Passport", "College ID", "Other"];

// Helper for image compression
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; // Constrain width to save storage
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6)); // Low quality jpeg
                } else reject();
            };
        };
        reader.onerror = reject;
    });
};

export const AdmissionForm: React.FC<AdmissionFormProps> = ({ onBack, onSubmitSuccess, initialSeat, occupiedSlots = [] }) => {
    const [formData, setFormData] = useState<Partial<AdmissionRequest>>({
        fullName: '',
        mobile: '',
        email: '',
        address: '',
        seatNumber: initialSeat || '', // Set initial seat if provided
        planType: PlanType.SIX_HOURS,
        duration: PlanDuration.ONE_MONTH,
        lockerRequired: false,
        preferredSlots: [],
        idProofType: 'Aadhaar Card',
        photoUrl: '',
        idProofUrl: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const planPrice = PRICING[formData.planType || PlanType.SIX_HOURS][formData.duration || PlanDuration.ONE_MONTH];
    const months = formData.duration === PlanDuration.ONE_MONTH ? 1 : formData.duration === PlanDuration.THREE_MONTHS ? 3 : 6;
    const totalPrice = planPrice + (formData.lockerRequired ? months * LOCKER_PRICE_PER_MONTH : 0);
    const requiredSlots = getSlotCountForPlan(formData.planType || PlanType.SIX_HOURS);

    const handleSlotToggle = (slotId: string) => {
        const currentSlots = formData.preferredSlots || [];
        let newSlots = [...currentSlots];

        if (currentSlots.includes(slotId)) {
            newSlots = currentSlots.filter(s => s !== slotId);
        } else {
            if (currentSlots.length < requiredSlots) {
                newSlots = [...currentSlots, slotId];
            } else if (requiredSlots === 1) {
                newSlots = [slotId]; // Auto-replace if only 1 allowed
            }
        }

        setFormData({ ...formData, preferredSlots: newSlots });
        // Clear error if resolved
        if (newSlots.length === requiredSlots && errors.slots) {
            setErrors(prev => { const n = { ...prev }; delete n.slots; return n; });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'idProofUrl') => {
        if (e.target.files && e.target.files[0]) {
            try {
                setLoading(true);
                const base64 = await compressImage(e.target.files[0]);
                setFormData(prev => ({ ...prev, [field]: base64 }));
                // Clear error
                setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
            } catch (err) {
                alert("Error processing image. Please try another file.");
            } finally {
                setLoading(false);
            }
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName?.trim()) newErrors.fullName = "Full Name is required";
        if (!formData.mobile?.match(/^[0-9]{10}$/)) newErrors.mobile = "Valid 10-digit mobile required";
        if (!formData.email?.includes('@')) newErrors.email = "Valid email required";
        if (!formData.address?.trim()) newErrors.address = "Address is required";
        if (!formData.photoUrl) newErrors.photoUrl = "Profile photo is required";
        if (!formData.idProofUrl) newErrors.idProofUrl = "ID Proof is required";

        if ((formData.preferredSlots?.length || 0) !== requiredSlots) {
            newErrors.slots = `Please select exactly ${requiredSlots} time slot${requiredSlots > 1 ? 's' : ''}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            // scroll to top error?
            const firstError = document.querySelector('.error-shake');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setLoading(true);
        // Simulate network delay for better UX
        setTimeout(() => {
            MockService.addAdmissionRequest({
                ...formData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                status: 'PENDING'
            } as AdmissionRequest);
            setLoading(false);
            onSubmitSuccess();
        }, 800);
    };

    const InputField = ({ label, error, ...props }: any) => (
        <div className={`space-y-1.5 ${error ? 'error-shake' : ''}`}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
            <input
                {...props}
                className={`w-full p-4 bg-gray-50 rounded-2xl border-2 outline-none font-medium transition-all
                  ${error ? 'border-red-100 bg-red-50 focus:border-red-300' : 'border-transparent focus:border-teal-400 focus:bg-white focus:shadow-sm'}
              `}
            />
            {error && <p className="text-red-500 text-xs font-bold ml-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
        </div>
    );

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-20">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-800">New Admission</h2>
                    <p className="text-gray-400 text-sm font-medium">Apply for Aspirant Library</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar pb-24">

                {/* Documents Section */}
                <div className={`space-y-4 p-5 rounded-3xl border border-dashed transition-colors ${errors.photoUrl || errors.idProofUrl ? 'bg-red-50 border-red-200' : 'bg-gray-50/50 border-gray-200'}`}>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Upload size={14} /> Documents</h3>
                    <div className="grid grid-cols-2 gap-4">

                        {/* Photo Upload */}
                        <div className="relative group">
                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">Student Photo *</label>
                            <div className={`h-40 bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:border-teal-400 transition-all shadow-sm
                            ${errors.photoUrl ? 'border-red-300' : 'border-gray-200'}
                        `}>
                                {formData.photoUrl ? (
                                    <>
                                        <img src={formData.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="mb-1" />
                                            <span className="text-xs font-bold">Change Photo</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-300 group-hover:text-teal-500 transition-colors">
                                        <div className="p-3 bg-gray-50 rounded-full mb-2">
                                            <Camera size={24} />
                                        </div>
                                        <span className="text-xs font-bold">Tap to Upload</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'photoUrl')} />
                            </div>
                            {errors.photoUrl && <p className="text-red-500 text-[10px] font-bold mt-1 text-center">{errors.photoUrl}</p>}
                        </div>

                        {/* ID Proof Section */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 ml-1">ID Proof Type *</label>
                            <div className="relative">
                                <select
                                    className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-teal-500 appearance-none"
                                    value={formData.idProofType}
                                    onChange={e => setFormData({ ...formData, idProofType: e.target.value })}
                                >
                                    {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>

                            <div className={`h-[5.5rem] bg-white rounded-2xl border-2 border-dashed flex items-center justify-center relative group cursor-pointer hover:border-teal-400 transition-all shadow-sm mt-2
                            ${errors.idProofUrl ? 'border-red-300' : 'border-gray-200'}
                         `}>
                                {formData.idProofUrl ? (
                                    <div className="flex flex-col items-center gap-1 text-teal-600">
                                        <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                        <span className="text-xs font-bold">Uploaded</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-xs font-bold flex flex-col items-center group-hover:text-teal-500">
                                        <FileText size={20} className="mb-1" />
                                        <span>Upload Proof</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'idProofUrl')} />
                            </div>
                            {errors.idProofUrl && <p className="text-red-500 text-[10px] font-bold mt-1 text-center">{errors.idProofUrl}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} /> Personal Details</h3>
                    <div className="grid grid-cols-1 gap-5">
                        <InputField
                            label="Full Name *"
                            placeholder="Ex. Rahul Sharma"
                            value={formData.fullName}
                            onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                            error={errors.fullName}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Mobile Number *"
                                type="tel"
                                maxLength={10}
                                placeholder="9876543210"
                                value={formData.mobile}
                                onChange={(e: any) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                                error={errors.mobile}
                            />
                            <InputField
                                label="Email Address *"
                                type="email"
                                placeholder="rahul@example.com"
                                value={formData.email}
                                onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                                error={errors.email}
                            />
                        </div>

                        <div className={`space-y-1.5 ${errors.address ? 'error-shake' : ''}`}>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Address *</label>
                            <div className="relative">
                                <textarea
                                    placeholder="Enter permanent address..."
                                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 outline-none font-medium resize-none h-24 transition-colors
                                    ${errors.address ? 'border-red-100 bg-red-50 focus:border-red-300' : 'border-transparent focus:border-teal-400 focus:bg-white focus:shadow-sm'}
                                `}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                ></textarea>
                                <Home size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
                            </div>
                            {errors.address && <p className="text-red-500 text-xs font-bold ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.address}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Membership Plan</h3>

                    {/* Duration & Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Plan Type</label>
                            <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col gap-1">
                                {Object.values(PlanType).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, planType: t as PlanType, preferredSlots: [] })}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-left flex justify-between items-center ${formData.planType === t ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t}
                                        {formData.planType === t && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Duration</label>
                            <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col gap-1">
                                {Object.values(PlanDuration).map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, duration: d as PlanDuration })}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-left flex justify-between items-center ${formData.duration === d ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {d}
                                        {formData.duration === d && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Slot Selection */}
                    <div className={`space-y-3 p-4 rounded-2xl border transition-colors ${errors.slots ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}>
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Select Time Slots
                            </label>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${errors.slots ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                                {formData.preferredSlots?.length || 0} / {requiredSlots} Selected
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {TIME_SLOTS.map(slot => {
                                const isSelected = formData.preferredSlots?.includes(slot.id);
                                const isOccupied = occupiedSlots.includes(slot.id) || occupiedSlots.includes(slot.label); // Handle both ID and Label formats just in case

                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => !isOccupied && handleSlotToggle(slot.id)}
                                        disabled={isOccupied}
                                        className={`p-3 rounded-xl border transition-all text-left relative overflow-hidden group
                                    ${isOccupied
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                : isSelected
                                                    ? 'border-teal-500 bg-teal-500 text-white shadow-md shadow-teal-200'
                                                    : 'border-white bg-white text-gray-500 hover:border-gray-200'
                                            }
                                `}
                                    >
                                        <span className="text-[10px] font-medium opacity-80 block">{slot.label}</span>
                                        <span className={`text-xs font-black block mt-0.5 ${isSelected ? 'text-white' : 'text-gray-800'}`}>{slot.time}</span>
                                        {isSelected && <Check size={14} className="absolute top-2 right-2 opacity-50" />}
                                        {isOccupied && <span className="absolute top-2 right-2 text-[8px] font-bold text-red-400 bg-red-50 px-1 rounded">SUB</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.slots && <p className="text-red-500 text-xs font-bold text-center animate-pulse">{errors.slots}</p>}
                    </div>

                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-5 rounded-2xl flex items-center justify-between border border-teal-100">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${formData.lockerRequired ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white'}`}>
                                {formData.lockerRequired && <Check size={14} className="text-white" />}
                                <input type="checkbox" className="absolute opacity-0 w-6 h-6 cursor-pointer" checked={formData.lockerRequired} onChange={e => setFormData({ ...formData, lockerRequired: e.target.checked })} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Private Locker</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">+₹100 / Month</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                            <LockIcon />
                        </div>
                    </div>

                    <div className="flex justify-between items-end p-5 bg-gray-900 text-white rounded-3xl shadow-xl shadow-gray-200 mt-4">
                        <div>
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Total Fee</span>
                            <div className="text-xs text-gray-500 font-medium">For {formData.duration}</div>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black tracking-tighter">₹{totalPrice}</span>
                        </div>
                    </div>

                    <div className="pt-2 text-center">
                        <p className="text-[10px] text-gray-400 max-w-xs mx-auto mb-4">
                            By clicking submit, you agree to our Terms & Conditions and Library Rules.
                        </p>
                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-4 rounded-2xl font-black text-lg shadow-lg shadow-teal-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2 animate-pulse">Processing...</span>
                            ) : (
                                <>Submit Application <Send size={20} /></>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <style>{`
            .error-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
        `}</style>
        </div>
    );
};

const LockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);