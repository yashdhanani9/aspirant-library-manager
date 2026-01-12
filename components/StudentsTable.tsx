import React, { useState } from 'react';
import { Student, Seat } from '../types';
import { Search, Lock, Edit, FileDown, User, Eye, Shield } from 'lucide-react';
import jsPDF from 'jspdf';

interface StudentsTableProps {
  students: Student[];
  seats: Seat[];
  onEdit: (student: Student) => void;
  onViewDocs: (student: Student) => void; // New prop for doc viewing
}

export const StudentsTable: React.FC<StudentsTableProps> = ({ students, seats, onEdit, onViewDocs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.mobile.includes(searchTerm) ||
    s.seatNumber.toString().includes(searchTerm)
  );

  const downloadStudentPDF = (student: Student) => {
    const doc = new jsPDF();
    
    // Header Teal
    doc.setFillColor(45, 212, 191); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Student Profile", 14, 25);
    
    doc.setFontSize(10);
    doc.text("Aspirant Library System", 160, 25);

    doc.setTextColor(0,0,0);
    
    let yPos = 60;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(student.fullName, 14, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`ID/Mobile: ${student.mobile}`, 14, yPos);
    yPos += 15;

    doc.setDrawColor(200);
    doc.line(14, yPos, 196, yPos);
    yPos += 15;

    const addRow = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(value, 80, yPos);
        yPos += 10;
    };

    addRow("Seat Number", student.seatNumber.toString());
    addRow("Plan", `${student.planType} (${student.duration})`);
    addRow("Valid From", student.startDate);
    addRow("Valid Until", student.endDate);
    addRow("Locker Access", student.lockerRequired ? "Yes (Active)" : "No");
    addRow("ID Type", student.idProofType || "Not Specified");
    
    doc.save(`Profile_${student.fullName}.pdf`);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-8">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-teal-100 focus:border-teal-200 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wide bg-gray-50 px-3 py-1 rounded-lg">
              {filteredStudents.length} Records
          </div>
      </div>

      {/* Modern Table List - Floating Cards Style */}
      <div className="space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-black text-gray-300 uppercase tracking-widest hidden md:grid">
              <div className="col-span-1">Seat</div>
              <div className="col-span-3">Student Info</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-3">Plan Details</div>
              <div className="col-span-1">Locker</div>
              <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                 const isExpired = new Date(student.endDate) < new Date();
                 const seat = seats.find(s => s.id === student.seatNumber);
                 
                 return (
                    <div 
                        key={student.id} 
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-5 bg-white border border-gray-100 rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all"
                    >
                        {/* Seat Mobile Label */}
                        <div className="md:col-span-1 flex items-center justify-between md:justify-start">
                            <span className="md:hidden text-xs font-bold text-gray-400 uppercase">Seat</span>
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-black flex items-center justify-center border border-teal-100 shadow-sm">
                                {student.seatNumber}
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="md:col-span-3 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                 {student.photoUrl ? (
                                     <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={18}/></div>
                                 )}
                             </div>
                             <div className="overflow-hidden">
                                 <h4 className="font-bold text-gray-800 text-sm truncate">{student.fullName}</h4>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    <span className="text-xs text-gray-400 font-medium">{isExpired ? 'Expired' : 'Active'}</span>
                                 </div>
                             </div>
                        </div>

                        {/* Contact */}
                        <div className="md:col-span-2">
                             <div className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1">Contact</div>
                             <p className="text-sm font-bold text-gray-700 font-mono">{student.mobile}</p>
                             <p className="text-[10px] text-gray-400 font-medium">Password: {student.password}</p>
                        </div>

                        {/* Plan */}
                        <div className="md:col-span-3">
                             <div className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1">Plan</div>
                             <p className="text-sm font-bold text-gray-800">{student.planType}</p>
                             <p className="text-xs text-gray-500">Exp: {student.endDate}</p>
                             <div className="flex gap-1 mt-1">
                                {student.assignedSlots.map(slot => (
                                    <span key={slot} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                                        {slot}
                                    </span>
                                ))}
                             </div>
                        </div>

                        {/* Locker */}
                        <div className="md:col-span-1">
                             <div className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1">Locker</div>
                             {student.lockerRequired ? (
                                 <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold border border-purple-100">
                                     <Lock size={10} /> Yes
                                 </div>
                             ) : (
                                 <span className="text-gray-300 text-sm font-medium">-</span>
                             )}
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex justify-end gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 w-full md:w-auto">
                             <button 
                                onClick={() => onViewDocs(student)}
                                className="p-2 rounded-xl text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100"
                                title="View Documents"
                             >
                                 <Shield size={16} />
                             </button>
                             <button 
                                onClick={() => downloadStudentPDF(student)}
                                className="p-2 rounded-xl text-orange-500 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100"
                                title="Download Profile"
                             >
                                 <FileDown size={16} />
                             </button>
                             <button 
                                onClick={() => onEdit(student)}
                                className="p-2 rounded-xl text-teal-500 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-100"
                                title="Edit Student"
                             >
                                 <Edit size={16} />
                             </button>
                        </div>
                    </div>
                 );
              })
          ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <User size={32} />
                  </div>
                  <p className="text-gray-400 font-medium">No students found matching your search.</p>
              </div>
          )}
      </div>
    </div>
  );
};