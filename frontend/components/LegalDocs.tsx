import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'TERMS' | 'PRIVACY' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <div className="flex items-center gap-2">
               {type === 'TERMS' ? <FileText className="text-lime-600"/> : <Shield className="text-lime-600"/>}
               <h2 className="text-xl font-black text-gray-800">
                   {type === 'TERMS' ? 'Terms & Conditions' : 'Privacy Policy'}
               </h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-8 overflow-y-auto text-gray-600 space-y-4 leading-relaxed custom-scrollbar">
            {type === 'TERMS' ? (
                <>
                    <p><strong>1. Membership Rules:</strong> Membership is non-transferable. Fees once paid are non-refundable.</p>
                    <p><strong>2. Library Decorum:</strong> Maintain silence. Mobile phones must be on silent mode.</p>
                    <p><strong>3. Seat Allocation:</strong> Seats are allocated for specific time slots. Occupying seats beyond allotted time is prohibited.</p>
                    <p><strong>4. Personal Belongings:</strong> The library is not responsible for loss of personal valuables. Use lockers at your own risk.</p>
                    <p><strong>5. Cleanliness:</strong> Keep the desk and surrounding area clean. Eating is allowed only in the cafeteria.</p>
                    <p><strong>6. Internet Usage:</strong> WiFi is for educational purposes only. Heavy downloading is restricted.</p>
                </>
            ) : (
                <>
                    <p><strong>1. Data Collection:</strong> We collect personal details (Name, Mobile, Photo, ID) solely for library management and security purposes.</p>
                    <p><strong>2. Data Security:</strong> Your data is stored securely and is accessible only to administration.</p>
                    <p><strong>3. Third Party Disclosure:</strong> We do not share your personal information with third parties unless required by law.</p>
                    <p><strong>4. Image Rights:</strong> Photos collected are used for ID card generation and identity verification.</p>
                    <p><strong>5. Contact:</strong> We may contact you via Mobile/Email for renewal reminders and library announcements.</p>
                </>
            )}
            <div className="pt-6 mt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
                Last Updated: January 2026 | Aspirant Library Management
            </div>
        </div>
      </div>
    </div>
  );
};