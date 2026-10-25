import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@22.6.2';
import {
  LIVEMODE,
  PI_KIND,
  admin,
  handleAuthorised,
  handlePaid,
  rpc,
  stripe,
  webhookSecret,
} from '../_shared/AC_courtBooking.ts';

/**
 * Stripe webhook for ActivCampus court bookings.
 *
 * JWT verification is OFF for this function — Stripe can't send a Supabase
 * JWT. The Stripe-Signature check below replaces it: anything unsigned or
 * signed with another secret is rejected before it touches the database.
 *
 * Each event id is recorded in ac_stripe_events before processing, so a
 * repeated delivery is acknowledged without being applied twice. If
 * processing fails the record is removed and a 500 makes Stripe retry.
 *
 * Subscribed events:
 *   payment_intent.amount_capturable_updated   card held (counts towards the minimum)
 *   payment_intent.succeeded                   money taken
 *   payment_intent.payment_failed              logged; the sheet lets the player retry
 *   payment_intent.canceled                    logged; we cancel intents ourselves
 *   refund.created / refund.updated / refund.failed
 */

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const ok = (body: Record<string, unknown> = { received: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

async function apply(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.amount_capturable_updated': {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata?.kind !== PI_KIND) return;
      await handleAuthorised(intent.id);
      return;
    }
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata?.kind !== PI_KIND) return;
      await handlePaid(intent.id, intent.amount_received);
      return;
    }
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled': {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata?.kind !== PI_KIND) return;
      console.log(`[ac-webhook] ${event.type}`, intent.id, intent.last_payment_error?.message ?? '');
      return;
    }
    case 'refund.created':
    case 'refund.updated':
    case 'refund.failed': {
      const refund = event.data.object as Stripe.Refund;
      const participantId = refund.metadata?.participant_id;
      if (refund.metadata?.kind !== PI_KIND || !participantId) return;
      if (refund.status === 'succeeded') {
        await rpc('ac_record_refund', { p_participant_id: participantId, p_refund_id: refund.id, p_succeeded: true });
      } else if (refund.status === 'failed' || refund.status === 'canceled') {
        await rpc('ac_record_refund', {
          p_participant_id: participantId,
          p_refund_id: refund.id,
          p_succeeded: false,
          p_failure: refund.failure_reason ?? refund.status,
        });
      }
      return;
    }
    default:
      return;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('Missing Stripe-Signature', { status: 400 });

  // The signature covers the exact bytes Stripe sent, so read the raw body.
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(payload, signature, webhookSecret(), undefined, cryptoProvider);
  } catch (error) {
    console.error('[ac-webhook] signature check failed', (error as Error).message);
    return new Response('Invalid signature', { status: 400 });
  }

  // A test-mode event hitting a live deployment (or the reverse) is not ours to apply.
  if (event.livemode !== LIVEMODE) return ok({ ignored: 'mode mismatch' });

  const db = admin();
  const { error: insertError } = await db
    .from('ac_stripe_events')
    .insert({ id: event.id, type: event.type, livemode: event.livemode });
  if (insertError) {
    if (insertError.code === '23505') return ok({ duplicate: true });
    console.error('[ac-webhook] could not record event', insertError);
    return new Response('Storage error', { status: 500 });
  }

  try {
    await apply(event);
    return ok();
  } catch (error) {
    console.error('[ac-webhook] processing failed', event.type, event.id, error);
    await db.from('ac_stripe_events').delete().eq('id', event.id);
    return new Response('Processing failed', { status: 500 });
  }
});
