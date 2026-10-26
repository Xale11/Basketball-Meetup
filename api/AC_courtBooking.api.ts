import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { throwSupabaseError } from '@/lib/supabaseError'
import {
  ACTIVE_BOOKING_STATUSES,
  CalendarBooking,
  CancelCourtPlaceResult,
  CourtBookingErrorCode,
  CourtPaymentStatus,
  CourtRegistrationStatus,
  CourtSession,
  CourtSessionDetail,
  CreateCourtSessionForm,
  JoinCourtSessionResult,
  SessionParticipantWithProfile,
  Venue,
} from '@/types/AC_courtBooking'

/**
 * ActivCampus court bookings. Reads go straight to the `ac_*` tables (RLS
 * allows signed-in users to select); every write goes through the
 * `ac-court-sessions` edge function, which owns payments.
 */

const FUNCTION = 'ac-court-sessions'

/**
 * A rule the server enforced, e.g. "no places left". `message` is written for
 * players and safe to show as-is.
 */
export class CourtBookingError extends Error {
  readonly code: CourtBookingErrorCode
  constructor(code: CourtBookingErrorCode, message: string) {
    super(message)
    this.name = 'CourtBookingError'
    this.code = code
  }
}

async function invoke<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body: { action, ...body } })
  if (error) {
    // Non-2xx: the function's `{ error: { code, message } }` body is on the Response.
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null)
      if (payload?.error?.message) {
        throw new CourtBookingError(payload.error.code ?? 'AC_INTERNAL', payload.error.message)
      }
    }
    console.error(`[AC_courtBooking.api ${action}] function error:`, error)
    throw new CourtBookingError('AC_INTERNAL', 'Something went wrong. Please try again.')
  }
  return data as T
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const fetchVenues = async (universityId: string | null): Promise<Venue[]> => {
  let query = supabase.from('ac_venues').select('*').eq('is_active', true).order('name')
  if (universityId) query = query.eq('university_id', universityId)
  const { data, error } = await query
  if (error) throwSupabaseError('AC_courtBooking.api fetchVenues', error)
  return (data ?? []) as Venue[]
}

const countsTowardsMinimum = (p: { registration_status: string; payment_status: string }) =>
  p.registration_status === CourtRegistrationStatus.ACTIVE &&
  (p.payment_status === CourtPaymentStatus.AUTHORISED || p.payment_status === CourtPaymentStatus.PAID)

const holdsPlace = (p: { registration_status: string; payment_status: string }) =>
  p.registration_status === CourtRegistrationStatus.ACTIVE &&
  (p.payment_status === CourtPaymentStatus.PAYMENT_PENDING ||
    p.payment_status === CourtPaymentStatus.AUTHORISED ||
    p.payment_status === CourtPaymentStatus.PAID)

/** The court session behind an event, or null when the event isn't a court booking. */
export const fetchCourtSession = async (eventId: string): Promise<CourtSessionDetail | null> => {
  const { data: session, error } = await supabase
    .from('ac_court_sessions')
    .select('*, venue:ac_venues(*)')
    .eq('event_id', eventId)
    .maybeSingle()
  if (error) throwSupabaseError('AC_courtBooking.api fetchCourtSession', error)
  if (!session) return null

  const { data: participants, error: pError } = await supabase
    .from('ac_session_participants')
    .select('*, profile:profiles!ac_session_participants_user_id_fkey(id, first_name, last_name, photo_url)')
    .eq('event_id', eventId)
    .order('joined_at', { ascending: true })
  if (pError) throwSupabaseError('AC_courtBooking.api fetchCourtSession participants', pError)

  const rows = (participants ?? []) as SessionParticipantWithProfile[]
  const { venue, ...rest } = session as CourtSession & { venue: Venue }
  return {
    session: rest,
    venue,
    participants: rows,
    committedCount: rows.filter(countsTowardsMinimum).length,
    placesTaken: rows.filter(holdsPlace).length,
  }
}

type CalendarRow = {
  event_id: string
  status: CourtSession['status']
  min_players: number
  max_players: number
  hold_expires_at: string
  venue_id: string
  venue: { name: string } | null
  event: { name: string; start_date: string; end_date: string } | null
}

/** Reserved and confirmed court sessions starting in [from, to). */
export const fetchBookingCalendar = async (from: Date, to: Date): Promise<CalendarBooking[]> => {
  const { data, error } = await supabase
    .from('ac_court_sessions')
    .select(
      'event_id, status, min_players, max_players, hold_expires_at, venue_id, venue:ac_venues(name), event:events!inner(name, start_date, end_date)',
    )
    .in('status', ACTIVE_BOOKING_STATUSES)
    .gte('event.start_date', from.toISOString())
    .lt('event.start_date', to.toISOString())
  if (error) throwSupabaseError('AC_courtBooking.api fetchBookingCalendar', error)

  const rows = (data ?? []) as unknown as CalendarRow[]
  if (rows.length === 0) return []

  const { data: participants, error: pError } = await supabase
    .from('ac_session_participants')
    .select('event_id, registration_status, payment_status')
    .in(
      'event_id',
      rows.map((r) => r.event_id),
    )
  if (pError) throwSupabaseError('AC_courtBooking.api fetchBookingCalendar participants', pError)

  const committed = new Map<string, number>()
  for (const p of participants ?? []) {
    if (countsTowardsMinimum(p)) committed.set(p.event_id, (committed.get(p.event_id) ?? 0) + 1)
  }

  return rows
    .filter((r) => r.event)
    .map((r) => ({
      event_id: r.event_id,
      event_name: r.event!.name,
      start_date: r.event!.start_date,
      end_date: r.event!.end_date,
      venue_id: r.venue_id,
      venue_name: r.venue?.name ?? '',
      status: r.status,
      min_players: r.min_players,
      max_players: r.max_players,
      committed_count: committed.get(r.event_id) ?? 0,
      hold_expires_at: r.hold_expires_at,
    }))
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
}

// ---------------------------------------------------------------------------
// Writes (edge function)
// ---------------------------------------------------------------------------

export const createCourtSession = (form: CreateCourtSessionForm) =>
  invoke<{ eventId: string }>('create', { ...form })

/** Reserves a place. Also the rejoin path: a free rejoin returns needsPayment: false. */
export const joinCourtSession = (eventId: string) => invoke<JoinCourtSessionResult>('join', { eventId })

export const cancelCourtPlace = (eventId: string) => invoke<CancelCourtPlaceResult>('cancel', { eventId })

// Demo controls (server checks AC_DEMO_MODE and that the caller is the organiser).

export const simulateCourtPlayers = (eventId: string, count: number) =>
  invoke<{ joined: string[] }>('simulate_player', { eventId, count })

export const expireCourtHoldNow = (eventId: string) => invoke<unknown>('expire_hold_now', { eventId })

export const closeCourtRegistrationNow = (eventId: string) =>
  invoke<unknown>('close_registration_now', { eventId })
