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
  name: string;
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
  name: string;
  createdAt: string;
  onboardingStatus: OnboardingStatus;
}

export interface OnboardingUserForm {
  email: string;
  name: string;
  bio?: string;
  over18: boolean;
  onboardingStatus: OnboardingStatus;
  photoUrl?: string;
  universityId?: string;
  course?: string;
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