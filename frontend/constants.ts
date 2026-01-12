import { TimeSlot, PlanType, PlanDuration } from './types';

export const TOTAL_SEATS = 121;
export const LOCKER_PRICE_PER_MONTH = 100;

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'S1', label: 'Morning', time: '7 AM – 1 PM' },
  { id: 'S2', label: 'Afternoon', time: '1 PM – 7 PM' },
  { id: 'S3', label: 'Evening', time: '7 PM – 1 AM' },
  { id: 'S4', label: 'Night', time: '1 AM – 7 AM' },
];

export const PRICING = {
  [PlanType.SIX_HOURS]: {
    [PlanDuration.ONE_MONTH]: 799,
    [PlanDuration.THREE_MONTHS]: 2099,
    [PlanDuration.SIX_MONTHS]: 4199,
  },
  [PlanType.EIGHT_HOURS]: {
    [PlanDuration.ONE_MONTH]: 1000,
    [PlanDuration.THREE_MONTHS]: 2700,
    [PlanDuration.SIX_MONTHS]: 5500,
  },
  [PlanType.FOURTEEN_HOURS]: {
    [PlanDuration.ONE_MONTH]: 1400,
    [PlanDuration.THREE_MONTHS]: 4000,
    [PlanDuration.SIX_MONTHS]: 8000,
  },
  [PlanType.TWENTY_FOUR_HOURS]: {
    [PlanDuration.ONE_MONTH]: 1700,
    [PlanDuration.THREE_MONTHS]: 4800,
    [PlanDuration.SIX_MONTHS]: 9500,
  },
};

// Helper to determine how many slots a plan needs
export const getSlotCountForPlan = (plan: PlanType): number => {
  switch (plan) {
    case PlanType.SIX_HOURS: return 1;
    case PlanType.EIGHT_HOURS: return 2; // Needs 2 slots (12h) to cover 8h
    case PlanType.FOURTEEN_HOURS: return 3; // Needs 3 slots (18h) to cover 14h
    case PlanType.TWENTY_FOUR_HOURS: return 4;
    default: return 1;
  }
};
