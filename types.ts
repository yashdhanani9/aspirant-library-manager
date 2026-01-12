import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export enum PlanDuration {
  ONE_MONTH = '1 Month',
  THREE_MONTHS = '3 Months',
  SIX_MONTHS = '6 Months'
}

export enum PlanType {
  SIX_HOURS = '6 Hours',
  EIGHT_HOURS = '8 Hours',
  FOURTEEN_HOURS = '14 Hours',
  TWENTY_FOUR_HOURS = '24 Hours'
}

export interface TimeSlot {
  id: string;
  label: string;
  time: string;
}

export interface Student {
  id: string;
  fullName: string;
  mobile: string; // Used as Login ID
  email: string; // Added for notifications
  password: string; // Managed by Admin
  photoUrl?: string; // Base64 string
  idProofUrl?: string; // Base64 string
  idProofType?: string; // New: Aadhaar, PAN, etc.
  address: string;
  parentName: string;
  parentMobile: string;
  seatNumber: number;
  lockerRequired: boolean; // If true, lockerNumber === seatNumber
  planType: PlanType;
  duration: PlanDuration;
  startDate: string;
  endDate: string;
  amountPaid: number;
  assignedSlots: string[]; // IDs of TimeSlots
  isActive: boolean;
}

export interface AdmissionRequest {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  planType: PlanType;
  duration: PlanDuration;
  lockerRequired: boolean;
  preferredSlots: string[];
  photoUrl?: string;
  idProofUrl?: string;
  idProofType?: string; // New
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  seatNumber: number;
  type: 'ADMISSION' | 'RENEWAL' | 'ADJUSTMENT';
  amount: number;
  date: string; // ISO Date string
  planType: PlanType;
  duration: PlanDuration;
}

export interface Seat {
  id: number;
  isLockerTaken: boolean;
  occupants: Student[]; // Multiple students can share a seat if slots don't overlap
}

export interface WifiNetwork {
  id: string;
  ssid: string;
  password: string;
}

export interface GlobalAnnouncement {
  message: string;
  isActive: boolean;
  updatedAt: string;
}