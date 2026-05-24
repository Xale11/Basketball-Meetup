export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * Supabase table: profiles
 * Stores public profile data for each authenticated user.
 * `id` is a FK to auth.users.id — one profile per auth account.
 * DB default for `onboarding_status` is 'not_started'; `over_18` is NOT NULL.
 * Referenced by: events.created_by_user_id, event_participants.user_id,
 * event_invites.invited_user_id / invited_by_user_id,
 * university_memberships.user_id, society_memberships.user_id,
 * friendships.requester_id / friendships.addressee_id.
 */
export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  over_18: boolean;
  onboarding_status: OnboardingStatus;
  photo_url: string | null;
  university_id: string | null;
  course: string | null;
}

/** Form type — not a Supabase table. Used when registering a new auth user. */
export interface CreateUserForm {
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  onboarding_status: OnboardingStatus;
}

/** Form type — not a Supabase table. Used to populate the profiles row during onboarding. */
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

/** Not a Supabase table — client-side only. Represents an achievement badge shown on a user profile. */
export interface Badge {
  id: string;
  name: string;
  icon_url: string;
  awarded_at: string;
  description?: string;
}

/** Not a Supabase table — client-side only. Aggregated basketball statistics for a user (BM_ app). */
export interface UserStats {
  games_played: number;
  wins: number;
  losses: number;
  avg_points_per_game?: number;
  assists?: number;
  rebounds?: number;
}
