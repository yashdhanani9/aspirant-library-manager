import React from 'react';
import { Seat, UserRole, Student } from '../types';
import { Lock, User, Clock } from 'lucide-react';

interface SeatGridProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  userRole: UserRole;
  currentUser?: Student | null;
}

// Map Slot IDs to Short Codes
const SLOT_MAP: {[key: string]: string} = {
    'S1': 'M', // Morning
    'S2': 'A', // Afternoon
    'S3': 'E', // Evening
    'S4': 'N'  // Night
};

const ALL_SLOTS = ['S1', 'S2', 'S3', 'S4'];

export const SeatGrid: React.FC<SeatGridProps> = ({ seats, onSeatClick, userRole, currentUser }) => {
  
  const getSeatStyle = (seat: Seat) => {
    // Occupancy Logic
    const occupancy = seat.occupants.length;
    const takenSlots = new Set(seat.occupants.flatMap(s => s.assignedSlots));
    const isFull = occupancy >= 4 || takenSlots.size === 4;
    
    // Calculate Available Slots
    const availableSlots = ALL_SLOTS.filter(s => !takenSlots.has(s)).map(s => SLOT_MAP[s]);

    // Base style for all seats - 3D Button Look
    let style = {
        className: "relative h-12 md:h-14 w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none",
        icon: null as React.ReactNode,
        label: null as React.ReactNode
    };

    if (occupancy === 0) {
        // Empty - Soft White 3D
        style.className += " bg-white border border-gray-100 shadow-[0_4px_0_0_rgb(229,231,235)] active:shadow-none active:translate-y-[4px] text-gray-400 hover:text-teal-600 hover:border-teal-200";
    } else if (isFull) {
        // Full - Red Flat/Pressed look or Soft Red
        style.className += " bg-red-50 border border-red-100 text-red-400 shadow-[0_2px_0_0_rgb(254,202,202)] opacity-80";
    } else {
        // Partial - Teal/Turquoise 3D
        style.className += " bg-teal-50 border border-teal-200 text-teal-700 shadow-[0_4px_0_0_rgb(153,246,228)] active:shadow-none active:translate-y-[4px] hover:-translate-y-0.5";
        // Show Available Slots as small text
        style.label = (
            <div className="absolute -bottom-2 bg-white px-1.5 py-0.5 rounded-full border border-teal-100 shadow-sm text-[8px] font-bold text-teal-600 tracking-widest uppercase flex gap-0.5 z-10">
                {availableSlots.join(' ')}
            </div>
        );
    }

    // Student View Overrides
    if (userRole === UserRole.STUDENT) {
        if (currentUser && currentUser.seatNumber === seat.id) {
             // My Seat - Vibrant Teal Gradient 3D
             style.className = "relative h-12 md:h-14 w-full rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-[0_6px_0_0_rgb(13,148,136)] scale-110 z-10 flex flex-col items-center justify-center transform -translate-y-1 cursor-pointer";
             style.icon = <User size={12} className="absolute top-1 left-1 opacity-80" />;
             style.label = null; // Clean look for own seat
        } else {
             // OTHER SEATS: Remove interactivity visual cues
             style.className = style.className.replace('cursor-pointer', 'cursor-default');
             style.className = style.className.replace(/active:shadow-none/g, '');
             style.className = style.className.replace(/active:translate-y-\[4px\]/g, '');
             style.className = style.className.replace(/hover:text-teal-600/g, '');
             style.className = style.className.replace(/hover:border-teal-200/g, '');
             style.className = style.className.replace(/hover:-translate-y-0.5/g, '');
        }
    }

    return style;
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-3 gap-y-5 md:gap-x-4 md:gap-y-6">
      {seats.map((seat) => {
        const { className, icon, label } = getSeatStyle(seat);
        
        return (
          <div 
            key={seat.id} 
            className={className}
            onClick={() => onSeatClick(seat)}
          >
            <span className="text-base md:text-lg font-black tracking-tight">{seat.id}</span>
            
            {/* Slot Indicators (Dots) for Admin */}
            {seat.occupants.length > 0 && userRole === UserRole.ADMIN && (
               <div className="flex gap-0.5 mt-1 absolute bottom-1.5 opacity-40">
                 {seat.occupants.map((_, i) => (
                   <div key={i} className="w-1 h-1 rounded-full bg-current" />
                 ))}
               </div>
            )}

            {icon}
            {label}
            
            {/* Locker Icon */}
            {(seat.isLockerTaken) && (
               <div className={`absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border ${userRole === UserRole.STUDENT && currentUser?.seatNumber === seat.id ? 'text-teal-600 border-teal-200' : 'text-gray-300 border-gray-100'}`}>
                 <Lock size={8} />
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
};