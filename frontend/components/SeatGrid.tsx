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
const SLOT_MAP: { [key: string]: string } = {
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
      // Empty - Green (Available)
      style.className += " bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-[0_4px_0_0_rgb(134,239,172)] active:shadow-none active:translate-y-[4px] text-green-600 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:shadow-[0_6px_0_0_rgb(134,239,172)]";
    } else if (isFull) {
      // Full - Red (No availability)
      style.className += " bg-gradient-to-br from-red-100 to-rose-100 border-2 border-red-300 text-red-600 shadow-[0_2px_0_0_rgb(252,165,165)] font-bold";
      const allSlots = ['S1', 'S2', 'S3', 'S4'];
      style.label = (
        <div className="absolute -bottom-2 bg-white px-1 py-0.5 rounded-md border border-red-200 shadow-sm flex gap-0.5 z-10 opacity-75">
          {allSlots.map((sid) => (
            <div key={sid} className="w-2 h-2 rounded-[2px] bg-red-400" />
          ))}
        </div>
      );
    } else if (occupancy === 1) {
      // 1 Student - Light Yellow
      style.className += " bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 text-yellow-700 shadow-[0_4px_0_0_rgb(253,224,71)] active:shadow-none active:translate-y-[4px] hover:from-yellow-100 hover:to-amber-100";
      // Visual Slot Bar
      const allSlots = ['S1', 'S2', 'S3', 'S4']; // Fixed order: M, A, E, N
      style.label = (
        <div className="absolute -bottom-2 bg-white px-1 py-0.5 rounded-md border border-gray-200 shadow-sm flex gap-0.5 z-10">
          {allSlots.map((sid, idx) => {
            const isTaken = takenSlots.has(sid);
            return (
              <div
                key={sid}
                className={`w-2 h-2 rounded-[2px] ${isTaken
                  ? 'bg-teal-500'
                  : 'bg-gray-100 border border-gray-200'}`}
                title={isTaken ? 'Occupied' : 'Available'}
              />
            );
          })}
        </div>
      );
    } else if (occupancy === 2) {
      // 2 Students - Orange
      style.className += " bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-700 shadow-[0_4px_0_0_rgb(251,146,60)] active:shadow-none active:translate-y-[4px] hover:from-orange-200 hover:to-amber-200";
      // Visual Slot Bar (Duplicate logic for consistency, cleaner than text)
      const allSlots = ['S1', 'S2', 'S3', 'S4'];
      style.label = (
        <div className="absolute -bottom-2 bg-white px-1 py-0.5 rounded-md border border-orange-200 shadow-sm flex gap-0.5 z-10">
          {allSlots.map((sid) => {
            const isTaken = takenSlots.has(sid);
            return (
              <div
                key={sid}
                className={`w-2 h-2 rounded-[2px] ${isTaken
                  ? 'bg-orange-500'
                  : 'bg-gray-100 border border-gray-200'}`}
              />
            );
          })}
        </div>
      );
    } else if (occupancy === 3) {
      // 3 Students - Deep Orange/Light Red
      style.className += " bg-gradient-to-br from-orange-200 to-red-100 border-2 border-orange-400 text-orange-800 shadow-[0_3px_0_0_rgb(251,146,60)] active:shadow-none active:translate-y-[3px] hover:from-orange-300 hover:to-red-200";
      const allSlots = ['S1', 'S2', 'S3', 'S4'];
      style.label = (
        <div className="absolute -bottom-2 bg-white px-1 py-0.5 rounded-md border border-orange-300 shadow-sm flex gap-0.5 z-10">
          {allSlots.map((sid) => {
            const isTaken = takenSlots.has(sid);
            return (
              <div
                key={sid}
                className={`w-2 h-2 rounded-[2px] ${isTaken
                  ? 'bg-orange-600'
                  : 'bg-gray-100 border border-gray-200'}`}
              />
            );
          })}
        </div>
      );
    }

    // Student View Overrides
    if (userRole === UserRole.STUDENT) {
      if (currentUser && currentUser.seatNumber === seat.id) {
        // My Seat - Vibrant Teal Gradient 3D
        style.className = "relative h-12 md:h-14 w-full rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-[0_6px_0_0_rgb(13,148,136)] scale-110 z-10 flex flex-col items-center justify-center transform -translate-y-1 cursor-pointer border-2 border-teal-300";
        style.icon = <User size={12} className="absolute top-1 left-1 opacity-80" />;
        style.label = null; // Clean look for own seat
      } else {
        // OTHER SEATS: Remove interactivity visual cues
        style.className = style.className.replace('cursor-pointer', 'cursor-default');
        style.className = style.className.replace(/active:shadow-none/g, '');
        style.className = style.className.replace(/active:translate-y-\[4px\]/g, '');
        style.className = style.className.replace(/active:translate-y-\[3px\]/g, '');
        style.className = style.className.replace(/hover:from-[^\s]+/g, '');
        style.className = style.className.replace(/hover:to-[^\s]+/g, '');
        style.className = style.className.replace(/hover:border-[^\s]+/g, '');
        style.className = style.className.replace(/hover:shadow-\[[^\]]+\]/g, '');
      }
    }

    return style;
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-3 gap-y-5 md:gap-x-4 md:gap-y-6">
      {seats.map((seat) => {
        const { className, icon, label } = getSeatStyle(seat);
        const occupancy = seat.occupants.length;
        const takenSlots = new Set(seat.occupants.flatMap(s => s.assignedSlots));
        const isFull = occupancy >= 4 || takenSlots.size === 4;

        return (
          <div
            key={seat.id}
            className="group relative"
          >
            <div
              className={className}
              onClick={() => onSeatClick(seat)}
            >
              <span className="text-base md:text-lg font-black tracking-tight">{seat.id}</span>

              {/* Occupancy Counter for Admins */}
              {userRole === UserRole.ADMIN && occupancy > 0 && (
                <div className="absolute top-1 right-1 bg-white rounded-full px-1.5 py-0.5 text-[8px] font-bold text-gray-600 border border-gray-200 shadow-sm">
                  {isFull ? 'FULL' : `${occupancy}/4`}
                </div>
              )}

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

            {/* Hover Tooltip - Show Occupants for Admins */}
            {userRole === UserRole.ADMIN && seat.occupants.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl">
                  <div className="font-bold mb-1">Seat #{seat.id}</div>
                  {seat.occupants.map((occupant, idx) => (
                    <div key={idx} className="text-gray-300 truncate">
                      • {occupant.fullName.split(' ')[0]} ({occupant.assignedSlots.join(', ')})
                    </div>
                  ))}
                </div>
                <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};