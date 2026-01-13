import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Student, Seat, WifiNetwork, GlobalAnnouncement, AdmissionRequest, Transaction } from './types';
import { MockService } from './services/mockDatabase';
import { ApiService } from './services/api';
import { TOTAL_SEATS } from './constants';

import { SeatGrid } from './components/SeatGrid';
import { StudentModal } from './components/StudentModal';
import { RevenueChart } from './components/RevenueChart';
import { StudentsTable } from './components/StudentsTable';
import { AdmissionForm } from './components/AdmissionForm';
import { LegalModal } from './components/LegalDocs';
import { PortalDetails } from './components/PortalDetails';
import { InstallBanner } from './components/InstallBanner';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { CONFIG } from './config';
import {
    LogOut, LayoutGrid, Users, DollarSign, Settings, Lock,
    TrendingUp, Wifi, Bell, Trash2, Plus, AlertTriangle,
    Menu, Search, ChevronRight, BookOpen, UserCircle, Eye, EyeOff, FileText, CheckCircle, Hand,
    MapPin, Phone, Mail, User, Edit, Camera, Clock, Database, Download, Upload, Shield, Terminal, RefreshCw, X, Info, Smartphone, Key, MessageCircle
} from 'lucide-react';

const SESSION_KEY = 'ASPIRANT_LIB_SESSION';

// Helper for photo upload with higher compression to save DB space
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Aggressive compression for localStorage
                const MAX_WIDTH = 300;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                } else reject();
            };
        };
        reader.onerror = reject;
    });
};

// Extracted Component to prevent re-renders
const SidebarItem = React.memo(({ id, label, icon: Icon, active, badge, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 mb-2 font-bold ${active
            ? 'bg-gradient-to-r from-teal-100 to-cyan-50 text-teal-700 shadow-sm translate-x-1'
            : 'text-gray-500 hover:bg-gray-50 hover:text-teal-600'
            }`}
    >
        <Icon size={22} className={active ? "text-teal-600 drop-shadow-sm" : ""} />
        <span>{label}</span>
        {badge > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{badge}</span>
        )}
        {active && !badge && <ChevronRight size={18} className="ml-auto text-teal-500" />}
    </button>
));

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<{ role: UserRole; user: Student | null } | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('ALL');
    const [filterPlanType, setFilterPlanType] = useState<string>('ALL');
    const [filterActiveStatus, setFilterActiveStatus] = useState<string>('ALL');

    // Responsive Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // Admin Extra Data
    const [wifiList, setWifiList] = useState<WifiNetwork[]>([]);
    const [globalAnnouncement, setGlobalAnnouncement] = useState<GlobalAnnouncement>({ message: '', isActive: false, updatedAt: '' });
    const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>([]);
    const [expiringStudents, setExpiringStudents] = useState<Student[]>([]);
    const [studentsList, setStudentsList] = useState<Student[]>([]);
    const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);

    // Pending Admission State (Workflow connection)
    const [pendingAdmissionId, setPendingAdmissionId] = useState<string | null>(null);

    // Settings Forms
    const [newWifiSSID, setNewWifiSSID] = useState('');
    const [newWifiPass, setNewWifiPass] = useState('');
    const [announcementMsg, setAnnouncementMsg] = useState('');
    const [announcementType, setAnnouncementType] = useState<'ALERT' | 'NOTIFICATION'>('ALERT');
    const fileInputImportRef = useRef<HTMLInputElement>(null);

    // Raw Editor State
    const [showRawEditor, setShowRawEditor] = useState(false);
    const [rawData, setRawData] = useState('');

    // Login State
    const [loginMobile, setLoginMobile] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showAdmissionForm, setShowAdmissionForm] = useState(false);
    const [admissionSuccess, setAdmissionSuccess] = useState(false);

    // View State
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STUDENTS' | 'ADMISSIONS' | 'REVENUE' | 'SETTINGS' | 'PROFILE'>('DASHBOARD');

    // Legal Modal
    const [legalModalType, setLegalModalType] = useState<'TERMS' | 'PRIVACY' | null>(null);
    const [showPortalDetails, setShowPortalDetails] = useState(false);

    // Doc Viewer State
    const [viewingDocStudent, setViewingDocStudent] = useState<Student | null>(null);

    // Profile Edit State
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // On Desktop, default to open if it was closed, or keep user preference?
                // Let's keep it simple: Expand on desktop resize
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Session Persistence Logic
    useEffect(() => {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed.role === UserRole.ADMIN) {
                    setCurrentUser(parsed);
                } else if (parsed.role === UserRole.STUDENT && parsed.user?.id) {
                    const freshStudent = MockService.getStudent(parsed.user.id);
                    if (freshStudent && freshStudent.isActive) {
                        setCurrentUser({ role: UserRole.STUDENT, user: freshStudent });
                    } else {
                        localStorage.removeItem(SESSION_KEY);
                    }
                }
            } catch (e) {
                localStorage.removeItem(SESSION_KEY);
            }
        }
    }, []);

    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setConnectionError(false); // Reset error on retry
            try {
                const [seatsData, wifiData, annData, studData, txData] = await Promise.all([
                    ApiService.getSeatsStatus(),
                    ApiService.getWifiNetworks(),
                    ApiService.getAnnouncement(),
                    ApiService.getAllStudents(),
                    ApiService.getTransactions()
                ]);

                setSeats(seatsData);
                setWifiList(wifiData);
                setGlobalAnnouncement(annData);
                if (annData.message) setAnnouncementMsg(annData.message);
                setStudentsList(studData);
                setTransactionsList(txData);
            } catch (e) {
                console.error("Failed to load live data", e);
                setConnectionError(true);
            }
        };
        loadData();
    }, [refreshTrigger, currentUser]);

    // Install Prompt Listener
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    setShowInstallButton(false);
                }
                setDeferredPrompt(null);
            });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await ApiService.login(loginMobile, loginPass);
            if (result) {
                setCurrentUser(result);
                localStorage.setItem(SESSION_KEY, JSON.stringify(result));
                setLoginError('');
                setLoginMobile('');
                setLoginPass('');
                setActiveTab('DASHBOARD');
            }
        } catch (err) {
            setLoginError('Invalid credentials or Server Error.');
        }
    };


    const handleLogout = () => {
        setCurrentUser(null);
        setSelectedSeat(null);
        localStorage.removeItem(SESSION_KEY);
    };

    const forceUpdate = () => setRefreshTrigger(prev => prev + 1);

    // --- Handlers ---
    const handleAddWifi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newWifiSSID && newWifiPass) {
            try {
                await ApiService.addWifiNetwork(newWifiSSID, newWifiPass);
                setNewWifiSSID('');
                setNewWifiPass('');
                forceUpdate(); // Re-fetch
            } catch (e) {
                alert("Failed to save network");
            }
        }
    };

    const handleDeleteWifi = async (id: string) => {
        if (!confirm("Remove this network?")) return;
        try {
            await ApiService.deleteWifiNetwork(id);
            forceUpdate();
        } catch (e) {
            alert("Failed to delete");
        }
    };

    const handleUpdateAnnouncement = () => {
        MockService.setAnnouncement(announcementMsg, true, announcementType);
        forceUpdate();
        alert(`${announcementType === 'ALERT' ? 'Emergency Alert' : 'Notification'} sent to all students.`);
    };

    const handleClearAnnouncement = () => {
        MockService.setAnnouncement('', false);
        setAnnouncementMsg('');
        forceUpdate();
    };

    const handleRejectAdmission = (id: string) => {
        if (confirm('Reject this application?')) {
            MockService.deleteAdmissionRequest(id);
            forceUpdate();
        }
    };

    const handleStartReviewAdmission = (reqId: string) => {
        setPendingAdmissionId(reqId);
        setActiveTab('DASHBOARD');
    };

    const handleProfilePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && currentUser?.user) {
            try {
                const photoUrl = await compressImage(e.target.files[0]);
                const updatedStudent = { ...currentUser.user, photoUrl };
                MockService.updateStudent(updatedStudent);
                setCurrentUser({ ...currentUser, user: updatedStudent });
                localStorage.setItem(SESSION_KEY, JSON.stringify({ ...currentUser, user: updatedStudent }));
                forceUpdate();
            } catch (err) {
                console.error(err);
                alert("Failed to update photo.");
            }
        }
    };

    // Database Handlers
    const handleExportDB = () => {
        const data = MockService.exportDatabase();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aspirant_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (MockService.importDatabase(content)) {
                    alert("Database Restored Successfully! The page will reload.");
                    window.location.reload();
                } else {
                    alert("Failed to import database. Invalid file format.");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleCleanupDB = () => {
        if (confirm("Permanently delete data of students who expired more than 30 days ago? This action cannot be undone.")) {
            const count = MockService.cleanupOldData();
            forceUpdate();
            alert(`Cleanup Complete. Removed ${count} old records.`);
        }
    };

    const handleSeedData = () => {
        if (confirm("Warning: This will ERASE all current data and generate sample data. Continue?")) {
            MockService.generateDummyData();
            alert("Database populated with sample data. Page will reload.");
            window.location.reload();
        }
    };

    const handleOpenRawEditor = () => {
        setRawData(MockService.exportDatabase());
        setShowRawEditor(true);
    };

    const handleSaveRawData = () => {
        try {
            // Validation attempt
            JSON.parse(rawData);
            if (MockService.importDatabase(rawData)) {
                alert("Database updated successfully from raw input.");
                setShowRawEditor(false);
                window.location.reload();
            } else {
                alert("Structure validation failed.");
            }
        } catch (e) {
            alert("Invalid JSON format.");
        }
    };

    const handleNavClick = (tab: any) => {
        setActiveTab(tab);
        // Auto close sidebar on mobile
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    // --- LOGIN SCREEN (Turquoise/Aquamarine Theme) ---
    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600 p-4">
                <InstallBanner deferredPrompt={deferredPrompt} onInstall={handleInstallClick} />
                <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />

                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-lg relative overflow-hidden border-4 border-white/50 min-h-[600px] flex flex-col">

                    {/* Background Decor */}
                    {!showAdmissionForm && (
                        <>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50 -ml-10 -mb-10 pointer-events-none"></div>
                        </>
                    )}

                    {showAdmissionForm ? (
                        // --- PUBLIC ADMISSION FORM ---
                        admissionSuccess ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                                <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4 animate-bounce">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-800">Application Sent!</h2>
                                <p className="text-gray-500 max-w-xs">Your admission request has been submitted. The admin will review it and notify you via email.</p>
                                <button
                                    onClick={() => { setAdmissionSuccess(false); setShowAdmissionForm(false); }}
                                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
                                >
                                    Back to Login
                                </button>
                            </div>
                        ) : (
                            <AdmissionForm
                                onBack={() => setShowAdmissionForm(false)}
                                onSubmitSuccess={() => setAdmissionSuccess(true)}
                            />
                        )
                    ) : (
                        // --- LOGIN FORM ---
                        <div className="p-8 md:p-12 flex flex-col h-full">
                            <div className="text-center mb-8 relative z-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl mb-6 shadow-lg shadow-cyan-500/30 transform rotate-3">
                                    <BookOpen className="text-white" size={40} />
                                </div>
                                <h1 className="text-4xl font-black text-gray-800 tracking-tight">Aspirant Library</h1>
                                <p className="text-gray-500 mt-2 text-lg font-medium">Your Personal Growth Space</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5 relative z-10 flex-1">
                                <div className="space-y-2">
                                    <label className="text-gray-600 text-sm font-bold ml-1 uppercase tracking-wider">Mobile / ID</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-inner"
                                        placeholder="Enter your ID"
                                        value={loginMobile}
                                        onChange={e => setLoginMobile(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-gray-600 text-sm font-bold ml-1 uppercase tracking-wider">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showLoginPassword ? "text" : "password"}
                                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all shadow-inner pr-12"
                                            placeholder="••••••••"
                                            value={loginPass}
                                            onChange={e => setLoginPass(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                                        >
                                            {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm">
                                        <AlertTriangle size={18} /> {loginError}
                                    </div>
                                )}

                                <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white p-4 rounded-2xl font-bold text-lg shadow-[0_10px_20px_rgba(20,184,166,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 border-b-4 border-teal-700 active:border-b-0 active:translate-y-1">
                                    Access Portal
                                </button>



                                <div className="text-center pt-2">
                                    <button type="button" onClick={() => setShowAdmissionForm(true)} className="text-teal-600 font-bold hover:underline text-sm">
                                        New Student? Apply for Admission
                                    </button>
                                </div>
                            </form>

                            {/* Footer Branding & Legal */}
                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-2 relative z-10">
                                <div className="flex gap-4 text-xs font-bold text-gray-400">
                                    <button onClick={() => setLegalModalType('TERMS')} className="hover:text-gray-600">Terms & Conditions</button>
                                    <span>•</span>
                                    <button onClick={() => setLegalModalType('PRIVACY')} className="hover:text-gray-600">Privacy Policy</button>
                                </div>
                                <div className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">
                                    Made by Appygrowth v{CONFIG.VERSION}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- DATA PREP ---
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const studentData = !isAdmin ? currentUser.user! : null;
    const allStudents = studentsList; // Use live data
    const transactions = transactionsList; // Use live data
    const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const activeStudents = allStudents.filter(s => s.isActive).length;

    // Seat Stats Calculation
    const seatStats = seats.reduce((acc, seat) => {
        const slotsTaken = new Set<string>();
        seat.occupants.forEach(s => s.assignedSlots.forEach(slot => slotsTaken.add(slot)));

        if (slotsTaken.size === 0) acc.available++;
        else if (slotsTaken.size >= 4) acc.occupied++;
        else acc.partial++;
        return acc;
    }, { available: 0, partial: 0, occupied: 0 });

    // Student Expiry Check
    let expiryAlert = null;
    if (studentData) {
        const today = new Date();
        const endDate = new Date(studentData.endDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 5 && diffDays >= 0) {
            expiryAlert = { days: diffDays, date: studentData.endDate };
        }
    }

    // Pending Admission Object
    const pendingAdmissionRequest = pendingAdmissionId ? admissionRequests.find(r => r.id === pendingAdmissionId) : null;

    // --- SIDEBAR COMPONENT REMOVED (Hoisted) ---

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR (Responsive) */}
            <aside className={`
                fixed md:relative z-50 h-full bg-white transition-all duration-300 flex flex-col shrink-0 border-r border-gray-100 shadow-2xl md:shadow-none overflow-hidden
                ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 md:translate-x-0 md:w-0'}
            `}>
                {/* Container to prevent layout shift of inner content during width transition */}
                <div className="w-72 h-full flex flex-col overflow-hidden bg-white">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200">
                                <BookOpen className="text-white" size={24} />
                            </div>

                            <div>
                                <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">Aspirant</h1>
                                <span className="text-teal-600 font-semibold text-xs uppercase tracking-widest">Library</span>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-4">Main Menu</div>
                            <SidebarItem id="DASHBOARD" label="Dashboard" icon={LayoutGrid} active={activeTab === 'DASHBOARD'} onClick={() => handleNavClick('DASHBOARD')} />

                            {isAdmin ? (
                                <>
                                    <SidebarItem id="STUDENTS" label="Students" icon={Users} active={activeTab === 'STUDENTS'} onClick={() => handleNavClick('STUDENTS')} />
                                    <SidebarItem
                                        id="ADMISSIONS"
                                        label="Admissions"
                                        icon={FileText}
                                        active={activeTab === 'ADMISSIONS'}
                                        badge={admissionRequests.length}
                                        onClick={() => handleNavClick('ADMISSIONS')}
                                    />
                                    <SidebarItem id="REVENUE" label="Finance" icon={TrendingUp} active={activeTab === 'REVENUE'} onClick={() => handleNavClick('REVENUE')} />
                                    <SidebarItem id="SETTINGS" label="Settings" icon={Settings} active={activeTab === 'SETTINGS'} onClick={() => handleNavClick('SETTINGS')} />
                                </>
                            ) : (
                                // Student Links
                                <SidebarItem id="PROFILE" label="My Profile" icon={UserCircle} active={activeTab === 'PROFILE'} onClick={() => handleNavClick('PROFILE')} />
                            )}

                            {/* Install Button (Visible only if installable) */}
                            {showInstallButton && (
                                <SidebarItem
                                    id="INSTALL"
                                    label="Install App"
                                    icon={Smartphone}
                                    active={false}
                                    onClick={handleInstallClick}
                                />
                            )}
                        </nav>
                    </div>

                    <div className="mt-auto p-6">
                        <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 shadow-inner">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-white border-2 border-teal-100 flex items-center justify-center font-bold text-lg text-teal-700 shadow-sm">
                                    {isAdmin ? 'A' : studentData?.fullName.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm text-gray-800 truncate">{isAdmin ? 'Administrator' : studentData?.fullName}</p>
                                    <p className="text-xs text-gray-500 truncate font-medium">{isAdmin ? 'Super User' : studentData?.mobile}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-white text-red-500 hover:bg-red-50 hover:text-red-600 py-3 rounded-xl transition-all shadow-sm border border-gray-100"
                            >
                                <LogOut size={14} /> Log Out
                            </button>
                        </div>
                        {/* Branding in Sidebar */}
                        <div className="text-center mt-4 text-[9px] font-bold text-gray-300 tracking-widest uppercase cursor-pointer hover:text-teal-600 transition-colors" onClick={() => setShowPortalDetails(true)}>
                            Made by {CONFIG.APP_NAME} v{CONFIG.VERSION}
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
                <InstallBanner deferredPrompt={deferredPrompt} onInstall={handleInstallClick} />

                {/* TOP BAR */}
                <header className="bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 md:py-5 flex items-center justify-between z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 text-gray-600 bg-white shadow-sm border border-gray-100 rounded-xl hover:bg-gray-50 active:scale-95 transition-transform">
                            <Menu size={22} />
                        </button>
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-4 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-12 pr-4 py-2.5 bg-gray-100 rounded-2xl text-sm w-72 focus:bg-white focus:ring-4 focus:ring-teal-100 focus:border-teal-200 border border-transparent outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-teal-500 transition-colors cursor-pointer relative">
                            <Bell size={20} />
                            {(admissionRequests.length > 0 && isAdmin) || (globalAnnouncement.isActive && globalAnnouncement.message) ? (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                            ) : null}
                        </div>
                    </div>
                </header>

                {/* CONNECTION ERROR BANNER */}
                {connectionError && (
                    <div className="bg-red-500 text-white px-4 py-3 text-center font-bold relative z-50 flex items-center justify-center gap-4">
                        <span>⚠️ Unable to connect to Server. It might be waking up...</span>
                        <button
                            onClick={() => setRefreshTrigger(p => p + 1)}
                            className="bg-white text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* SCROLL AREA */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">

                    {/* WELCOME BANNER (Dashboard Only) */}
                    {activeTab === 'DASHBOARD' && (
                        <div className="w-full bg-gradient-to-r from-teal-400 to-cyan-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 mb-8 md:mb-10 text-white shadow-[0_20px_40px_rgba(20,184,166,0.25)] relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold mb-3 border border-white/10">
                                    {new Date().toDateString()}
                                </div>
                                <h2 className="text-2xl md:text-5xl font-black mb-3 tracking-tight">
                                    Hello, {isAdmin ? 'Admin' : studentData?.fullName.split(' ')[0]}!
                                </h2>
                                <p className="text-cyan-50 max-w-lg font-medium text-sm md:text-lg leading-relaxed">
                                    {isAdmin ? "Welcome to the control center. Monitor seats and students in real-time." : "Your learning journey is on track. Keep exploring new heights!"}
                                </p>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-105 transition-transform duration-700">
                                <BookOpen size={400} />
                            </div>
                            <div className="absolute top-10 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-30 mix-blend-overlay animate-pulse"></div>
                        </div>
                    )}

                    {/* ADMISSION WORKFLOW BANNER */}
                    {pendingAdmissionRequest && activeTab === 'DASHBOARD' && (
                        <div className="mb-8 bg-blue-500 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between animate-fade-in border-4 border-blue-400 gap-4 md:gap-0">
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse shrink-0">
                                    <Hand size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg md:text-xl">Assigning Seat for {pendingAdmissionRequest.fullName}</h3>
                                    <p className="text-blue-100 font-medium text-xs md:text-sm">Please select an available seat from the grid below to complete admission.</p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">{pendingAdmissionRequest.planType}</span>
                                        {pendingAdmissionRequest.preferredSlots?.map(s => <span key={s} className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">{s}</span>)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingAdmissionId(null)}
                                className="w-full md:w-auto bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* NOTIFICATIONS */}
                    {expiryAlert && !isAdmin && (
                        <div className="mb-8 bg-white border-l-8 border-orange-400 p-6 rounded-2xl shadow-lg shadow-orange-100 flex items-start gap-4">
                            <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><AlertTriangle size={24} /></div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Renewal Required</h3>
                                <p className="text-gray-500 mt-1 font-medium">
                                    Your membership expires in <span className="font-bold bg-orange-100 px-2 py-0.5 rounded text-orange-600">{expiryAlert.days} days</span>.
                                    Please visit the admin desk.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- GLOBAL ANNOUNCEMENT (Student View) --- */}
                    {activeTab === 'DASHBOARD' && !isAdmin && globalAnnouncement && globalAnnouncement.isActive && (
                        <div className={`mb-8 p-6 rounded-2xl shadow-lg flex items-start gap-4 animate-fade-in ${globalAnnouncement.type === 'ALERT' ? 'bg-red-50 border-l-8 border-red-500 shadow-red-100' : 'bg-blue-50 border-l-8 border-blue-500 shadow-blue-100'}`}>
                            <div className={`p-3 rounded-xl ${globalAnnouncement.type === 'ALERT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${globalAnnouncement.type === 'ALERT' ? 'text-red-800' : 'text-blue-800'}`}>
                                    {globalAnnouncement.type === 'ALERT' ? 'Important Alert' : 'New Notification'}
                                </h3>
                                <p className={`mt-1 font-medium ${globalAnnouncement.type === 'ALERT' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {globalAnnouncement.message}
                                </p>
                                <p className="text-xs mt-2 opacity-60 font-bold uppercase tracking-widest">
                                    {new Date(globalAnnouncement.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CONTENT SWITCHER */}
                    <div className="space-y-8">

                        {activeTab === 'DASHBOARD' && (
                            <>
                                {/* Stats Cards (Admin) */}
                                {isAdmin && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                            <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform">
                                                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
                                                    <Users size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Students</p>
                                                    <h3 className="text-3xl font-black text-gray-800">{activeStudents}</h3>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform">
                                                <div className="w-16 h-16 rounded-3xl bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-inner">
                                                    <LayoutGrid size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Seat Status</p>
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-center">
                                                            <div className="text-lg font-black text-teal-600">{seatStats.available}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Free</div>
                                                        </div>
                                                        <div className="w-px h-8 bg-gray-100"></div>
                                                        <div className="text-center">
                                                            <div className="text-lg font-black text-orange-500">{seatStats.partial}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Partial</div>
                                                        </div>
                                                        <div className="w-px h-8 bg-gray-100"></div>
                                                        <div className="text-center">
                                                            <div className="text-lg font-black text-red-500">{seatStats.occupied}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Full</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform">
                                                <div className="w-16 h-16 rounded-3xl bg-yellow-50 text-yellow-600 flex items-center justify-center shadow-inner">
                                                    <DollarSign size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                                                    <h3 className="text-3xl font-black text-gray-800">₹{totalRevenue.toLocaleString()}</h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Export Button */}
                                        <div className="mb-6 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    // Generate CSV
                                                    const headers = ['ID', 'Name', 'Mobile', 'Email', 'Seat', 'Plan', 'Duration', 'Start Date', 'End Date', 'Amount Paid', 'Payment Mode', 'Assigned Slots', 'Active'];
                                                    const rows = allStudents.map(s => [
                                                        s.id,
                                                        s.fullName,
                                                        s.mobile,
                                                        s.email,
                                                        s.seatNumber,
                                                        s.planType,
                                                        s.duration,
                                                        new Date(s.startDate).toLocaleDateString('en-GB'),
                                                        new Date(s.endDate).toLocaleDateString('en-GB'),
                                                        s.amountPaid,
                                                        s.paymentMode || 'N/A',
                                                        s.assignedSlots.join('; '),
                                                        s.isActive ? 'Yes' : 'No'
                                                    ]);

                                                    const csvContent = [
                                                        headers.join(','),
                                                        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                                                    ].join('\n');

                                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                                    const link = document.createElement('a');
                                                    link.href = URL.createObjectURL(blob);
                                                    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
                                                    link.click();
                                                }}
                                                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-colors"
                                            >
                                                <Download size={20} />
                                                Export Students to CSV
                                            </button>
                                        </div>

                                        {/* --- DETAIL EXPIRING SOON LIST (Chronological) --- */}
                                        {expiringStudents.length > 0 && (
                                            <div className="mb-10 bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8">
                                                <h3 className="text-xl font-black text-orange-800 mb-6 flex items-center gap-2">
                                                    <AlertTriangle size={24} /> Expiring Soon (Next 5 Days)
                                                </h3>
                                                <div className="space-y-6">
                                                    {/* Group by Days */}
                                                    {[0, 1, 2, 3, 4, 5].map(dayOffset => {
                                                        const targetDate = new Date();
                                                        targetDate.setDate(targetDate.getDate() + dayOffset);
                                                        const targetDateStr = targetDate.toISOString().split('T')[0];

                                                        const studentsInGroup = expiringStudents.filter(s => s.endDate === targetDateStr);

                                                        if (studentsInGroup.length === 0) return null;

                                                        const groupLabel = dayOffset === 0 ? 'Today' :
                                                            dayOffset === 1 ? 'Tomorrow' :
                                                                dayOffset === 2 ? 'Day After Tomorrow' :
                                                                    new Date(targetDateStr).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

                                                        const groupColor = dayOffset === 0 ? 'text-red-600 bg-red-100' :
                                                            dayOffset === 1 ? 'text-orange-600 bg-orange-100' :
                                                                'text-yellow-700 bg-yellow-100';

                                                        return (
                                                            <div key={dayOffset} className="space-y-3">
                                                                <h4 className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded inline-block ${groupColor}`}>{groupLabel}</h4>
                                                                {studentsInGroup.map(s => (
                                                                    <div key={s.id} className="bg-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-orange-100 gap-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-50 flex items-center justify-center text-orange-700 font-black text-xl shadow-inner border border-orange-200">
                                                                                {s.seatNumber}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-bold text-gray-800 text-lg">{s.fullName}</p>
                                                                                <div className="flex gap-2 text-xs font-bold mt-1">
                                                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{s.planType}</span>
                                                                                    <span className="text-orange-600">{s.mobile}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Contact Actions */}
                                                                            <a
                                                                                href={`https://wa.me/91${s.mobile}?text=Hi ${s.fullName}, your library subscription for Seat ${s.seatNumber} is expiring on ${s.endDate}. Please renew to continue access.`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors border border-green-200"
                                                                                title="Chat on WhatsApp"
                                                                            >
                                                                                <MessageCircle size={20} />
                                                                            </a>
                                                                            <a
                                                                                href={`tel:${s.mobile}`}
                                                                                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
                                                                                title="Call Student"
                                                                            >
                                                                                <Phone size={20} />
                                                                            </a>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const seat = seats.find(st => st.id === s.seatNumber);
                                                                                    if (seat) setSelectedSeat({ ...seat, occupants: [s] });
                                                                                }}
                                                                                className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg shadow-gray-200 ml-2"
                                                                            >
                                                                                Renew Now
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Student Specific */}
                                {!isAdmin && studentData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-shadow">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-teal-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
                                            <h3 className="text-xl font-black text-gray-800 mb-6 relative z-10 flex items-center gap-2">
                                                <div className="w-2 h-8 bg-teal-500 rounded-full"></div> Current Plan
                                            </h3>
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-2xl font-black text-3xl shadow-lg shadow-teal-200 border-b-4 border-teal-700">
                                                    {studentData.seatNumber}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">Type</p>
                                                    <p className="font-bold text-gray-800 text-lg">{studentData.planType}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">Expires</p>
                                                    <p className={`font-bold text-lg ${expiryAlert ? 'text-orange-500' : 'text-teal-600'}`}>
                                                        {new Date(studentData.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-500 mt-1">
                                                        {(() => {
                                                            const days = Math.ceil((new Date(studentData.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                            return days > 0 ? `in ${days} day${days > 1 ? 's' : ''}` : 'Expired';
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden hover:shadow-xl transition-shadow">
                                            <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                                                <Wifi size={24} className="text-blue-500" /> WiFi Access
                                            </h3>
                                            <div className="space-y-4">
                                                {wifiList.map(w => (
                                                    <div key={w.id} className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 hover:bg-blue-50 transition-colors">
                                                        <span className="font-bold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> {w.ssid}</span>
                                                        <code className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 font-bold font-mono shadow-sm">{w.password}</code>
                                                    </div>
                                                ))}
                                                {wifiList.length === 0 && <p className="text-gray-400 italic font-medium">No WiFi configured yet.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-4 md:p-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-6">
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black text-gray-800">Live Seat Map</h3>
                                            <p className="text-gray-400 font-medium mt-1 text-sm md:text-base">Real-time availability status</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs font-bold bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-inner w-full md:w-auto">
                                            <div className="flex items-center gap-2 px-2 text-green-700"><div className="w-3 h-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-md shadow-sm"></div> Empty</div>
                                            <div className="flex items-center gap-2 px-2 text-yellow-700"><div className="w-3 h-3 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-md shadow-sm"></div> 1 Student</div>
                                            <div className="flex items-center gap-2 px-2 text-orange-700"><div className="w-3 h-3 bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300 rounded-md shadow-sm"></div> 2 Students</div>
                                            <div className="flex items-center gap-2 px-2 text-orange-800"><div className="w-3 h-3 bg-gradient-to-br from-orange-200 to-red-100 border-2 border-orange-400 rounded-md shadow-sm"></div> 3 Students</div>
                                            <div className="flex items-center gap-2 px-2 text-red-600"><div className="w-3 h-3 bg-gradient-to-br from-red-100 to-rose-100 border-2 border-red-300 rounded-md shadow-sm"></div> Full (4)</div>
                                        </div>
                                    </div>

                                    {/* Search & Filter Section */}
                                    {isAdmin && (
                                        <div className="mb-6 space-y-3">
                                            <div className="flex flex-col md:flex-row gap-3">
                                                {/* Search Bar */}
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="🔍 Search by name, mobile, or seat number..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full p-3 pl-4 pr-10 bg-white border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm font-medium"
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Filters */}
                                                <div className="flex gap-2">
                                                    <select
                                                        value={filterPaymentStatus}
                                                        onChange={(e) => setFilterPaymentStatus(e.target.value)}
                                                        className="p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-bold text-gray-700"
                                                    >
                                                        <option value="ALL">All Payments</option>
                                                        <option value="CASH">💰 Cash</option>
                                                        <option value="ONLINE">💳 Online</option>
                                                        <option value="PENDING">⏳ Pending</option>
                                                    </select>

                                                    <select
                                                        value={filterPlanType}
                                                        onChange={(e) => setFilterPlanType(e.target.value)}
                                                        className="p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-bold text-gray-700"
                                                    >
                                                        <option value="ALL">All Plans</option>
                                                        <option value="4 Hours">4 Hours</option>
                                                        <option value="6 Hours">6 Hours</option>
                                                        <option value="8 Hours">8 Hours</option>
                                                        <option value="12 Hours">12 Hours</option>
                                                    </select>

                                                    <select
                                                        value={filterActiveStatus}
                                                        onChange={(e) => setFilterActiveStatus(e.target.value)}
                                                        className="p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-bold text-gray-700"
                                                    >
                                                        <option value="ALL">All Status</option>
                                                        <option value="ACTIVE">✅ Active</option>
                                                        <option value="INACTIVE">❌ Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Seat Grid with Filtering */}
                                    {(() => {
                                        // Apply filters
                                        const filteredSeats = seats.map(seat => {
                                            const matchingOccupants = seat.occupants.filter(student => {
                                                // Search filter
                                                const matchesSearch = !searchQuery ||
                                                    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    student.mobile.includes(searchQuery) ||
                                                    seat.id.toString().includes(searchQuery);

                                                // Payment filter
                                                const matchesPayment = filterPaymentStatus === 'ALL' ||
                                                    student.paymentMode === filterPaymentStatus;

                                                // Plan type filter
                                                const matchesPlan = filterPlanType === 'ALL' ||
                                                    student.planType === filterPlanType;

                                                // Active status filter
                                                const matchesActiveStatus = filterActiveStatus === 'ALL' ||
                                                    (filterActiveStatus === 'ACTIVE' && student.isActive) ||
                                                    (filterActiveStatus === 'INACTIVE' && !student.isActive);

                                                return matchesSearch && matchesPayment && matchesPlan && matchesActiveStatus;
                                            });

                                            return {
                                                ...seat,
                                                occupants: matchingOccupants,
                                                isFiltered: matchingOccupants.length > 0 && (searchQuery || filterPaymentStatus !== 'ALL' || filterPlanType !== 'ALL' || filterActiveStatus !== 'ALL')
                                            };
                                        });

                                        const hasActiveFilters = searchQuery || filterPaymentStatus !== 'ALL' || filterPlanType !== 'ALL' || filterActiveStatus !== 'ALL';
                                        const matchCount = filteredSeats.filter(s => s.occupants.length > 0).length;

                                        return (
                                            <>
                                                {hasActiveFilters && (
                                                    <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm font-bold text-teal-700">
                                                        Found {matchCount} seat(s) with matching students
                                                    </div>
                                                )}
                                                <SeatGrid
                                                    seats={hasActiveFilters ? filteredSeats : seats}
                                                    onSeatClick={(seat) => {
                                                        // RESTRICTION: Students can only click their own seat
                                                        if (currentUser?.role === UserRole.STUDENT) {
                                                            if (studentData && studentData.seatNumber !== seat.id) {
                                                                // Do nothing if clicking a seat that isn't theirs
                                                                return;
                                                            }
                                                        }
                                                        setSelectedSeat(seat);
                                                    }}
                                                    userRole={currentUser.role}
                                                    currentUser={studentData}
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            </>
                        )}

                        {/* --- ADMISSIONS TAB --- */}
                        {activeTab === 'ADMISSIONS' && isAdmin && (
                            <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-4 md:p-8 min-h-[600px]">
                                <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><FileText size={20} /></div>
                                    Pending Admissions ({admissionRequests.length})
                                </h3>

                                <div className="space-y-4">
                                    {admissionRequests.length > 0 ? admissionRequests.map(req => (
                                        <div key={req.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-all gap-4">
                                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                                {req.photoUrl ? (
                                                    <img src={req.photoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400"><UserCircle /></div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-lg">{req.fullName}</h4>
                                                    <p className="text-xs text-gray-500 font-medium">{req.mobile} • {req.email}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-xs">{req.address}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">{req.planType}</span>
                                                        {req.lockerRequired && <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded">Locker</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 w-full md:w-auto">
                                                <button
                                                    onClick={() => handleRejectAdmission(req.id)}
                                                    className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white border border-gray-200 text-red-500 font-bold hover:bg-red-50 hover:border-red-100 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleStartReviewAdmission(req.id)}
                                                    className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors"
                                                >
                                                    Review & Assign
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center p-12 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                            No pending applications.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- STUDENTS TABLE --- */}
                        {activeTab === 'STUDENTS' && isAdmin && (
                            <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-4 md:p-8 min-h-[600px]">
                                <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600"><Users size={20} /></div>
                                    Student Directory
                                </h3>
                                <StudentsTable
                                    students={allStudents}
                                    seats={seats}
                                    onEdit={(student) => {
                                        const seat = seats.find(s => s.id === student.seatNumber);
                                        if (seat) {
                                            setSelectedSeat({ ...seat, occupants: [student] });
                                        }
                                    }}
                                    onViewDocs={(student) => setViewingDocStudent(student)}
                                />
                            </div>
                        )}

                        {/* --- REVENUE CHART --- */}
                        {activeTab === 'REVENUE' && isAdmin && (
                            <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-4 md:p-8">
                                <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600"><TrendingUp size={20} /></div>
                                    Financial Overview
                                </h3>
                                <RevenueChart transactions={transactions} />
                            </div>
                        )}

                        {/* --- PREMIUM PROFILE (STUDENT) --- */}
                        {activeTab === 'PROFILE' && !isAdmin && studentData && (
                            <div className="bg-white rounded-[3rem] shadow-[0_25px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">

                                {/* Header Gradient */}
                                <div className="h-48 bg-gradient-to-r from-teal-400 to-cyan-600 relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 pattern-dots opacity-20"></div>
                                    <h1 className="text-white/20 font-black text-6xl md:text-8xl tracking-tighter select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
                                        ASPIRANT LIBRARY
                                    </h1>
                                </div>

                                <div className="px-6 md:px-10 pb-10">
                                    {/* Profile Header & Photo */}
                                    <div className="flex flex-col md:flex-row items-end md:items-end gap-6 -mt-20 mb-8">
                                        <div className="relative group">
                                            <div className="w-40 h-40 rounded-3xl bg-white p-1.5 shadow-2xl">
                                                <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-100 relative">
                                                    {studentData.photoUrl ? (
                                                        <img src={studentData.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <User size={64} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <h1 className="text-3xl md:text-4xl font-black text-gray-900">{studentData.fullName}</h1>
                                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 text-gray-500 font-medium text-sm md:text-base">
                                                <span className="flex items-center gap-1"><Phone size={16} /> {studentData.mobile}</span>
                                                <span className="flex items-center gap-1"><Mail size={16} /> {studentData.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        <div className="space-y-6">
                                            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><MapPin size={16} /> Address Details</h3>
                                                <p className="text-gray-800 font-medium leading-relaxed">
                                                    {studentData.address || "No address provided."}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Users size={16} /> Guardian Information</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Parent Name</p>
                                                        <p className="font-bold text-gray-800">{studentData.parentName || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Contact</p>
                                                        <p className="font-bold text-gray-800 font-mono">{studentData.parentMobile || "-"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-teal-50 rounded-[2rem] p-8 border border-teal-100">
                                                <h3 className="text-sm font-bold text-teal-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Clock size={16} /> Active Plan</h3>
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <p className="text-3xl font-black text-teal-900">{studentData.planType}</p>
                                                        <p className="text-teal-700 font-medium">{studentData.duration}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-4xl font-black text-teal-600">{studentData.seatNumber}</div>
                                                        <div className="text-xs font-bold text-teal-800 uppercase">Seat No</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-teal-200 h-2 rounded-full overflow-hidden mb-2">
                                                    <div className="bg-teal-500 h-full w-[40%]"></div>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-teal-800">
                                                    <span>Started: {new Date(studentData.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="text-red-600">Expires: {new Date(studentData.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-[2rem] p-8 border-2 border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Identity Proof</p>
                                                    <p className="text-lg font-black text-gray-800">{studentData.idProofType || "N/A"}</p>
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-500`}>
                                                    <Shield size={24} />
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-[2rem] p-8 border-2 border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Personal Locker</p>
                                                    <p className="text-xl font-black text-gray-800">{studentData.lockerRequired ? `Assigned (#${studentData.seatNumber})` : "Not Subscribed"}</p>
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${studentData.lockerRequired ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <Lock size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* --- SETTINGS --- */}
                        {activeTab === 'SETTINGS' && isAdmin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3"><Wifi className="text-blue-500" /> WiFi Configuration</h3>

                                    {/* Add Form */}
                                    <div className="mb-8">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Add New Network</h4>
                                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                                            <form onSubmit={handleAddWifi} className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Network SSID"
                                                    className="w-full p-4 rounded-2xl border-0 bg-white shadow-sm ring-1 ring-blue-100 focus:ring-2 focus:ring-blue-400 outline-none font-medium"
                                                    value={newWifiSSID}
                                                    onChange={e => setNewWifiSSID(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Password"
                                                    className="w-full p-4 rounded-2xl border-0 bg-white shadow-sm ring-1 ring-blue-100 focus:ring-2 focus:ring-blue-400 outline-none font-medium"
                                                    value={newWifiPass}
                                                    onChange={e => setNewWifiPass(e.target.value)}
                                                />
                                                <button className="w-full bg-blue-500 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 font-bold active:scale-95 flex items-center justify-center gap-2">
                                                    <Plus size={20} /> Add Network
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Saved Networks ({wifiList.length})</h4>
                                        {wifiList.map(w => (
                                            <div key={w.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                                <div>
                                                    <p className="font-bold text-gray-800">{w.ssid}</p>
                                                    <p className="text-xs text-gray-400 font-mono mt-1">{w.password}</p>
                                                </div>
                                                <button onClick={() => handleDeleteWifi(w.id)} className="text-red-400 hover:text-red-600 bg-white p-3 rounded-xl shadow-sm hover:shadow border border-gray-100 transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-gray-100">
                                        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3"><Bell className="text-red-500" /> Emergency Alert</h3>
                                        <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100">
                                            <p className="text-sm text-red-800 mb-4 font-bold uppercase tracking-wide">Broadcast Message</p>
                                            <div className="flex gap-4 mb-4">
                                                <button
                                                    onClick={() => setAnnouncementType('ALERT')}
                                                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${announcementType === 'ALERT' ? 'border-red-500 bg-red-50 text-red-600' : 'border-transparent bg-white text-gray-400'}`}
                                                >
                                                    <AlertTriangle size={16} className="inline mr-2" />
                                                    Alert
                                                </button>
                                                <button
                                                    onClick={() => setAnnouncementType('NOTIFICATION')}
                                                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${announcementType === 'NOTIFICATION' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent bg-white text-gray-400'}`}
                                                >
                                                    <Bell size={16} className="inline mr-2" />
                                                    Notification
                                                </button>
                                            </div>

                                            <textarea
                                                className={`w-full p-5 rounded-2xl border-0 bg-white shadow-sm ring-1 focus:ring-2 outline-none h-32 mb-6 text-gray-800 font-medium resize-none transition-all ${announcementType === 'ALERT' ? 'ring-red-100 focus:ring-red-400 placeholder-red-200' : 'ring-blue-100 focus:ring-blue-400 placeholder-blue-200'}`}
                                                placeholder={announcementType === 'ALERT' ? "Type critical emergency alert..." : "Type general notification..."}
                                                value={announcementMsg}
                                                onChange={e => setAnnouncementMsg(e.target.value)}
                                            ></textarea>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={handleUpdateAnnouncement}
                                                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 active:scale-95 transition-all"
                                                >
                                                    Broadcast
                                                </button>
                                                <button
                                                    onClick={handleClearAnnouncement}
                                                    className="px-8 bg-white text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-50 shadow-sm border border-gray-200 active:scale-95 transition-all"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL */}
            {selectedSeat && (
                <StudentModal
                    seat={selectedSeat}
                    existingStudent={selectedSeat.occupants.length > 0 && (isAdmin || (studentData?.seatNumber === selectedSeat.id)) ? selectedSeat.occupants[0] : undefined}
                    initialData={pendingAdmissionRequest ? {
                        fullName: pendingAdmissionRequest.fullName,
                        mobile: pendingAdmissionRequest.mobile,
                        email: pendingAdmissionRequest.email,
                        address: pendingAdmissionRequest.address,
                        planType: pendingAdmissionRequest.planType,
                        duration: pendingAdmissionRequest.duration,
                        lockerRequired: pendingAdmissionRequest.lockerRequired,
                        assignedSlots: pendingAdmissionRequest.preferredSlots,
                        photoUrl: pendingAdmissionRequest.photoUrl,
                        idProofUrl: pendingAdmissionRequest.idProofUrl,
                        idProofType: pendingAdmissionRequest.idProofType // Ensure this flows through
                    } : undefined}
                    onClose={() => {
                        setSelectedSeat(null);
                    }}
                    onSave={() => {
                        if (pendingAdmissionId) {
                            MockService.deleteAdmissionRequest(pendingAdmissionId);
                            setPendingAdmissionId(null);
                        }
                        setSelectedSeat(null);
                        forceUpdate();
                    }}
                    onDelete={(id) => {
                        MockService.deleteStudent(id);
                        setSelectedSeat(null);
                        forceUpdate();
                    }}
                    readOnly={!isAdmin}
                />
            )}

            {/* DOCUMENT VIEWER MODAL */}
            {viewingDocStudent && (
                <DocumentViewerModal
                    student={viewingDocStudent}
                    onClose={() => setViewingDocStudent(null)}
                />
            )}
        </div>
    );
};

export default App;