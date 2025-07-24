import { UserClubAssociation } from "./club";
import { CourtVisit } from "./courts";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  over18: boolean;
  createdAt: string;
  lastActive?: string;
  clubs: UserClubAssociation[]; // multiple clubs + roles
  courtHistory: CourtVisit[];
  badges: Badge[];
  stats?: UserStats; 
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