import React, { useState, useEffect } from 'react';
import { Student, PlanType, PlanDuration, Seat } from '../types';
import { TIME_SLOTS, PRICING, LOCKER_PRICE_PER_MONTH, getSlotCountForPlan } from '../constants';
import { X, Save, Trash2, Camera, RefreshCw, Calendar, CreditCard, AlertTriangle, Eye, EyeOff, Mail, Home, Users, FileText, Check, Upload, Download, CreditCard as IdCard } from 'lucide-react';
import { MockService } from '../services/mockDatabase';
import { ApiService } from '../services/api';
import jsPDF from 'jspdf';

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

// ID Card Generator
const generateIDCard = async (student: Student) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 53.98] });

  // Format dates (DD MMM YYYY)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format time slots
  const formatSlots = (slots: string[]) => {
    const slotMap: Record<string, string> = {
      '7-1': '7 AM - 1 PM',
      '1-7': '1 PM - 7 PM',
      '7-12': '7 AM - 12 PM',
      '12-5': '12 PM - 5 PM',
      '5-10': '5 PM - 10 PM'
    };
    return slots.map(s => slotMap[s] || s).join(', ');
  };

  // Background gradient simulation with rectangles
  doc.setFillColor(13, 148, 136); // Teal-700
  doc.rect(0, 0, 85.6, 20, 'F');
  doc.setFillColor(45, 212, 191); // Teal-400
  doc.rect(0, 20, 85.6, 33.98, 'F');

  // Library Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ASPIRANT LIBRARY', 42.8, 6, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Personal Growth Space', 42.8, 10, { align: 'center' });

  // Student Photo (if available)
  if (student.photoUrl) {
    try {
      doc.addImage(student.photoUrl, 'JPEG', 5, 15, 20, 25);
      // Photo border
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.rect(5, 15, 20, 25);
    } catch (e) {
      console.warn('Failed to add photo to ID card', e);
    }
  }

  // Student Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(student.fullName.toUpperCase(), 28, 24);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID: ${student.id.substring(0, 12)}`, 28, 29);
  doc.text(`Seat: ${student.seatNumber} | ${student.planType}`, 28, 33);

  // Time Slots
  if (student.assignedSlots && student.assignedSlots.length > 0) {
    const slotsText = formatSlots(student.assignedSlots);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Time:', 28, 36);
    doc.setFont('helvetica', 'normal');
    doc.text(slotsText, 36, 36);
    doc.setFontSize(7);
  }

  doc.text(`Mobile: ${student.mobile}`, 28, 40);

  // Validity Period
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(28, 41, 52, 7, 1, 1, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('VALID FROM:', 30, 44.5);
  doc.text('VALID UNTIL:', 30, 47);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(formatDate(student.startDate), 48, 44.5);
  doc.text(formatDate(student.endDate), 48, 47);

  // Footer strip
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 50, 85.6, 3.98, 'F');
  doc.setFontSize(5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Keep this card with you at all times', 42.8, 52.5, { align: 'center' });

  // Download
  doc.save(`${student.fullName.replace(/\s+/g, '_')}_ID_Card.pdf`);
};


export const StudentModal: React.FC<StudentModalProps & { readOnly?: boolean }> = ({ seat, existingStudent, initialData, onClose, onSave, onDelete, readOnly = false }) => {
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
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');

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
    if (readOnly) return; // Prevent toggling in read-only mode
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

  // Resize and crop image to passport size (413x531 pixels - 3.5x4.5 cm at 300 DPI)
  const resizeImageToPassportSize = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Passport photo standard size
          const targetWidth = 413;
          const targetHeight = 531;

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Calculate crop area (center crop)
          const aspectRatio = targetWidth / targetHeight;
          const imgRatio = img.width / img.height;

          let sourceWidth, sourceHeight, sourceX, sourceY;

          if (imgRatio > aspectRatio) {
            // Image is wider - crop sides
            sourceHeight = img.height;
            sourceWidth = img.height * aspectRatio;
            sourceX = (img.width - sourceWidth) / 2;
            sourceY = 0;
          } else {
            // Image is taller - crop top/bottom
            sourceWidth = img.width;
            sourceHeight = img.width / aspectRatio;
            sourceX = 0;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // Draw image with crop
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
          );

          // Convert to base64 with quality compression
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(resizedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'idProofUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      // File size validation - Maximum 2.5 MB
      const MAX_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setError(`File size (${fileSizeMB} MB) exceeds maximum limit of 2.5 MB. Please compress or choose a smaller image.`);
        e.target.value = ''; // Reset input
        return;
      }

      setLoading(true);
      setError('');

      try {
        if (field === 'photoUrl') {
          // For profile photo, resize to passport size
          const resizedImage = await resizeImageToPassportSize(file);
          setTempPhotoUrl(resizedImage);
          setPhotoEditorOpen(true);
        } else {
          // For ID proof, upload as-is
          const res = await ApiService.uploadFile(file);
          setFormData(prev => ({ ...prev, [field]: res.url }));
        }
      } catch (err) {
        console.error(err);
        alert("Error processing image. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmPhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: tempPhotoUrl }));
    setPhotoEditorOpen(false);
    setTempPhotoUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setError('');

    // Mandatory Check
    if (!formData.fullName || !formData.mobile || !formData.email || !formData.password || !formData.startDate || !formData.assignedSlots?.length || !formData.address || !formData.parentName || !formData.parentMobile || !formData.gender) {
      setError('Please fill all mandatory text fields including Gender.'); return;
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
      idProofType: formData.idProofType,
      paymentMode: formData.paymentMode || 'CASH' as any
    };

    try {
      const finalStudent: Student = {
        ...studentToSave
      };

      console.log('Attempting to save student:', finalStudent);

      try {
        // Use POST for both add and update for now
        const result = await ApiService.addStudent(finalStudent);
        console.log('Save successful:', result);
        alert(existingStudent ? `Student Updated Successfully!` : `Student Added Successfully!`);
        onSave();
        onClose();
      } catch (error: any) {
        console.error('API Error Details:', {
          message: error.message,
          error: error,
          stack: error.stack
        });
        setError(`Failed to save: ${error.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Failed to save student: ${err.message || 'Unknown error'}`);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_25px_50px_rgba(0,0,0,0.25)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-white/50 relative">

        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-teal-400 to-cyan-600 p-4 md:p-6 text-white flex justify-between items-center z-10 shadow-lg shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter">Seat #{seat.id}</h2>
            <p className="text-teal-100 font-medium text-sm">
              {readOnly ? 'Student Details (Read Only)' : (existingStudent ? 'Modify Enrollment' : 'New Admission')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {existingStudent && (
              <button
                type="button"
                onClick={() => generateIDCard(existingStudent)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="Download ID Card"
              >
                <IdCard size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={20} /></button>
          </div>
        </div>

        {/* Edit History Banner (Admin Only) */}
        {existingStudent && existingStudent.lastModifiedAt && !readOnly && (
          <div className="bg-orange-50 border-l-4 border-orange-400 px-4 md:px-6 py-3 shrink-0">
            <div className="flex items-center gap-2 text-orange-800 text-xs md:text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="font-medium">
                <span className="font-bold">Last edited by Admin</span> on{' '}
                {new Date(existingStudent.lastModifiedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-[#F8FAFC]">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
              {/* --- Photo and ID Section --- */}
              <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                <Camera size={18} className="text-teal-500" /> Documents
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PHOTO UPLOAD */}
                <div className="relative h-52 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border-2 border-dashed border-teal-200 flex flex-col items-center justify-center overflow-hidden group hover:border-teal-400 transition-colors cursor-pointer">
                  {formData.photoUrl ? (
                    <>
                      <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setTempPhotoUrl(formData.photoUrl!);
                              setPhotoEditorOpen(true);
                            }}
                            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 shadow-sm"
                          >
                            <Camera size={14} />
                          </button>
                        )}
                        <a href={formData.photoUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 shadow-sm"><Eye size={14} /></a>
                        <a href={formData.photoUrl.replace('/upload/', '/upload/fl_attachment/')} download className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 shadow-sm"><Download size={14} /></a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera size={32} className="mx-auto text-teal-400 mb-2" />
                      <div className="text-teal-700 font-bold text-xs">Upload Photo *</div>
                      <div className="text-teal-500 text-[10px] mt-1">Max 2.5 MB</div>
                      <div className="text-teal-400 text-[9px] mt-1">Passport Size (3.5x4.5cm)</div>
                    </div>
                  )}
                  {!readOnly && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'photoUrl')} />}
                </div>
                {/* ID */}
                <div className="flex-1 space-y-2">
                  <select disabled={readOnly} className={`w-full p-2 text-xs font-bold bg-white rounded-lg border border-gray-200 ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`} value={formData.idProofType} onChange={e => setFormData({ ...formData, idProofType: e.target.value })}>
                    {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="relative h-14 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center group hover:border-teal-300 transition-colors">
                    {formData.idProofUrl ? (
                      <div className="flex items-center gap-3">
                        <div className="text-teal-600 font-bold text-xs flex items-center gap-1"><Check size={12} /> ID Uploaded</div>
                        <div className="flex gap-1 z-10 relative">
                          <a href={formData.idProofUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 shadow-sm"><Eye size={14} /></a>
                          <a href={formData.idProofUrl.replace('/upload/', '/upload/fl_attachment/')} download className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 shadow-sm"><Download size={14} /></a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-500 font-bold text-xs">Upload ID Proof *</div>
                        <div className="text-gray-400 text-[10px]">Max 2.5 MB</div>
                      </div>
                    )}
                    {!readOnly && <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'idProofUrl')} />}
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2 pt-2"><Users size={18} className="text-teal-500" /> Personal Info</h3>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <input type="text" disabled={readOnly} placeholder="Full Name *" required className={`flex-1 p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                  <select disabled={readOnly} className={`w-[160px] p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none shadow-sm font-medium text-gray-700 ${readOnly ? 'bg-gray-50' : ''}`} value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value as any })}>
                    <option value="" disabled className="text-gray-400">Gender *</option>
                    <option value="Male" className="bg-white text-gray-800">Male</option>
                    <option value="Female" className="bg-white text-gray-800">Female</option>
                    <option value="Other" className="bg-white text-gray-800">Other</option>
                  </select>
                </div>
                <input type="tel" disabled={readOnly} placeholder="Mobile Number *" required className={`w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                <div className="relative">
                  <input type="email" disabled={readOnly} placeholder="Email Address *" required className={`w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  <Mail size={16} className="absolute right-4 top-4.5 text-gray-400" />
                </div>
                <textarea disabled={readOnly} placeholder="Home Address *" required rows={3} className={`w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm resize-none ${readOnly ? 'bg-gray-50' : ''}`} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
              </div>

              {/* Parent Details */}
              <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2 pt-2">Parent / Guardian</h3>
              <div className="space-y-3">
                <input type="text" disabled={readOnly} placeholder="Parent Name *" required className={`w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} />
                <input type="tel" disabled={readOnly} placeholder="Parent Mobile *" required className={`w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.parentMobile} onChange={e => setFormData({ ...formData, parentMobile: e.target.value })} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-gray-800 font-bold flex items-center gap-2 border-b-2 border-gray-100 pb-2"><CreditCard size={18} className="text-teal-500" /> Plan Configuration</h3>
              <div className="grid grid-cols-2 gap-3">
                <select disabled={readOnly} className={`p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-medium text-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.planType} onChange={e => setFormData({ ...formData, planType: e.target.value as PlanType, assignedSlots: [] })}>
                  {Object.values(PlanType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select disabled={readOnly} className={`p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-medium text-sm ${readOnly ? 'bg-gray-50' : ''}`} value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value as PlanDuration })}>
                  {Object.values(PlanDuration).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select disabled={readOnly} className={`col-span-2 p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-bold text-sm text-teal-800 ${readOnly ? 'bg-gray-50' : ''}`} value={formData.paymentMode || 'CASH'} onChange={e => setFormData({ ...formData, paymentMode: e.target.value as any })}>
                  <option value="CASH">💰 Cash Payment</option>
                  <option value="ONLINE">💳 Online / UPI</option>
                  <option value="PENDING">⏳ Payment Pending</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  disabled={readOnly}
                  required
                  className={`w-full p-3 md:p-4 bg-white rounded-xl border border-gray-200 outline-none shadow-sm font-medium ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
                <div className="p-3 md:p-4 bg-gray-100 rounded-xl text-gray-500 text-sm flex items-center justify-center font-mono font-bold">{formData.endDate || 'Auto-calc'}</div>
              </div>

              <div className="bg-teal-50 p-3 md:p-4 rounded-xl flex items-center gap-3 border border-teal-100">
                <input type="checkbox" disabled={readOnly} id="locker" className="w-5 h-5 accent-teal-600 rounded" checked={formData.lockerRequired} onChange={e => setFormData({ ...formData, lockerRequired: e.target.checked })} />
                <label htmlFor="locker" className="text-sm font-bold text-teal-900 cursor-pointer">Add Personal Locker (+₹100/mo)</label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Time Slots (Required: {getSlotCountForPlan(formData.planType!)})</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIME_SLOTS.map(slot => {
                // Check if slot is taken by another student on this seat
                const slotTaken = seat.occupants.find(
                  occupant => occupant.id !== existingStudent?.id &&
                    occupant.assignedSlots.includes(slot.id)
                );
                const isSelected = formData.assignedSlots?.includes(slot.id);

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={readOnly || !!slotTaken}
                    onClick={() => handleSlotToggle(slot.id)}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all shadow-sm relative ${slotTaken
                        ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-60'
                        : isSelected
                          ? 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-200 scale-105'
                          : 'border-gray-100 bg-white text-gray-500 hover:border-teal-200 hover:scale-102'
                      } ${readOnly ? 'cursor-default opacity-80' : ''}`}
                  >
                    <div className="font-bold text-sm">{slot.label}</div>
                    <div className="text-xs opacity-80 font-medium">{slot.time}</div>
                    {slotTaken && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                        TAKEN
                      </div>
                    )}
                    {slotTaken && (
                      <div className="text-[9px] mt-1 opacity-75">
                        by {slotTaken.fullName.split(' ')[0]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 md:p-5 rounded-xl border border-yellow-100 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Login Password *</p>
              {!readOnly && (
                <button type="button" onClick={() => {
                  const p = Math.random().toString(36).slice(-8);
                  setFormData(prev => ({ ...prev, password: p }));
                }} className="text-yellow-700 bg-yellow-200 p-2 rounded-lg hover:bg-yellow-300 hover:text-yellow-800 transition-colors" title="Generate Random"><RefreshCw size={16} /></button>
              )}
            </div>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                disabled={readOnly}
                className="w-full bg-transparent border-b-2 border-yellow-300 font-mono text-yellow-900 focus:outline-none font-bold text-lg pr-10"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
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

          {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"><AlertTriangle size={16} /> {error}</p>}

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t-2 border-gray-100 gap-6 md:gap-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Total Amount</p>
              <p className="text-4xl font-black text-gray-800">₹{totalPrice}</p>
            </div>
            {!readOnly && (
              <div className="flex gap-4 w-full md:w-auto">
                {existingStudent && (
                  <button type="button" onClick={() => { if (confirm('Delete?')) onDelete(existingStudent.id); }} className="p-4 md:p-5 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border border-red-100"><Trash2 size={24} /></button>
                )}
                <button type="submit" disabled={loading} className="flex-1 md:flex-none px-6 md:px-10 py-4 md:py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-transform active:scale-95 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                  <Save size={24} /> {loading ? 'Saving...' : (existingStudent ? 'Update' : 'Confirm')}
                </button>
              </div>
            )}
          </div>

        </form>
      </div>

      {/* Photo Editor Modal */}
      {photoEditorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Camera className="text-teal-500" size={24} />
              Profile Photo Preview
            </h3>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="aspect-[413/531] w-48 mx-auto border-4 border-white shadow-lg rounded-xl overflow-hidden">
                <img src={tempPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="text-center mt-3 text-xs text-gray-500">
                Standard Passport Size (413x531px)
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhotoEditorOpen(false);
                  setTempPhotoUrl('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg transition-all"
              >
                ✓ Use This Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};