import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-scale-up">
                <div className={`p-6 md:p-8 text-center`}>
                    {isDangerous && (
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
                            <AlertTriangle size={32} />
                        </div>
                    )}

                    <h3 className="text-2xl font-black text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95
                        ${isDangerous
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                    : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-teal-200'
                                }
                    `}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
        </div>
    );
};
