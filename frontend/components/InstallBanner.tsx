import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface InstallBannerProps {
  deferredPrompt: any;
  onInstall: () => void;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ deferredPrompt, onInstall }) => {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Android: Show if deferredPrompt exists
    if (deferredPrompt) {
        setIsVisible(true);
    }

    // iOS Detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
       setIsVisible(true);
       setShowIOSPrompt(true);
    }
  }, [deferredPrompt]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] animate-in slide-in-from-bottom-5">
       <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-700 relative overflow-hidden">
          
          {/* Close Button */}
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400"
          >
              <X size={14} />
          </button>

          <div className="flex items-start gap-4 pr-6">
             <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-green-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                <Download size={24} className="text-white" />
             </div>
             <div>
                 <h4 className="font-bold text-lg leading-tight mb-1">Install App</h4>
                 <p className="text-gray-400 text-xs font-medium">
                    {showIOSPrompt 
                        ? "Install Aspirant for a better experience."
                        : "Add to Home Screen for fullscreen access."}
                 </p>
                 
                 {showIOSPrompt ? (
                     <div className="mt-3 text-xs text-gray-300 bg-gray-800 p-2 rounded-lg border border-gray-700 flex flex-col gap-1">
                         <div className="flex items-center gap-2">1. Tap <Share size={14} className="text-blue-400"/> <strong>Share</strong> in menu bar</div>
                         <div className="flex items-center gap-2">2. Scroll & Tap <PlusSquare size={14} className="text-gray-200"/> <strong>Add to Home Screen</strong></div>
                     </div>
                 ) : (
                     <button 
                        onClick={onInstall}
                        className="mt-3 bg-lime-500 hover:bg-lime-600 text-gray-900 px-6 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-lime-900/20"
                     >
                        Install Now
                     </button>
                 )}
             </div>
          </div>
       </div>
    </div>
  );
};