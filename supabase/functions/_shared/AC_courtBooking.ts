import Stripe from 'npm:stripe@22.6.2';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.97.0';

/**
 * Shared server logic for ActivCampus court bookings (see
 * build_context/cost-splitting-demo-implementation-plan.md).
 *
 * The database functions (`ac_*`) own every state transition and lock the
 * session row, so this module only talks to Stripe and reports outcomes back.
 * Every Stripe write carries an idempotency key derived from our own ids, so
 * retries — from the tick, a resent webhook, or a double tap — never charge,
 * capture or refund twice.
 *
 * Money flow: authorise while the court is Reserved → capture when the
 * minimum is reached → partial refunds at registration close. A reservation
 * that never fills cancels its authorisations, so nobody is charged.
 */

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/**
 * A rule violation raised by an `ac_*` database function. Those raise
 * messages shaped `AC_CODE: human readable message`; the code picks the HTTP
 * status and the app shows the message as-is.
 */
export class AcError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const STATUS_BY_CODE: Record<string, number> = {
  AC_INVALID: 400,
  AC_NOT_FOUND: 404,
  AC_FORBIDDEN: 403,
  AC_FULL: 409,
  AC_SLOT_TAKEN: 409,
  AC_ALREADY_JOINED: 409,
  AC_CLOSED: 409,
  AC_TRY_AGAIN: 409,
  AC_CONFLICT: 409,
};

export function errorResponse(error: unknown): Response {
  if (error instanceof AcError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }
  console.error('[ac] unexpected error', error);
  return json({ error: { code: 'AC_INTERNAL', message: 'Something went wrong. Please try again.' } }, 500);
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/**
 * `STRIPE_MODE` picks the key pair: `test` (default) reads
 * STRIPE_SECRET_KEY_TEST / STRIPE_WEBHOOK_SECRET_TEST, `live` the _LIVE pair.
 * A key whose prefix doesn't match the mode is refused, so a live key can
 * never be used by accident while testing (or the reverse).
 */
export const STRIPE_MODE: 'test' | 'live' = Deno.env.get('STRIPE_MODE') === 'live' ? 'live' : 'test';
export const LIVEMODE = STRIPE_MODE === 'live';
const SUFFIX = STRIPE_MODE.toUpperCase();

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let stripeInstance: Stripe | null = null;

export function stripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = requireEnv(`STRIPE_SECRET_KEY_${SUFFIX}`);
  if (!key.startsWith(`sk_${STRIPE_MODE}_`) && !key.startsWith(`rk_${STRIPE_MODE}_`)) {
    throw new Error(`STRIPE_SECRET_KEY_${SUFFIX} does not look like a ${STRIPE_MODE}-mode key`);
  }
  // The SDK version is pinned above, which pins the Stripe API version too.
  stripeInstance = new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    appInfo: { name: 'ActivCampus' },
  });
  return stripeInstance;
}

export function webhookSecret(): string {
  return requireEnv(`STRIPE_WEBHOOK_SECRET_${SUFFIX}`);
}

export const demoModeEnabled = () => Deno.env.get('AC_DEMO_MODE') === 'true';

let adminInstance: SupabaseClient | null = null;

/** Service-role client: the only role allowed to run the `ac_*` functions. */
export function admin(): SupabaseClient {
  if (adminInstance) return adminInstance;
  adminInstance = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminInstance;
}

/** Calls an `ac_*` function, turning its `AC_CODE: message` errors into AcError. */
export async function rpc<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await admin().rpc(name, args);
  if (error) {
    const match = /^(AC_[A-Z_]+):\s*(.*)$/s.exec(error.message ?? '');
    if (match) throw new AcError(match[1], match[2], STATUS_BY_CODE[match[1]] ?? 400);
    throw new Error(`${name} failed: ${error.message}`);
  }
  return data as T;
}

/** First row of a set-returning `ac_*` function. */
export async function rpcRow<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const rows = await rpc<T[]>(name, args);
  return rows[0];
}

/** The signed-in user behind a request (JWT verification is on at the gateway). */
export async function requireUser(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new AcError('AC_FORBIDDEN', 'Please sign in again.', 401);
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new AcError('AC_FORBIDDEN', 'Please sign in again.', 401);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Stripe helpers
// ---------------------------------------------------------------------------

/** Metadata tag that marks a PaymentIntent as ours; the webhook ignores the rest. */
export const PI_KIND = 'ac_court_commitment';

export async function getOrCreateCustomer(userId: string): Promise<string> {
  const db = admin();
  const { data: existing } = await db
    .from('ac_stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .eq('livemode', LIVEMODE)
    .maybeSingle();
  if (existing) return existing.stripe_customer_id;

  const { data: profile } = await db.from('profiles').select('first_name, last_name').eq('id', userId).maybeSingle();
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined;

  const customer = await stripe().customers.create(
    { name, metadata: { supabase_user_id: userId } },
    { idempotencyKey: `ac-customer-${userId}-${STRIPE_MODE}` },
  );
  await db
    .from('ac_stripe_customers')
    .upsert({ user_id: userId, livemode: LIVEMODE, stripe_customer_id: customer.id }, { onConflict: 'user_id,livemode', ignoreDuplicates: true });
  return customer.id;
}

type Reservation = {
  participant_id: string;
  needs_payment: boolean;
  amount_pence: number;
  capture_method: 'manual' | 'automatic';
  stripe_payment_intent_id: string | null;
};

/**
 * Creates (or reuses) the PaymentIntent for a reserved place and attaches it
 * to the participant row. Manual capture while the court is Reserved, so the
 * card is only held; automatic once the booking is confirmed.
 */
export async function paymentIntentFor(
  eventId: string,
  userId: string,
  reservation: Reservation,
  options: { cardOnly?: boolean } = {},
): Promise<Stripe.PaymentIntent> {
  if (reservation.stripe_payment_intent_id) {
    return await stripe().paymentIntents.retrieve(reservation.stripe_payment_intent_id);
  }

  const customerId = await getOrCreateCustomer(userId);
  const { data: event } = await admin().from('events').select('name').eq('id', eventId).maybeSingle();

  const intent = await stripe().paymentIntents.create(
    {
      amount: reservation.amount_pence,
      currency: 'gbp',
      customer: customerId,
      capture_method: reservation.capture_method,
      // Students get whatever the Dashboard enables (capture_method filters
      // out methods that can't be held). Server-confirmed demo payments are
      // card-only, since Stripe requires a return_url when redirects are possible.
      ...(options.cardOnly
        ? { payment_method_types: ['card'] }
        : { automatic_payment_methods: { enabled: true } }),
      description: `ActivCampus court booking: ${event?.name ?? eventId}`,
      metadata: {
        kind: PI_KIND,
        event_id: eventId,
        participant_id: reservation.participant_id,
        supabase_user_id: userId,
      },
    },
    { idempotencyKey: `ac-join-${reservation.participant_id}` },
  );

  await rpc('ac_attach_payment_intent', {
    p_participant_id: reservation.participant_id,
    p_payment_intent_id: intent.id,
    p_customer_id: customerId,
  });
  return intent;
}

/** Cancels a PaymentIntent, releasing any hold. Already-final intents are fine. */
export async function voidPayment(paymentIntentId: string | null | undefined): Promise<void> {
  if (!paymentIntentId) return;
  try {
    await stripe().paymentIntents.cancel(paymentIntentId, {}, { idempotencyKey: `ac-void-${paymentIntentId}` });
  } catch (error) {
    const intent = await stripe().paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (intent && ['canceled', 'succeeded'].includes(intent.status)) {
      if (intent.status === 'succeeded') {
        // Money was taken after all (raced with a capture): record it so the
        // database refunds it in full.
        await handlePaid(intent.id, intent.amount_received);
      }
      return;
    }
    console.error('[ac] could not void payment', paymentIntentId, error);
  }
}

// ---------------------------------------------------------------------------
// State machine glue: shared by the webhook, the tick and the demo controls
// ---------------------------------------------------------------------------

/** A card hold landed (manual capture). */
export async function handleAuthorised(paymentIntentId: string): Promise<void> {
  const result = await rpcRow<{
    event_id: string;
    reached_minimum: boolean;
    should_void: boolean;
    should_capture: boolean;
  }>('ac_record_authorisation', { p_payment_intent_id: paymentIntentId });

  if (result.should_void) await voidPayment(paymentIntentId);
  if (result.reached_minimum || result.should_capture) await captureHeld(result.event_id);
}

/** Money was taken (captured hold, or an automatic payment). */
export async function handlePaid(paymentIntentId: string, amountReceived: number): Promise<void> {
  const result = await rpcRow<{ event_id: string; refund_participant_id: string | null }>('ac_record_payment', {
    p_payment_intent_id: paymentIntentId,
    p_amount_received: amountReceived,
  });
  // A replacement's payment releases the player they replaced; a payment for a
  // place that no longer exists is refunded in full.
  if (result.refund_participant_id) await processPendingRefunds(result.event_id);
}

/**
 * Minimum reached: capture every held card, then mark the court Confirmed.
 * Safe to re-run — captures are idempotent and the tick retries sessions left
 * in CONFIRMING_BOOKING.
 */
export async function captureHeld(eventId: string): Promise<void> {
  const { data: held, error } = await admin()
    .from('ac_session_participants')
    .select('id, stripe_payment_intent_id')
    .eq('event_id', eventId)
    .eq('payment_status', 'AUTHORISED');
  if (error) throw new Error(`load held payments: ${error.message}`);

  for (const row of held ?? []) {
    try {
      const captured = await stripe().paymentIntents.capture(
        row.stripe_payment_intent_id,
        {},
        { idempotencyKey: `ac-capture-${row.id}` },
      );
      await handlePaid(captured.id, captured.amount_received);
    } catch (err) {
      const intent = await stripe().paymentIntents.retrieve(row.stripe_payment_intent_id).catch(() => null);
      if (intent?.status === 'succeeded') {
        await handlePaid(intent.id, intent.amount_received);
        continue;
      }
      console.error('[ac] capture failed', row.id, err);
      await admin()
        .from('ac_session_participants')
        .update({ exception_note: `capture failed: ${(err as Error).message}` })
        .eq('id', row.id);
    }
  }

  await rpc('ac_mark_confirmed', { p_event_id: eventId });
}

/** Issues every refund the database has marked as owed but not yet sent. */
export async function processPendingRefunds(eventId?: string): Promise<void> {
  let query = admin()
    .from('ac_session_participants')
    .select('id, event_id, stripe_payment_intent_id, refund_pence')
    .eq('payment_status', 'REFUND_PENDING')
    .is('stripe_refund_id', null)
    .gt('refund_pence', 0);
  if (eventId) query = query.eq('event_id', eventId);
  const { data: owed, error } = await query;
  if (error) throw new Error(`load pending refunds: ${error.message}`);

  for (const row of owed ?? []) {
    try {
      const refund = await stripe().refunds.create(
        {
          payment_intent: row.stripe_payment_intent_id,
          amount: row.refund_pence,
          metadata: { kind: PI_KIND, event_id: row.event_id, participant_id: row.id },
        },
        { idempotencyKey: `ac-refund-${row.id}` },
      );
      await rpc('ac_set_refund_id', { p_participant_id: row.id, p_refund_id: refund.id });
      if (refund.status === 'succeeded') {
        await rpc('ac_record_refund', { p_participant_id: row.id, p_refund_id: refund.id, p_succeeded: true });
      } else if (refund.status === 'failed' || refund.status === 'canceled') {
        await rpc('ac_record_refund', {
          p_participant_id: row.id,
          p_refund_id: refund.id,
          p_succeeded: false,
          p_failure: refund.failure_reason ?? refund.status,
        });
      }
      // 'pending': the refund.updated webhook finishes it.
    } catch (err) {
      console.error('[ac] refund failed', row.id, err);
      await admin()
        .from('ac_session_participants')
        .update({ exception_note: `refund failed: ${(err as Error).message}` })
        .eq('id', row.id);
    }
  }
}

/**
 * The every-minute sweep (also run on demand by the demo controls):
 * abandoned payments, expired holds, stuck confirmations, registration
 * close, and refund retries.
 */
export async function tick(): Promise<Record<string, number>> {
  const counts = { stale: 0, expired: 0, confirming: 0, closed: 0 };
  const db = admin();

  const stale = await rpc<{ stripe_payment_intent_id: string | null }[]>('ac_release_stale_payments', { p_minutes: 20 });
  for (const row of stale) await voidPayment(row.stripe_payment_intent_id);
  counts.stale = stale.length;

  const expired = await rpc<{ stripe_payment_intent_id: string | null }[]>('ac_expire_holds', {});
  for (const row of expired) await voidPayment(row.stripe_payment_intent_id);
  counts.expired = expired.length;

  const { data: confirming } = await db.from('ac_court_sessions').select('event_id').eq('status', 'CONFIRMING_BOOKING');
  for (const s of confirming ?? []) await captureHeld(s.event_id);
  counts.confirming = confirming?.length ?? 0;

  const { data: closing } = await db
    .from('ac_court_sessions')
    .select('event_id')
    .eq('status', 'CONFIRMED')
    .lte('registration_closes_at', new Date().toISOString());
  for (const s of closing ?? []) {
    // A hold that landed late must be captured before the list is frozen.
    await captureHeld(s.event_id);
    const rows = await rpc<{ result: string; void_payment_intent_id: string | null }[]>('ac_close_registration', {
      p_event_id: s.event_id,
    });
    for (const row of rows) await voidPayment(row.void_payment_intent_id);
    if (rows[0]?.result === 'SETTLING') counts.closed++;
  }

  await processPendingRefunds();
  return counts;
}
