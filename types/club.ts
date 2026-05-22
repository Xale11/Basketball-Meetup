/**
 * Not a Supabase table — Basketball Meetup (BM_) app only.
 * Clubs are distinct from Societies (which ARE in Supabase).
 * No `clubs` or `training_sessions` tables exist in the database yet;
 * these types are used client-side for future feature development.
 */

export type ClubRole = 'admin' | 'player' | 'coach' | 'member';

/** Not a Supabase table — BM_ only. Represents a basketball club. */
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

/** Not a Supabase table — BM_ only. A scheduled training session run by a Club. */
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

/** Not a Supabase table — BM_ only. Associates a user with a club and their roles within it. */
export interface UserClubAssociation {
  club_id: string;
  roles: ClubRole[];
  joined_at: string;
}
