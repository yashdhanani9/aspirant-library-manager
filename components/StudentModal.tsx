import React, { useState, useEffect } from 'react';
import { Student, PlanType, PlanDuration, Seat } from '../types';
import { TIME_SLOTS, PRICING, LOCKER_PRICE_PER_MONTH, getSlotCountForPlan } from '../constants';
import { X, Save, Trash2, Camera, RefreshCw, Calendar, CreditCard, AlertTriangle, Eye, EyeOff, Mail, Home, Users, FileText, Check, Upload } from 'lucide-react';
import { MockService } from '../services/mockDatabase';

interface StudentModalProps {
  seat: Seat;
  existingStudent?: Student;
  initialData?: Partial<Student>;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Driving License", "Voter ID", "Passport", "College ID", "Other"];

// Helper for image compression (duplicated to avoid external deps issues)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else reject();
      };
    };
    reader.onerror = reject;
  });
};

export const StudentModal: React.FC<StudentModalProps> = ({ seat, existingStudent, initialData, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    address: '',
    parentName: '',
    parentMobile: '',
    seatNumber: seat.id,
    lockerRequired: false,
    planType: PlanType.SIX_HOURS,
    duration: PlanDuration.ONE_MONTH,
    startDate: new Date().toISOString().split('T')[0],
    assignedSlots: [],
    photoUrl: '',
    idProofUrl: '',
    idProofType: 'Aadhaar Card'
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingStudent) {
        setFormData({ ...existingStudent, idProofType: existingStudent.idProofType || 'Aadhaar Card' });
    } else if (initialData) {
        setFormData(prev => ({ 
            ...prev, 
            ...initialData, 
            seatNumber: seat.id,
            idProofType: initialData.idProofType || 'Aadhaar Card'
        }));
    }
  }, [existingStudent, initialData, seat.id]);

  useEffect(() => {
    if (!formData.planType || !formData.duration) return;
    const planPrice = PRICING[formData.planType][formData.duration];
    const months = formData.duration === PlanDuration.ONE_MONTH ? 1 : formData.duration === PlanDuration.THREE_MONTHS ? 3 : 6;
    setTotalPrice(planPrice + (formData.lockerRequired ? months * LOCKER_PRICE_PER_MONTH : 0));
    
    if (formData.startDate) {
      const start = new Date(formData.startDate);
      start.setMonth(start.getMonth() + months);
      setFormData(prev => ({ ...prev, endDate: start.toISOString().split('T')[0] }));
    }
  }, [formData.planType, formData.duration, formData.lockerRequired, formData.startDate]);

  const handleSlotToggle = (slotId: string) => {
    const currentSlots = formData.assignedSlots || [];
    const maxSlots = getSlotCountForPlan(formData.planType!);
    if (currentSlots.includes(slotId)) {
      setFormData({ ...formData, assignedSlots: currentSlots.filter(s => s !== slotId) });
    } else {
      if (currentSlots.length < maxSlots) {
        setFormData({ ...formData, assignedSlots: [...currentSlots, slotId] });
      } else if (maxSlots === 1) {
        setFormData({ ...formData, assignedSlots: [slotId] });
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'idProofUrl') => {
      if (e.target.files && e.target.files[0]) {
          try {
              setLoading(true);
              const base64 = await compressImage(e.target.files[0]);
              setFormData(prev => ({ ...prev, [field]: base64 }));
          } catch (err) {
              alert("Error processing image.");
          } finally {
              setLoading(false);
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mandatory Check
    if (!formData.fullName || !formData.mobile || !formData.email || !formData.password || !formData.startDate || !formData.assignedSlots?.length || !formData.address || !formData.parentName || !formData.parentMobile) {
      setError('Please fill all mandatory text fields.'); return;
    }
    if (!formData.photoUrl) {
      setError('Student Photo is mandatory.'); return;
    }
    if (!formData.idProofUrl || !formData.idProofType) {
      setError('ID Proof Document and Type are mandatory.'); return;
    }

    const requiredSlots = getSlotCountForPlan(formData.planType!);
    if (formData.assignedSlots.length !== requiredSlots) {
      setError(`Select exactly ${requiredSlots} slots.`); return;
    }
    if (!MockService.checkSlotAvailability(seat.id, formData.assignedSlots, existingStudent?.id)) {
      setError('Selected slots are already booked.'); return;
    }

    const studentToSave: Student = {
        id: existingStudent?.id || Date.now().toString(),
        fullName: formData.fullName!,
        mobile: formData.mobile!,
        email: formData.email!,
        password: formData.password!,
        address: formData.address!,
        parentName: formData.parentName!,
        parentMobile: formData.parentMobile!,
        seatNumber: seat.id,
        lockerRequired: !!formData.lockerRequired,
        planType: formData.planType!,
        duration: formData.duration!,
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        amountPaid: totalPrice,
        assignedSlots: formData.assignedSlots!,
        isActive: true,
        photoUrl: formData.photoUrl,
        idProofUrl: formData.idProofUrl,
        idProofType: formData.idProofType
    };
    
    existingStudent ? MockService.updateStudent(studentToSave) : MockService.addStudent(studentToSave);
    
    if (!existingStudent) {
        alert(`📧 Welcome Email Sent to ${studentToSave.email}`);
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_25px_50px_rgba(0,0,0,0.25)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-white/50 relative">
        
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-teal-400 to-cyan-600 p-4 md:p-6 text-white flex justify-between items-center z-10 shadow-lg shrink-0">
          <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter">Seat #{seat.id}</h2>
              <p className="text-teal-100 font-medium text-sm">{existingStudent ? 'Modify Enrollment' : 'New Admission'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-[#F8FAFC]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
               {/* --- Photo and ID Section --- */}
               <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2"><Upload size={18} className="text-teal-500"/> Documents</h3>
               <div className="flex gap-4">
                    {/* Photo */}
                    <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden group border-2 border-gray-200 shrink-0">
                        {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover"/> : <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400"/>}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'photoUrl')} />
                        <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center py-1">Photo *</div>
                    </div>
                    {/* ID */}
                    <div className="flex-1 space-y-2">
                        <select className="w-full p-2 text-xs font-bold bg-white rounded-lg border border-gray-200" value={formData.idProofType} onChange={e => setFormData({...formData, idProofType: e.target.value})}>
                            {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="relative h-14 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                             {formData.idProofUrl ? <div className="text-teal-600 font-bold text-xs flex items-center gap-1"><Check size={12}/> ID Uploaded</div> : <div className="text-gray-400 text-xs font-bold">Upload Proof *</div>}
                             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'idProofUrl')} />
                        </div>
                    </div>
               </div>

               {/* Personal Info */}
               <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2 pt-2"><Users size={18} className="text-teal-500"/> Personal Info</h3>
               <div className="space-y-3">
                   <input type="text" placeholder="Full Name *" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                   <input type="tel" placeholder="Mobile Number *" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                   <div className="relative">
                       <input type="email" placeholder="Email Address *" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                       <Mail size={16} className="absolute right-4 top-4.5 text-gray-400" />
                   </div>
                   <textarea placeholder="Home Address *" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm resize-none h-20" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
               </div>
               
               {/* Parent Details */}
               <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2 pt-2">Parent / Guardian</h3>
               <div className="space-y-3">
                    <input type="text" placeholder="Parent Name *" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
                    <input type="tel" placeholder="Parent Mobile *" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm" value={formData.parentMobile} onChange={e => setFormData({...formData, parentMobile: e.target.value})} />
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2"><CreditCard size={18} className="text-teal-500"/> Plan Configuration</h3>
               <div className="grid grid-cols-2 gap-3">
                   <select className="p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-medium text-sm" value={formData.planType} onChange={e => setFormData({...formData, planType: e.target.value as PlanType, assignedSlots: []})}>
                       {Object.values(PlanType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <select className="p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-medium text-sm" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value as PlanDuration})}>
                       {Object.values(PlanDuration).map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                       <input type="date" required className="w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-medium" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                       <Calendar size={16} className="absolute right-3 top-4.5 text-gray-400 pointer-events-none"/>
                   </div>
                   <div className="p-3 md:p-4 bg-gray-100 rounded-xl text-gray-500 text-sm flex items-center justify-center font-mono font-bold">{formData.endDate || 'Auto-calc'}</div>
               </div>

               <div className="bg-teal-50 p-3 md:p-4 rounded-xl flex items-center gap-3 border border-teal-100">
                  <input type="checkbox" id="locker" className="w-5 h-5 accent-teal-600 rounded" checked={formData.lockerRequired} onChange={e => setFormData({...formData, lockerRequired: e.target.checked})} />
                  <label htmlFor="locker" className="text-sm font-bold text-teal-900 cursor-pointer">Add Personal Locker (+₹100/mo)</label>
               </div>
            </div>
          </div>

          <div>
             <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Time Slots (Required: {getSlotCountForPlan(formData.planType!)})</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {TIME_SLOTS.map(slot => (
                    <button key={slot.id} type="button" onClick={() => handleSlotToggle(slot.id)}
                        className={`p-3 md:p-4 rounded-xl border-2 transition-all shadow-sm ${formData.assignedSlots?.includes(slot.id) ? 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-200 scale-105' : 'border-gray-100 bg-white text-gray-500 hover:border-teal-200'}`}
                    >
                        <div className="font-bold text-sm">{slot.label}</div>
                        <div className="text-xs opacity-80 font-medium">{slot.time}</div>
                    </button>
                 ))}
             </div>
          </div>

          <div className="bg-yellow-50 p-4 md:p-5 rounded-xl border border-yellow-100 shadow-sm">
               <div className="flex items-center justify-between">
                   <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Login Password *</p>
                   <button type="button" onClick={() => {
                      const p = Math.random().toString(36).slice(-8);
                      setFormData(prev => ({...prev, password: p}));
                   }} className="text-yellow-700 bg-yellow-200 p-2 rounded-lg hover:bg-yellow-300 hover:text-yellow-800 transition-colors" title="Generate Random"><RefreshCw size={16}/></button>
               </div>
               <div className="relative mt-2">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-transparent border-b-2 border-yellow-300 font-mono text-yellow-900 focus:outline-none font-bold text-lg pr-10" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder="Set Password" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 text-yellow-600 hover:text-yellow-800"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
               </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"><AlertTriangle size={16}/> {error}</p>}

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t-2 border-gray-100 gap-6 md:gap-0">
             <div className="text-center md:text-left">
                 <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Total Amount</p>
                 <p className="text-4xl font-black text-gray-800">₹{totalPrice}</p>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
                 {existingStudent && (
                     <button type="button" onClick={() => { if(confirm('Delete?')) onDelete(existingStudent.id); }} className="p-4 md:p-5 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border border-red-100"><Trash2 size={24}/></button>
                 )}
                 <button type="submit" disabled={loading} className="flex-1 md:flex-none px-6 md:px-10 py-4 md:py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-transform active:scale-95 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                     <Save size={24} /> {loading ? 'Saving...' : (existingStudent ? 'Update' : 'Confirm')}
                 </button>
             </div>
          </div>

        </form>
      </div>
    </div>
  );
};