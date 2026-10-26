/**
 * ActivCampus court bookings: book a university court and split the cost.
 * See build_context/cost-splitting-demo-implementation-plan.md and
 * supabase/migrations/20261025223257_ac_court_bookings.sql.
 *
 * Clients can read these tables but never write them. Every change goes
 * through the `ac-court-sessions` edge function, which takes payments with
 * Stripe and calls the `ac_*` database functions.
 */

/** Supabase: `ac_court_sessions.status`. */
export enum CourtSessionStatus {
  /** Court reserved; collecting card holds until the minimum is reached. */
  PENDING_COMMITMENTS = 'PENDING_COMMITMENTS',
  /** Minimum reached; holds are being captured. Lasts seconds. */
  CONFIRMING_BOOKING = 'CONFIRMING_BOOKING',
  /** Court booked. Late joiners pay immediately and lower everyone's share. */
  CONFIRMED = 'CONFIRMED',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  /** Player list frozen; refunds of the difference are going out. */
  SETTLING = 'SETTLING',
  COMPLETED = 'COMPLETED',
  /** The minimum wasn't reached in time; holds released, nobody charged. */
  CANCELLED = 'CANCELLED',
}

/** Supabase: `ac_session_participants.registration_status`. */
export enum CourtRegistrationStatus {
  ACTIVE = 'ACTIVE',
  /** Cancelled after confirmation: place released, still pays unless replaced. */
  CANCELLED_LIABLE = 'CANCELLED_LIABLE',
  /** Someone paid for their place; refunded in full. */
  REPLACED = 'REPLACED',
  /** Cancelled before paying or before the minimum; hold released. */
  WITHDRAWN = 'WITHDRAWN',
}

/** Supabase: `ac_session_participants.payment_status`. */
export enum CourtPaymentStatus {
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  /** Card held, not charged. */
  AUTHORISED = 'AUTHORISED',
  PAID = 'PAID',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  VOIDED = 'VOIDED',
  SETTLEMENT_EXCEPTION = 'SETTLEMENT_EXCEPTION',
}

/**
 * Supabase table: ac_venues
 * A bookable university facility with a fixed price per session.
 * FK: university_id → universities.id.
 */
export interface Venue {
  id: string
  university_id: string
  name: string
  address: string | null
  court_cost_pence: number
  is_active: boolean
  created_at: string
}

/**
 * Supabase table: ac_court_sessions
 * The booking details of an event that is a court booking. Start/end times
 * live on the `events` row with the same id.
 * PK/FK: event_id → events.id. FK: venue_id → ac_venues.id, organiser_id → profiles.id.
 */
export interface CourtSession {
  event_id: string
  venue_id: string
  organiser_id: string
  court_cost_pence: number
  min_players: number
  max_players: number
  /** ceil(court cost / min players): the most anyone pays. */
  commitment_pence: number
  hold_expires_at: string
  /** Event start + 15 minutes. */
  registration_closes_at: string
  status: CourtSessionStatus
  confirmed_at: string | null
  closed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  exception_note: string | null
  created_at: string
  updated_at: string
}

/**
 * Supabase table: ac_session_participants
 * One row per place a player has held in a session (a player who withdraws
 * and rejoins can have several; at most one is ACTIVE or CANCELLED_LIABLE).
 * FK: event_id → ac_court_sessions.event_id, user_id → profiles.id.
 */
export interface SessionParticipant {
  id: string
  event_id: string
  user_id: string
  registration_status: CourtRegistrationStatus
  payment_status: CourtPaymentStatus
  commitment_pence: number
  capture_method: 'manual' | 'automatic'
  amount_captured_pence: number
  /** Set when registration closes. */
  final_share_pence: number | null
  refund_pence: number
  replaces_participant_id: string | null
  eligible: boolean
  frozen: boolean
  joined_at: string
  paid_at: string | null
  cancelled_at: string | null
}

/** A participant with the profile fields the session panel shows. */
export type SessionParticipantWithProfile = SessionParticipant & {
  profile: { id: string; first_name: string | null; last_name: string | null; photo_url: string | null } | null
}

/** Everything the event screen needs about a court session. */
export interface CourtSessionDetail {
  session: CourtSession
  venue: Venue
  participants: SessionParticipantWithProfile[]
  /** Holds or payments counting towards the minimum. */
  committedCount: number
  /** Places taken, including payments in progress. */
  placesTaken: number
}

/** One block on the booking calendar: a session with its event times and venue. */
export interface CalendarBooking {
  event_id: string
  event_name: string
  start_date: string
  end_date: string
  venue_id: string
  venue_name: string
  status: CourtSessionStatus
  min_players: number
  max_players: number
  committed_count: number
  hold_expires_at: string
}

/** Input for the `create` action of `ac-court-sessions`. */
export interface CreateCourtSessionForm {
  venueId: string
  name: string
  description?: string
  /** ISO timestamps. */
  startsAt: string
  endsAt: string
  minPlayers: number
  maxPlayers: number
  /** How long the court stays reserved while players commit. */
  holdMinutes: number
}

/** Response of the `join` action. */
export type JoinCourtSessionResult =
  | {
      needsPayment: true
      participantId: string
      paymentIntentClientSecret: string
      amountPence: number
      captureMethod: 'manual' | 'automatic'
    }
  | { needsPayment: false; participantId: string; processing?: boolean }

/** Response of the `cancel` action: VOID = hold released, LIABLE = still pays unless replaced. */
export interface CancelCourtPlaceResult {
  action: 'VOID' | 'LIABLE'
}

/** Error codes returned by `ac-court-sessions` as `{ error: { code, message } }`. */
export type CourtBookingErrorCode =
  | 'AC_INVALID'
  | 'AC_NOT_FOUND'
  | 'AC_FORBIDDEN'
  | 'AC_FULL'
  | 'AC_SLOT_TAKEN'
  | 'AC_ALREADY_JOINED'
  | 'AC_CLOSED'
  | 'AC_TRY_AGAIN'
  | 'AC_CONFLICT'
  | 'AC_INTERNAL'

/** Session statuses that hold a court on the calendar. */
export const ACTIVE_BOOKING_STATUSES: CourtSessionStatus[] = [
  CourtSessionStatus.PENDING_COMMITMENTS,
  CourtSessionStatus.CONFIRMING_BOOKING,
  CourtSessionStatus.CONFIRMED,
  CourtSessionStatus.REGISTRATION_CLOSED,
  CourtSessionStatus.SETTLING,
  CourtSessionStatus.COMPLETED,
]

/** Reserved (amber) vs Confirmed (green) on the calendar. */
export const isReserved = (status: CourtSessionStatus) =>
  status === CourtSessionStatus.PENDING_COMMITMENTS || status === CourtSessionStatus.CONFIRMING_BOOKING
