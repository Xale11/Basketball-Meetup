/**
 * Not a Supabase table — client-side / Basketball Meetup (BM_) only.
 * These types model a local check-in session for a court or event.
 * No `checkins` table exists in Supabase; this data is managed client-side or
 * via a future migration.
 */
export interface CheckIn {
  check_in_id: string;
  user_id: string;
  check_in_type: CheckInType;
  check_in_time: string;
  check_out_time?: string;
  is_active: boolean;
  was_auto_closed?: boolean;
  last_validated_at?: string;
}

/** Discriminator payload for a court-based check-in. */
export interface CourtCheckInType {
  court_id: string;
}

/** Discriminator payload for an event-based check-in. */
export interface EventCheckInType {
  event_id: string;
}

export type CheckInType = CourtCheckInType | EventCheckInType;
