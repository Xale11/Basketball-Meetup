export type ClubRole = 'admin' | 'player' | 'coach' | 'member';

export interface Club {
  id: string;
  name: string;
  description: string;
  logo?: string;
  adminId: string;
  members: string[];
  trainingSchedule: TrainingSession[];
  courtIds: string[];
  fees: {
    monthly: number;
    session: number;
  };
  createdAt: Date;
}

export interface TrainingSession {
  id: string;
  title: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  recurringDays: string[];
}

export interface UserClubAssociation {
  clubId: string;
  role: ClubRole;
  joinedAt: string;
}