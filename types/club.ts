export type ClubRole = 'admin' | 'player' | 'coach' | 'member';

export interface Club {
  id: string;
  name: string;
  description: string;
  logo?: string;
  admin_id: string;
  members: string[];
  training_schedule: TrainingSession[];
  court_ids: string[];
  fees: {
    monthly: number;
    session: number;
  };
  created_at: Date;
}

export interface TrainingSession {
  id: string;
  title: string;
  court_id: string;
  start_time: Date;
  end_time: Date;
  max_participants: number;
  current_participants: number;
  price: number;
  recurring_days: string[];
}

export interface UserClubAssociation {
  club_id: string;
  roles: ClubRole[];
  joined_at: string;
}
