import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  AcError,
  CORS,
  admin,
  demoModeEnabled,
  errorResponse,
  handleAuthorised,
  handlePaid,
  json,
  paymentIntentFor,
  requireUser,
  rpc,
  rpcRow,
  stripe,
  tick,
  voidPayment,
} from '../_shared/AC_courtBooking.ts';

/**
 * ActivCampus court bookings: the app's backend (JWT required).
 *
 * POST { action, ... }
 *   create   { venueId, name, description?, startsAt, endsAt, minPlayers, maxPlayers, holdMinutes }
 *   join     { eventId }   reserve a place → PaymentSheet secret, or a free rejoin
 *   cancel   { eventId }   after the app's "Confirm cancellation" step
 *
 * Demo controls (AC_DEMO_MODE=true, organiser only):
 *   simulate_player        { eventId, count? }  demo players pay with a test card
 *   expire_hold_now        { eventId }
 *   close_registration_now { eventId }
 */

type Body = Record<string, unknown> & { action?: string };

const str = (v: unknown, field: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new AcError('AC_INVALID', `${field} is required`);
  return v.trim();
};
const int = (v: unknown, field: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new AcError('AC_INVALID', `${field} must be a whole number`);
  return v;
};

async function create(userId: string, body: Body) {
  const eventId = await rpc<string>('ac_create_session', {
    p_organiser_id: userId,
    p_venue_id: str(body.venueId, 'venueId'),
    p_name: str(body.name, 'name'),
    p_description: typeof body.description === 'string' ? body.description : null,
    p_starts_at: str(body.startsAt, 'startsAt'),
    p_ends_at: str(body.endsAt, 'endsAt'),
    p_min_players: int(body.minPlayers, 'minPlayers'),
    p_max_players: int(body.maxPlayers, 'maxPlayers'),
    p_hold_minutes: int(body.holdMinutes, 'holdMinutes'),
  });
  return { eventId };
}

async function join(userId: string, body: Body) {
  const eventId = str(body.eventId, 'eventId');
  const reservation = await rpcRow<{
    participant_id: string;
    needs_payment: boolean;
    amount_pence: number;
    capture_method: 'manual' | 'automatic';
    stripe_payment_intent_id: string | null;
  }>('ac_reserve_place', { p_event_id: eventId, p_user_id: userId });

  if (!reservation.needs_payment) {
    return { needsPayment: false, participantId: reservation.participant_id };
  }

  const intent = await paymentIntentFor(eventId, userId, reservation);

  // A reused intent the user already completed: the webhook is on its way.
  if (['requires_capture', 'succeeded', 'processing'].includes(intent.status)) {
    return { needsPayment: false, participantId: reservation.participant_id, processing: true };
  }
  if (intent.status === 'canceled') {
    throw new AcError('AC_TRY_AGAIN', 'Your previous payment attempt expired. Please try again in a minute.', 409);
  }

  return {
    needsPayment: true,
    participantId: reservation.participant_id,
    paymentIntentClientSecret: intent.client_secret,
    amountPence: reservation.amount_pence,
    captureMethod: reservation.capture_method,
  };
}

async function cancel(userId: string, body: Body) {
  const eventId = str(body.eventId, 'eventId');
  const result = await rpcRow<{ participant_id: string; action: 'VOID' | 'LIABLE'; stripe_payment_intent_id: string | null }>(
    'ac_cancel_place',
    { p_event_id: eventId, p_user_id: userId },
  );
  if (result.action === 'VOID') await voidPayment(result.stripe_payment_intent_id);
  return { action: result.action };
}

// ---------------------------------------------------------------------------
// Demo controls
// ---------------------------------------------------------------------------

async function requireOrganiser(userId: string, eventId: string) {
  if (!demoModeEnabled()) throw new AcError('AC_FORBIDDEN', 'Demo controls are switched off.', 403);
  const { data } = await admin().from('ac_court_sessions').select('organiser_id').eq('event_id', eventId).maybeSingle();
  if (!data) throw new AcError('AC_NOT_FOUND', 'Court session not found', 404);
  if (data.organiser_id !== userId) throw new AcError('AC_FORBIDDEN', 'Only the organiser can use demo controls.', 403);
}

/**
 * Demo players join and pay with Stripe's `pm_card_visa` test card. The
 * outcome is applied straight away rather than waiting for the webhook, so the
 * demo responds instantly; the webhook then arrives as a harmless duplicate.
 */
async function simulatePlayers(userId: string, body: Body) {
  const eventId = str(body.eventId, 'eventId');
  await requireOrganiser(userId, eventId);
  const count = Math.min(Math.max(typeof body.count === 'number' ? Math.floor(body.count) : 1, 1), 5);
  const db = admin();

  const { data: taken } = await db
    .from('ac_session_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .in('registration_status', ['ACTIVE', 'CANCELLED_LIABLE']);
  const takenIds = new Set((taken ?? []).map((r) => r.user_id));

  const { data: pool, error } = await db
    .from('profiles')
    .select('id, first_name')
    .eq('course', 'Demo player')
    .eq('university_id', 'lancaster')
    .order('first_name');
  if (error) throw new Error(`load demo players: ${error.message}`);
  const available = (pool ?? []).filter((p) => !takenIds.has(p.id)).slice(0, count);
  if (available.length === 0) throw new AcError('AC_FULL', 'No demo players left to add.', 409);

  const joined: string[] = [];
  for (const player of available) {
    const reservation = await rpcRow<{
      participant_id: string;
      needs_payment: boolean;
      amount_pence: number;
      capture_method: 'manual' | 'automatic';
      stripe_payment_intent_id: string | null;
    }>('ac_reserve_place', { p_event_id: eventId, p_user_id: player.id });
    if (!reservation.needs_payment) {
      joined.push(player.first_name);
      continue;
    }

    const intent = await paymentIntentFor(eventId, player.id, reservation, { cardOnly: true });
    const confirmed = await stripe().paymentIntents.confirm(
      intent.id,
      { payment_method: 'pm_card_visa' },
      { idempotencyKey: `ac-demo-confirm-${reservation.participant_id}` },
    );

    if (confirmed.status === 'requires_capture') await handleAuthorised(confirmed.id);
    else if (confirmed.status === 'succeeded') await handlePaid(confirmed.id, confirmed.amount_received);
    joined.push(player.first_name);
  }
  return { joined };
}

async function expireHoldNow(userId: string, body: Body) {
  const eventId = str(body.eventId, 'eventId');
  await requireOrganiser(userId, eventId);
  await admin()
    .from('ac_court_sessions')
    .update({ hold_expires_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('status', 'PENDING_COMMITMENTS');
  return { tick: await tick() };
}

async function closeRegistrationNow(userId: string, body: Body) {
  const eventId = str(body.eventId, 'eventId');
  await requireOrganiser(userId, eventId);
  await admin()
    .from('ac_court_sessions')
    .update({ registration_closes_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('status', 'CONFIRMED');
  return { tick: await tick() };
}

const ACTIONS: Record<string, (userId: string, body: Body) => Promise<unknown>> = {
  create,
  join,
  cancel,
  simulate_player: simulatePlayers,
  expire_hold_now: expireHoldNow,
  close_registration_now: closeRegistrationNow,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: { code: 'AC_INVALID', message: 'POST only' } }, 405);

  try {
    const userId = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as Body;
    const handler = body.action ? ACTIONS[body.action] : undefined;
    if (!handler) throw new AcError('AC_INVALID', `Unknown action: ${body.action ?? '(none)'}`);
    return json(await handler(userId, body));
  } catch (error) {
    return errorResponse(error);
  }
});
