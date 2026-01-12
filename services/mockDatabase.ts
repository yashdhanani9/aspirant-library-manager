import { Student, UserRole, PlanType, PlanDuration, Seat, Transaction, WifiNetwork, GlobalAnnouncement, AdmissionRequest } from '../types';
import { TOTAL_SEATS } from '../constants';

// Storage Keys
const KEY_DATA = 'ASPIRANT_LIB_DATA_V3';
const KEY_IMAGES = 'ASPIRANT_LIB_IMAGES_V3';
const KEY_TRANSACTIONS = 'ASPIRANT_LIB_TRANSACTIONS_V2';
const KEY_WIFI = 'ASPIRANT_LIB_WIFI_V1';
const KEY_ANNOUNCEMENT = 'ASPIRANT_LIB_ANNOUNCEMENT_V1';
const KEY_ADMISSIONS = 'ASPIRANT_LIB_ADMISSIONS_V1';

// Types for internal storage
interface ImageStorage {
  [studentId: string]: {
    photoUrl?: string;
    idProofUrl?: string;
  }
}

// Initial Seed
const SEED_STUDENTS: Student[] = [
  {
    id: '1',
    fullName: 'Rahul Sharma',
    mobile: '9876543210',
    email: 'rahul.sharma@example.com',
    password: 'password123',
    address: '123, Green Park Society, MG Road',
    parentName: 'Suresh Sharma',
    parentMobile: '9876543200',
    seatNumber: 25,
    lockerRequired: true,
    planType: PlanType.SIX_HOURS,
    duration: PlanDuration.ONE_MONTH,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2025-11-01',
    amountPaid: 899,
    assignedSlots: ['S1'],
    isActive: true,
    idProofType: 'Aadhaar Card'
  }
];

// --- Internal Helpers ---

const loadJSON = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return defaultVal;
  }
};

const saveJSON = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
       alert("CRITICAL: Storage Full! Images were not saved. Please use the 'Cleanup' option in Settings or delete old students.");
    }
  }
};

// In-memory state
let students: Student[] = loadJSON(KEY_DATA, SEED_STUDENTS);
let images: ImageStorage = loadJSON(KEY_IMAGES, {});
let transactions: Transaction[] = loadJSON(KEY_TRANSACTIONS, []);
let wifiNetworks: WifiNetwork[] = loadJSON(KEY_WIFI, []);
let announcement: GlobalAnnouncement = loadJSON(KEY_ANNOUNCEMENT, { message: '', isActive: false, updatedAt: '' });
let admissionRequests: AdmissionRequest[] = loadJSON(KEY_ADMISSIONS, []);

// Seed transactions if empty but students exist
if (transactions.length === 0 && students.length > 0) {
    students.forEach(s => {
        transactions.push({
            id: `tx_${s.id}_init`,
            studentId: s.id,
            studentName: s.fullName,
            seatNumber: s.seatNumber,
            type: 'ADMISSION',
            amount: s.amountPaid,
            date: s.startDate,
            planType: s.planType,
            duration: s.duration
        });
    });
    saveJSON(KEY_TRANSACTIONS, transactions);
}

export const MockService = {
  // --- AUTH ---
  login: (mobile: string, password: string) => {
    if (mobile === 'admin' && password === 'admin') {
      return { role: UserRole.ADMIN, user: null };
    }
    const student = students.find(s => s.mobile === mobile && s.password === password);
    if (student) {
      const imgs = images[student.id];
      return { 
        role: UserRole.STUDENT, 
        user: { ...student, photoUrl: imgs?.photoUrl, idProofUrl: imgs?.idProofUrl } 
      };
    }
    return null;
  },

  getStudent: (id: string): Student | null => {
    const s = students.find(student => student.id === id);
    if (s) {
       return {
        ...s,
        photoUrl: images[s.id]?.photoUrl || '',
        idProofUrl: images[s.id]?.idProofUrl || ''
       };
    }
    return null;
  },

  // --- STUDENT MANAGEMENT ---
  getAllStudents: (): Student[] => {
    return students.map(s => ({
        ...s,
        photoUrl: images[s.id]?.photoUrl || '',
        idProofUrl: images[s.id]?.idProofUrl || ''
    }));
  },

  // Get students expiring in the next 5 days
  getExpiringStudents: (): Student[] => {
      const today = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(today.getDate() + 5);

      return students.filter(s => {
          const endDate = new Date(s.endDate);
          return s.isActive && endDate >= today && endDate <= fiveDaysLater;
      }).map(s => ({
          ...s,
          photoUrl: images[s.id]?.photoUrl
      }));
  },

  addStudent: (student: Student) => {
    // 1. Validation
    const seatConflict = !MockService.checkSlotAvailability(student.seatNumber, student.assignedSlots);
    if (seatConflict) throw new Error("Seat slot conflict detected during save.");

    if (student.lockerRequired) {
        const lockerConflict = !MockService.checkLockerAvailability(student.seatNumber);
        if (lockerConflict) throw new Error("Locker conflict detected during save.");
    }

    // 2. Save Images Separately
    const { photoUrl, idProofUrl, ...studentData } = student;
    
    students.push(studentData as Student);
    
    if ((photoUrl && photoUrl.length > 50) || (idProofUrl && idProofUrl.length > 50)) {
        images[student.id] = { photoUrl, idProofUrl };
        saveJSON(KEY_IMAGES, images);
    }

    // 3. Log Transaction
    const tx: Transaction = {
        id: `tx_${Date.now()}`,
        studentId: student.id,
        studentName: student.fullName,
        seatNumber: student.seatNumber,
        type: 'ADMISSION',
        amount: student.amountPaid,
        date: student.startDate,
        planType: student.planType,
        duration: student.duration
    };
    transactions.push(tx);

    saveJSON(KEY_DATA, students);
    saveJSON(KEY_TRANSACTIONS, transactions);

    return student;
  },

  updateStudent: (updatedStudent: Student) => {
    const oldStudent = students.find(s => s.id === updatedStudent.id);
    if (!oldStudent) throw new Error("Student not found");

    const { photoUrl, idProofUrl, ...studentData } = updatedStudent;
    
    const existingImgs = images[updatedStudent.id] || {};
    
    const newImages = {
        photoUrl: photoUrl && photoUrl.length > 50 ? photoUrl : existingImgs.photoUrl,
        idProofUrl: idProofUrl && idProofUrl.length > 50 ? idProofUrl : existingImgs.idProofUrl
    };

    if (newImages.photoUrl || newImages.idProofUrl) {
        images[updatedStudent.id] = newImages;
        saveJSON(KEY_IMAGES, images);
    }

    students = students.map(s => s.id === updatedStudent.id ? (studentData as Student) : s);
    saveJSON(KEY_DATA, students);

    const isRenewal = updatedStudent.startDate !== oldStudent.startDate;
    
    if (isRenewal) {
        const tx: Transaction = {
            id: `tx_${Date.now()}`,
            studentId: updatedStudent.id,
            studentName: updatedStudent.fullName,
            seatNumber: updatedStudent.seatNumber,
            type: 'RENEWAL',
            amount: updatedStudent.amountPaid,
            date: updatedStudent.startDate,
            planType: updatedStudent.planType,
            duration: updatedStudent.duration
        };
        transactions.push(tx);
        saveJSON(KEY_TRANSACTIONS, transactions);
    }
  },

  deleteStudent: (id: string) => {
    students = students.filter(s => s.id !== id);
    delete images[id];
    saveJSON(KEY_DATA, students);
    saveJSON(KEY_IMAGES, images);
  },

  // --- ADMISSIONS ---
  getAdmissionRequests: (): AdmissionRequest[] => {
      return admissionRequests.map(req => ({
          ...req,
          photoUrl: images[req.id]?.photoUrl,
          idProofUrl: images[req.id]?.idProofUrl
      }));
  },

  addAdmissionRequest: (req: AdmissionRequest) => {
      const { photoUrl, idProofUrl, ...reqData } = req;
      admissionRequests.push(reqData as AdmissionRequest);
      
      if (photoUrl || idProofUrl) {
          images[req.id] = { photoUrl, idProofUrl };
          saveJSON(KEY_IMAGES, images);
      }
      
      saveJSON(KEY_ADMISSIONS, admissionRequests);
  },

  deleteAdmissionRequest: (id: string) => {
      admissionRequests = admissionRequests.filter(r => r.id !== id);
      saveJSON(KEY_ADMISSIONS, admissionRequests);
  },

  // --- SEAT LOGIC ---
  getSeatsStatus: (): Seat[] => {
    const seats: Seat[] = [];
    for (let i = 1; i <= TOTAL_SEATS; i++) {
      const occupants = students.filter(s => s.seatNumber === i && s.isActive).map(s => ({
          ...s,
          photoUrl: images[s.id]?.photoUrl,
          idProofUrl: images[s.id]?.idProofUrl
      }));
      
      const isLockerTaken = occupants.some(s => s.lockerRequired);
      seats.push({ id: i, occupants, isLockerTaken });
    }
    return seats;
  },

  checkSlotAvailability: (seatNum: number, requestedSlots: string[], excludeStudentId?: string): boolean => {
    const occupants = students.filter(s => s.seatNumber === seatNum && s.isActive && s.id !== excludeStudentId);
    for (const occupant of occupants) {
      const hasOverlap = occupant.assignedSlots.some(slot => requestedSlots.includes(slot));
      if (hasOverlap) return false;
    }
    return true;
  },

  checkLockerAvailability: (seatNum: number, excludeStudentId?: string): boolean => {
    const lockerOwner = students.find(s => 
      s.seatNumber === seatNum && 
      s.isActive && 
      s.lockerRequired && 
      s.id !== excludeStudentId
    );
    return !lockerOwner;
  },

  // --- REPORTS ---
  getTransactions: (): Transaction[] => {
      return [...transactions];
  },

  // --- WIFI ---
  getWifiNetworks: (): WifiNetwork[] => {
    return [...wifiNetworks];
  },

  addWifiNetwork: (ssid: string, password: string) => {
    const newWifi: WifiNetwork = { id: Date.now().toString(), ssid, password };
    wifiNetworks.push(newWifi);
    saveJSON(KEY_WIFI, wifiNetworks);
  },

  deleteWifiNetwork: (id: string) => {
    wifiNetworks = wifiNetworks.filter(w => w.id !== id);
    saveJSON(KEY_WIFI, wifiNetworks);
  },

  // --- ANNOUNCEMENTS ---
  getAnnouncement: (): GlobalAnnouncement => {
    return { ...announcement };
  },

  setAnnouncement: (message: string, isActive: boolean) => {
    announcement = { message, isActive, updatedAt: new Date().toISOString() };
    saveJSON(KEY_ANNOUNCEMENT, announcement);
  },

  // --- DATABASE ADMIN ---
  exportDatabase: () => {
    return JSON.stringify({
        students,
        images,
        transactions,
        wifiNetworks,
        announcement,
        admissionRequests
    }, null, 2);
  },

  importDatabase: (jsonString: string): boolean => {
      try {
          const data = JSON.parse(jsonString);
          if (!data.students) throw new Error("Invalid Data Structure");

          students = data.students || [];
          images = data.images || {};
          transactions = data.transactions || [];
          wifiNetworks = data.wifiNetworks || [];
          announcement = data.announcement || {};
          admissionRequests = data.admissionRequests || [];

          saveJSON(KEY_DATA, students);
          saveJSON(KEY_IMAGES, images);
          saveJSON(KEY_TRANSACTIONS, transactions);
          saveJSON(KEY_WIFI, wifiNetworks);
          saveJSON(KEY_ANNOUNCEMENT, announcement);
          saveJSON(KEY_ADMISSIONS, admissionRequests);
          return true;
      } catch (e) {
          console.error("Import Failed:", e);
          return false;
      }
  },

  cleanupOldData: (): number => {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() - 30);

    const initialCount = students.length;
    const studentsToKeep = students.filter(s => {
        const endDate = new Date(s.endDate);
        return s.isActive || endDate > thresholdDate;
    });

    const keptIds = new Set(studentsToKeep.map(s => s.id));
    const admissionIds = new Set(admissionRequests.map(a => a.id));

    const newImages: ImageStorage = {};
    Object.keys(images).forEach(key => {
        if (keptIds.has(key) || admissionIds.has(key)) {
            newImages[key] = images[key];
        }
    });

    students = studentsToKeep;
    images = newImages;

    saveJSON(KEY_DATA, students);
    saveJSON(KEY_IMAGES, images);

    return initialCount - students.length;
  },

  generateDummyData: () => {
    const dummyNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Saanvi", "Riya", "Anvi", "Pihu", "Trisha"];
    
    students = [];
    images = {};
    transactions = [];
    admissionRequests = [];

    for(let i=0; i<30; i++) {
        const fName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
        const seat = Math.floor(Math.random() * 80) + 1;
        if(students.find(s => s.seatNumber === seat)) continue;

        const s: Student = {
            id: `seed_${i}`,
            fullName: `${fName} Test`,
            mobile: `98765${Math.floor(10000 + Math.random() * 90000)}`,
            email: `student${i}@example.com`,
            password: 'pass',
            address: 'Library Road',
            parentName: `Parent`,
            parentMobile: `9123456789`,
            seatNumber: seat,
            lockerRequired: false,
            planType: PlanType.SIX_HOURS,
            duration: PlanDuration.ONE_MONTH,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '2025-12-31',
            amountPaid: 1000,
            assignedSlots: ['S1'],
            isActive: true,
            idProofType: 'Aadhaar Card'
        };
        students.push(s);
        transactions.push({
             id: `tx_seed_${i}`,
             studentId: s.id,
             studentName: s.fullName,
             seatNumber: s.seatNumber,
             type: 'ADMISSION',
             amount: 1000,
             date: s.startDate,
             planType: s.planType,
             duration: s.duration
        });
    }

    saveJSON(KEY_DATA, students);
    saveJSON(KEY_IMAGES, images);
    saveJSON(KEY_TRANSACTIONS, transactions);
  }
};