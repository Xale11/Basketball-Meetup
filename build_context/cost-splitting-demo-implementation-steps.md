# ActivCampus Court Booking Demo: Implementation Steps

The step-by-step build checklist for `cost-splitting-demo-implementation-plan.md`, which holds the full design: tables, functions and rules.
Each step ends with a **check** that must pass before moving on.

**Stripe account:** `ActivCampus sandbox` (test mode, `acct_1UUZ6IDXIu9JKC8u`)
**Supabase:** the existing project (additive `ac_*` migrations)

---

## Stripe review: what the Stripe planner and docs changed

The Stripe implementation planner (path: Stripe only → in-app → physical goods/services → quick setup) recommends **PaymentSheet + PaymentIntents**, which matches the plan. A court booking is a real-world service, so App Store in-app purchase rules don't apply and Stripe is allowed. Adjustments taken from Stripe's docs:

| Topic | What we do |
|---|---|
| Customer in the sheet | Each player gets a Stripe Customer on the server (for reconciliation), but the sheet only needs the PaymentIntent client secret. We don't save cards, so no CustomerSession or ephemeral key is needed. |
| Payment methods | Students: `automatic_payment_methods: { enabled: true }` with top-level `capture_method` (`manual` while Reserved), so Stripe only offers methods that can be held. Demo players: `payment_method_types: ['card']`, because server-side confirmation needs a return URL when redirect methods are possible. |
| Authorisation lifetime | Card holds last **7 days** (Visa, customer-initiated). The demo uses minutes. For production, the 6–12h window is well within this. Never hold past `capture_before` on the charge. |
| Apple Pay | Not available in Expo Go. Cards (and Google Pay on a dev build) are enough for the demo. |
| iOS return URL | Pass `urlScheme: 'activcampus'` (the app's existing scheme) to `StripeProvider` / `initPaymentSheet` for 3DS redirects |
| Simulated players | Create a card-only PI → attach it → `paymentIntents.confirm(id, { payment_method: 'pm_card_visa' })`. The result is applied straight away; the webhook later arrives as a harmless duplicate. |
| Idempotency | Every create, capture, cancel and refund call passes an `idempotencyKey` derived from our own ids |
| API version | Pinned through the SDK version (`npm:stripe@22.6.2`), which fixes the API version it sends |

---

## Step 0: Prerequisites

- [x] Stripe test keys in `.env` (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is present)
- [x] Add `EXPO_PUBLIC_DEMO_MODE=true` to `.env` (not there yet)
- [x] Set Supabase **Edge Function secrets** (Dashboard → Edge Functions → Secrets):
  - `STRIPE_SECRET_KEY_TEST` = your `sk_test_…` (live later: `STRIPE_SECRET_KEY_LIVE`, switched with `STRIPE_MODE=live`)
  - `AC_DEMO_MODE` = `true`
- [x] Optional: take `STRIPE_SECRET_KEY` out of the local `.env` afterwards. It's gitignored, and without the `EXPO_PUBLIC_` prefix it isn't bundled into the app, but the app never needs it. Only the Edge Functions do.

**Check:** I list the secrets (names only) through Supabase.

---

## Step 1: Database ✅ done (2026-10-25)

1. Create `supabase/migrations/<ts>_ac_court_bookings.sql`:
   1. `create extension if not exists pg_cron; create extension if not exists pg_net;`
   2. Tables: `ac_venues`, `ac_court_sessions`, `ac_session_participants`, `ac_stripe_events`, with check constraints, the partial unique index and `updated_at` triggers.
   3. RLS: enable on every table; `select` for `authenticated`; no write policies.
   4. Functions (`security definer`, `set search_path = ''`, execute granted only to `service_role`): `ac_create_session`, `ac_reserve_place`, `ac_record_authorisation`, `ac_record_payment`, `ac_cancel_place`, `ac_rejoin`, `ac_close_registration`, `ac_compute_split`.
   5. Extend `notifications_type_check` with `BOOKING`, `PAYMENT`.
2. Create `supabase/migrations/<ts>_ac_court_bookings_seed.sql`:
   - Lancaster University, 3 venues, 20 demo player auth users plus profiles.
3. Apply both with `apply_migration`, then run `get_advisors` (security) and fix anything it flags.
4. The `pg_cron` job is added in Step 2, once the tick function URL exists.

**Check:** SQL scenarios run in a transaction that is rolled back:
- Splits for 10/12/15/20 players on £150 → 1500/1250/1000/750p.
- £100 ÷ min 3 → commitment 3334p; shares sum to 10000p; none above the commitment.
- Overlapping session on the same venue is rejected.
- Capacity full → reserve is rejected.
- `ac_record_authorisation` returns `reached_minimum` only once.
- Cancel → replace (FIFO) → the original is `REPLACED`. Free rejoin as `CANCELLED_LIABLE`. Rejoin when full is rejected.

---

## Step 2: Edge Functions ✅ done (2026-10-25), except the Stripe webhook endpoint (you)

Built and deployed (Supabase CLI, `--use-api`):

| Function | JWT | What it does |
|---|---|---|
| `ac-court-sessions` | on | Actions `create`, `join` (also handles the free rejoin), `cancel`. Demo controls (`AC_DEMO_MODE` + organiser only): `simulate_player` (1–5 demo players pay with `pm_card_visa`), `expire_hold_now`, `close_registration_now`. |
| `ac-stripe-webhook` | **off** | Verifies `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET_<MODE>`, records the event id in `ac_stripe_events` (a duplicate returns 200), then applies it. Ignores PaymentIntents without `metadata.kind = ac_court_commitment`. |
| `ac-court-tick` | **off** | Needs the `x-cron-secret` header (= `AC_CRON_SECRET`). Releases payments abandoned for 20 min, expires unfilled holds, finishes stuck confirmations, closes registration and retries refunds. |

- Shared logic is in `supabase/functions/_shared/AC_courtBooking.ts`. It picks keys by `STRIPE_MODE` (default `test`), refuses a key that doesn't match the mode, and uses idempotency keys `ac-join-/ac-capture-/ac-refund-/ac-void-<id>`.
- `join` returns `{ needsPayment, paymentIntentClientSecret, amountPence, captureMethod }`, or `{ needsPayment: false }` for a free rejoin. Errors come back as `{ error: { code, message } }`, e.g. `AC_FULL`, `AC_SLOT_TAKEN` or `AC_CLOSED`, and the message is safe to show.
- `pg_cron` job `ac-court-tick` runs every minute (migration `20261025230209_ac_court_tick_schedule.sql`). It reads the URL and secret from Vault (`ac_project_url`, `ac_cron_secret`).

**Verified against Stripe test mode:**
- 10 players held → exactly one confirmation → 10 captures. 2 late joiners charged immediately. Close → £12.50 each, 12 refunds of £2.50 `succeeded` in Stripe → session `COMPLETED`.
- Unfilled reservation → 3 holds cancelled in Stripe (£0 taken) → session `CANCELLED`.
- Cron returns 200s every minute. Unsigned or badly signed webhooks get 400; the tick without the secret gets 403; sessions without a login get 401.

**Still to do (you):** in Stripe **test mode**, go to **Developers → Webhooks → Add endpoint**:
- URL: `https://qgjvihcvzjurvoltltif.supabase.co/functions/v1/ac-stripe-webhook`
- Events: `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `refund.created`, `refund.updated`, `refund.failed`
- Copy the signing secret (`whsec_…`) into the Supabase secret `STRIPE_WEBHOOK_SECRET_TEST`

Demo payments don't depend on the webhook, since their results are applied straight away. A real student paying through the PaymentSheet does.

---

## Step 3: App data layer

1. `npx expo install @stripe/stripe-react-native`. Add `'@stripe/stripe-react-native'` to `plugins` in `app.config.js` (merchant id is optional, since there's no Apple Pay in Expo Go).
2. `app/_layout.tsx`: wrap the tree in `StripeProvider` (`publishableKey`, `urlScheme: 'activcampus'`) on native only.
3. `types/AC_courtBooking.ts`: `Venue`, `CourtSession`, `SessionParticipant`, `CalendarBooking`, and the status enums.
4. `api/AC_courtBooking.api.ts`: reads (`from('ac_…')`) and function calls (`functions.invoke('ac-court-sessions')`), using `throwSupabaseError`.
5. `lib/queryKeys.ts`: add `qk.courtBooking.{all, session(eventId), venues, calendar(weekStart)}`.
6. `hooks/courtBooking/`: `AC_useVenues`, `AC_useCourtSession`, `AC_useBookingCalendar`, `AC_useCreateCourtSession`, `AC_useJoinCourtSession` (invoke `join` → if `needsPayment`: `initPaymentSheet({ merchantDisplayName: 'ActivCampus', paymentIntentClientSecret, returnURL: 'activcampus://stripe-redirect' })` → `presentPaymentSheet`; also used for Rejoin), `AC_useCancelCourtPlace`, `AC_useDemoControls`.
7. `.env.example`: add `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_DEMO_MODE`.

**Check:** `npx tsc --noEmit` and `yarn lint` pass; the app still boots in Expo Go.

---

## Step 4: Student screens (`components/activCampus/courtBooking/`)

1. `app/create.tsx`: add a "Book a university court" entry → `router.push('/court-booking/new')`.
2. `app/court-booking/new.tsx` + `AC_CreateCourtSessionForm`: venue chips, `DateTimeInput` for start/end, min/max steppers, hold window (default 15 min in demo), a live commitment summary, and a clash error message.
3. `app/event/[id].tsx`: if `AC_useCourtSession(id)` returns a session, render `AC_CourtSessionPanel` in place of the join/leave block:
   - `AC_SessionStatusTimeline` (hold countdown vs confirmed)
   - `AC_CommitmentProgress`
   - `AC_PriceBreakdown`
   - The action button (Pay & join / Cancel place / Rejoin)
   - `AC_CancelConfirmSheet` (state-specific consequences + **Confirm cancellation**)
   - `AC_SettlementSummary`
4. Use `useThemedStyles` for everything, and check both light and dark mode.

**Check (you, on your phone):** create a session → pay with `4242 4242 4242 4242` → the panel shows you as committed → the PI is Uncaptured in Stripe.

---

## Step 5: Booking calendar + demo controls

1. `app/court-booking/calendar.tsx` + `AC_BookingCalendar`: week view built from `View`s, hour rows × day columns, venue filter chips, amber **Reserved** blocks ("6 / 10 paid", time left), green **Confirmed** blocks; tapping opens the event; 3s refetch in demo mode.
2. Entry points: a Profile row (demo mode) and a "View on calendar" link in the session panel.
3. `AC_DemoControls` in the session panel (organiser + demo mode): **+1 player**, **+5 players**, **Expire hold now**, **Close registration now**.

**Check: the full run-through.** This is §7 "End to end" in the plan doc:
1. Reserved → 10 paid → **Confirmed**; all PIs captured once.
2. Late joiners; a cancellation + replacement → full refund to the canceller.
3. Close registration → 12 players → £2.50 partial refunds in Stripe → `COMPLETED`.
4. A session that doesn't fill → expire → PIs cancelled, block gone from the calendar.
5. Resend webhooks in the Stripe Dashboard → no duplicate captures or refunds.

---

## Step 6: Wrap-up

- [ ] Update `.claude/CLAUDE.md` (new env vars, Edge Functions, `ac_*` tables).
- [ ] Rehearse the demo script (plan doc §8) on the device you'll present with.
- [ ] Before the meeting: clear old demo sessions (a small "reset demo" SQL snippet goes in the seed file).
