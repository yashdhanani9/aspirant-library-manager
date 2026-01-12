import React from 'react';
import { Student } from '../types';
import { X, Eye, Download, Image as ImageIcon, FileText } from 'lucide-react';

interface DocumentViewerModalProps {
    student: Student;
    onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ student, onClose }) => {
    const getDownloadUrl = (url: string) => {
        if (!url) return '';
        // If it's a Cloudinary URL, add the attachment flag
        if (url.includes('cloudinary.com')) {
            return url.replace('/upload/', '/upload/fl_attachment/');
        }
        return url;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Student Documents</h2>
                        <p className="text-gray-500 font-medium">{student.fullName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Photo Card */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                        <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 relative group">
                            {student.photoUrl ? (
                                <>
                                    <img src={student.photoUrl} className="w-full h-full object-cover" alt="Student Photo" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <a href={student.photoUrl} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-gray-800 hover:text-teal-600 shadow-xl transition-transform hover:scale-110"><Eye size={20} /></a>
                                        <a href={getDownloadUrl(student.photoUrl)} download className="p-3 bg-white rounded-full text-gray-800 hover:text-teal-600 shadow-xl transition-transform hover:scale-110"><Download size={20} /></a>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <ImageIcon size={48} />
                                    <span className="text-xs font-bold uppercase mt-2">No Photo</span>
                                </div>
                            )}
                        </div>
                        <div className="text-center w-full">
                            <p className="font-bold text-gray-800">Profile Photo</p>
                            <div className="flex gap-2 justify-center mt-3">
                                {student.photoUrl && (
                                    <>
                                        <a href={student.photoUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"><Eye size={12} /> View</a>
                                        <a href={getDownloadUrl(student.photoUrl)} download className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"><Download size={12} /> Save</a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ID Proof Card */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                        <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 relative group">
                            {student.idProofUrl ? (
                                <>
                                    <img src={student.idProofUrl} className="w-full h-full object-cover" alt="ID Proof" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <a href={student.idProofUrl} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-gray-800 hover:text-teal-600 shadow-xl transition-transform hover:scale-110"><Eye size={20} /></a>
                                        <a href={getDownloadUrl(student.idProofUrl)} download className="p-3 bg-white rounded-full text-gray-800 hover:text-teal-600 shadow-xl transition-transform hover:scale-110"><Download size={20} /></a>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <FileText size={48} />
                                    <span className="text-xs font-bold uppercase mt-2">No ID Proof</span>
                                </div>
                            )}
                        </div>
                        <div className="text-center w-full">
                            <p className="font-bold text-gray-800">{student.idProofType || "ID Proof"}</p>
                            <div className="flex gap-2 justify-center mt-3">
                                {student.idProofUrl && (
                                    <>
                                        <a href={student.idProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"><Eye size={12} /> View</a>
                                        <a href={getDownloadUrl(student.idProofUrl)} download className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"><Download size={12} /> Save</a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
