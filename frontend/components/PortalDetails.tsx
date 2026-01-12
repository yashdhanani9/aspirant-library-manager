import React from 'react';
import { CONFIG } from '../config';
import { X, Info, CheckCircle, Server, Shield, Smartphone, Database, Zap } from 'lucide-react';
import { TOTAL_SEATS, TIME_SLOTS } from '../constants';

interface PortalDetailsProps {
  onClose: () => void;
}

export const PortalDetails: React.FC<PortalDetailsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden border-4 border-white/50">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">{CONFIG.APP_NAME}</h2>
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                        <span>v{CONFIG.VERSION}</span>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <span className="text-green-400">System Online</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"><X size={24}/></button>
            </div>
            
            {/* Decor */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-lime-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute top-0 right-20 w-20 h-20 bg-blue-500 rounded-full blur-2xl opacity-20"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar">
            
            {/* Description */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2"><Info className="text-lime-500"/> System Overview</h3>
                <p className="text-gray-600 leading-relaxed font-medium text-sm">
                    A comprehensive Library Management System designed to streamline seat allocation, student admissions, and fee tracking. 
                    Built with modern web technologies, it features a real-time 3D seat grid, automated expiry alerts, revenue analytics, and secure document management for ID proofs and photos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Library Specs */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Library Facilities</h3>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm font-bold text-gray-700 border-b border-gray-50 pb-2">
                            <span>Total Capacity</span>
                            <span className="text-black bg-lime-100 px-2 py-0.5 rounded-md text-lime-700">{TOTAL_SEATS} Seats</span>
                        </li>
                        <li className="flex justify-between items-center text-sm font-bold text-gray-700 border-b border-gray-50 pb-2">
                            <span>Time Slots</span>
                            <span className="text-black">{TIME_SLOTS.length} Shifts (24h)</span>
                        </li>
                         <li className="flex justify-between items-center text-sm font-bold text-gray-700 border-b border-gray-50 pb-2">
                            <span>Locker Facility</span>
                            <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> Available</span>
                        </li>
                        <li className="flex justify-between items-center text-sm font-bold text-gray-700 border-b border-gray-50 pb-2">
                            <span>WiFi Management</span>
                            <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> Integrated</span>
                        </li>
                    </ul>
                </div>

                {/* Tech Specs */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">System Architecture</h3>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-medium text-gray-600">
                            <Server size={18} className="text-indigo-500"/>
                            <span>Client-Side DB (LocalStorage)</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-gray-600">
                            <Shield size={18} className="text-emerald-500"/>
                            <span>Role-Based Access (Admin/Student)</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-gray-600">
                            <Smartphone size={18} className="text-orange-500"/>
                            <span>Responsive Mobile Interface</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-gray-600">
                            <Zap size={18} className="text-yellow-500"/>
                            <span>Auto Image Compression v2</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Config Info */}
             <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-6">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14}/> Environment Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono text-blue-900">
                    <div>
                        <span className="text-blue-400 font-bold block text-[10px] uppercase">API Endpoint</span>
                        {CONFIG.API_BASE_URL}
                    </div>
                    <div>
                        <span className="text-blue-400 font-bold block text-[10px] uppercase">Client Version</span>
                        {CONFIG.VERSION}
                    </div>
                    <div>
                        <span className="text-blue-400 font-bold block text-[10px] uppercase">Features</span>
                        {CONFIG.ENABLE_EMAIL_NOTIFICATIONS ? 'Email: ON' : 'Email: OFF'} • {CONFIG.ENABLE_AUTO_BACKUP ? 'Backup: ON' : 'Backup: Manual'}
                    </div>
                </div>
             </div>

            {/* Developer Info */}
             <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Developed By</p>
                        <h3 className="text-2xl font-black tracking-tight">Appygrowth</h3>
                        <p className="text-gray-400 text-xs mt-2 font-medium">Empowering educational spaces with smart technology.</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-md">🚀</div>
                </div>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500 rounded-full blur-[60px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>
            </div>

        </div>
      </div>
    </div>
  );
};