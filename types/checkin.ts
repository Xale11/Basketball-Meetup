export interface CheckIn {
  checkInId: string;
  userId: string;
  checkInType: CheckInType;
  checkInTime: string; 
  checkOutTime?: string;
  isActive: boolean;
  wasAutoClosed?: boolean;
  lastValidatedAt?: string; 
}

export interface CourtCheckInType {
  courtId: string;
}

export interface EventCheckInType {
  eventId: string;
}

export type CheckInType = CourtCheckInType | EventCheckInType;