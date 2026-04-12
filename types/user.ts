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
  first_name: string;
  last_name: string;
  bio?: string;
  over_18: boolean;
  created_at: string;
  last_active?: string;
  onboarding_status: OnboardingStatus;
  photo_url?: string;
  university_id?: string;
  course?: string;
}

export interface CreateUserForm {
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  onboarding_status: OnboardingStatus;
}

export interface OnboardingUserForm {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  over_18: boolean;
  photo_url?: string;
  university_id?: string;
  course?: string;
  societies?: string[];
}


export interface Badge {
  id: string;
  name: string;
  icon_url: string;
  awarded_at: string;
  description?: string;
}

export interface UserStats {
  games_played: number;
  wins: number;
  losses: number;
  avg_points_per_game?: number;
  assists?: number;
  rebounds?: number;
  // add more as needed
}
