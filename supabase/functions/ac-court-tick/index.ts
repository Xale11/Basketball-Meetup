import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { errorResponse, json, tick } from '../_shared/AC_courtBooking.ts';

/**
 * Every-minute sweep for ActivCampus court bookings, called by pg_cron via
 * pg_net (job `ac-court-tick`): abandoned payments, expired holds, stuck
 * confirmations, registration close + refunds, and refund retries.
 *
 * JWT verification is OFF because the scheduler has no user session. The
 * `x-cron-secret` header must match AC_CRON_SECRET instead. Every step is
 * idempotent, so overlapping or repeated runs are harmless.
 */

Deno.serve(async (req) => {
  const expected = Deno.env.get('AC_CRON_SECRET');
  if (!expected || req.headers.get('x-cron-secret') !== expected) {
    return json({ error: { code: 'AC_FORBIDDEN', message: 'Forbidden' } }, 403);
  }
  try {
    return json({ ok: true, ...(await tick()) });
  } catch (error) {
    return errorResponse(error);
  }
});
