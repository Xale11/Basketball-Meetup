import { UserClubAssociation } from "./club";
import { CourtVisit } from "./courts";

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  over18: boolean;
  createdAt: string;
  lastActive?: string;
  onboardingStatus: OnboardingStatus;
  photoUrl?: string;
  universityId?: string;
  course?: string;
}

export interface CreateUserForm {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  onboardingStatus: OnboardingStatus;
}

export interface OnboardingUserForm {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  over18: boolean;
  photoUrl?: string;
  universityId?: string;
  course?: string;
  societies?: string[];
}


export interface Badge {
  id: string;
  name: string;
  iconUrl: string;
  awardedAt: string;
  description?: string;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  avgPointsPerGame?: number;
  assists?: number;
  rebounds?: number;
  // add more as needed
}