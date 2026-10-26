# ActivCampus Court Booking Demo: Implementation Plan

**App:** ActivCampus (all app-specific code uses the `AC_` prefix)
**Source spec:** `build_context/cost-splitting-feature.md`
**Goal:** A working demo to show the university we're in talks with. Students book a university court and the cost is split automatically. A simple booking calendar shows each court as **Reserved** while payments come in, and **Confirmed** once the minimum is paid.

## 1. Decisions

| Area | Decision |
|---|---|
| Form | Built into the ActivCampus app, not a throwaway prototype. It becomes the Phase 1 foundation. |
| University system | **Kept deliberately simple.** No mock university API or adapter. The "booking system" is a **calendar screen** that reads the court sessions directly: Reserved (amber) or Confirmed (green). Integrating the university's real system is a later phase. |
| Payments | Real **Stripe test mode**, using the existing Stripe account. |
| Rules | **Full spec rules**, including cancellation after confirmation, FIFO replacement and rejoining. |
| Database | The **existing Supabase project**. New `ac_*` tables only, plus one change to an existing constraint (notification types). |
| Seed data | **Lancaster University** (our first client), with placeholder facility names and prices. |

### Payment model
Card payments are split into two steps: an authorisation that holds the money, and a capture that takes it.

1. **Hold active (`PENDING_COMMITMENTS`):** each player's card is **authorised** for the commitment fee (Stripe `capture_method: manual`). No money moves.
2. **Minimum reached:** the app confirms the booking with the university, then **captures** every authorisation.
3. **After confirmation:** new joiners pay straight away (automatic capture).
4. **Registration cutoff (start + 15 min):** final shares are calculated and the difference is **partially refunded**.
5. **Hold expires without reaching the minimum:** authorisations are **cancelled**. Nobody is charged, so there are no refunds and no lost Stripe fees.

Card authorisations last about 7 days. That's well beyond the 6–12h hold window, and the demo uses minutes.

## 2. Prerequisites (Stripe and Supabase already set up)

Only configuration is needed:

- [ ] Stripe test-mode **publishable key**: add to `.env` as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (and to the EAS env if you build with EAS).
- [ ] Stripe test-mode **secret key**: Edge Function secret `STRIPE_SECRET_KEY_TEST`. Live keys later go in `STRIPE_SECRET_KEY_LIVE`; `STRIPE_MODE` (`test` by default, or `live`) picks which pair the functions use.
- [ ] After `ac-stripe-webhook` is deployed, add a **webhook endpoint** in the Stripe dashboard (test mode) pointing at `https://<project-ref>.supabase.co/functions/v1/ac-stripe-webhook`. Subscribe it to the events in §4.2. Save its signing secret as `STRIPE_WEBHOOK_SECRET_TEST` (`STRIPE_WEBHOOK_SECRET_LIVE` for the live endpoint later).
- [ ] Generate and set the `AC_CRON_SECRET` Edge Function secret (a random string).
- [ ] Set the `AC_DEMO_MODE=true` Edge Function secret and `EXPO_PUBLIC_DEMO_MODE=true` in `.env` to show the demo controls.
- [ ] Optional: install the Stripe CLI to replay webhooks during testing.

## 3. Database

**Migration:** `supabase/migrations/<timestamp>_ac_court_bookings.sql`

### 3.1 Extensions
Enable `pg_cron` and `pg_net`. Both are available on the project but not yet installed.

### 3.2 Venues (the only "university" table)

**`ac_venues`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| university_id | FK → universities | |
| name | text | e.g. "Sports Hall Court 1" |
| court_cost_pence | integer | fixed price per session |

No separate bookings table, API or availability service. The booking calendar (§5.5) reads `ac_court_sessions` directly:
- `PENDING_COMMITMENTS` / `CONFIRMING_BOOKING` → **Reserved**
- `CONFIRMED` onwards → **Confirmed**
- `CANCELLED` → hidden

Double-booking is prevented by a simple overlap check when a session is created (§3.5).

### 3.3 ActivCampus tables

**`ac_court_sessions`**: one per court-booking event
| Column | Notes |
|---|---|
| event_id | PK, FK → events (cascade delete) |
| venue_id | FK → ac_venues. Start/end times come from the `events` row. |
| court_cost_pence | copied from the venue when created |
| min_players, max_players | check `max >= min >= 2` |
| commitment_pence | `ceil(court_cost / min_players)`: rounded up so the minimum always covers the court |
| hold_expires_at | |
| registration_closes_at | event start + 15 min |
| status | `PENDING_COMMITMENTS`, `CONFIRMING_BOOKING`, `CONFIRMED`, `REGISTRATION_CLOSED`, `SETTLING`, `COMPLETED`, `CANCELLED` |
| exception_note | text, set when a payment or refund needs attention (useful for debugging) |
| created_at / updated_at | |

**`ac_session_participants`**
| Column | Notes |
|---|---|
| id | uuid PK |
| event_id, user_id | FKs |
| registration_status | `ACTIVE`, `CANCELLED_LIABLE` (cancelled after confirmation, place released, still pays), `REPLACED` (someone took their place, full refund), `WITHDRAWN` (cancelled before the minimum) |
| payment_status | `PAYMENT_PENDING`, `AUTHORISED`, `PAID`, `REFUND_PENDING`, `REFUNDED`, `VOIDED`, `SETTLEMENT_EXCEPTION` |
| stripe_payment_intent_id | unique |
| amount_captured_pence | |
| final_share_pence, refund_pence | set at settlement |
| replaces_participant_id | self-FK, for FIFO replacement |
| frozen | true once registration closes |
| joined_at, cancelled_at | |

- Partial unique index on `(event_id, user_id)` where `registration_status in ('ACTIVE','CANCELLED_LIABLE')`. A user can hold at most one place.
- Attendance is not tracked; the spec excludes attendance verification from the MVP.

**`ac_stripe_events`**: `id` (the Stripe event id) as PK plus `type` and `processed_at`. Webhooks insert here first, so a repeated webhook does nothing.

### 3.4 Row Level Security
- `select` for authenticated users on all `ac_*` tables. Students can see sessions, venues and participant counts.
- **No insert/update/delete policies for clients.** Every change goes through `security definer` functions that only `service_role` can execute. This follows the `create_notification` pattern in `20260808091251_notifications.sql` and `20260808091322_harden_create_notification_grants.sql`.

### 3.5 Postgres functions
Each one locks the session row (`SELECT … FOR UPDATE`) first. That makes concurrent joins, cancellations, replacements and webhooks safe.

| Function | Purpose |
|---|---|
| `ac_create_session(...)` | Creates the `events` row and the session in one transaction. Rejects the request if another Reserved/Confirmed session overlaps on the same venue. Sets `hold_expires_at = now() + window`. |
| `ac_reserve_place(event_id, user_id)` | Checks capacity (ACTIVE places < max) and that registration is open. Creates the `PAYMENT_PENDING` participant. If cancelled places are waiting for a replacement, links the new row to the **oldest** one (FIFO). |
| `ac_record_authorisation(pi_id)` | Marks the payment AUTHORISED. If this one reaches the minimum, it flips the session to `CONFIRMING_BOOKING` and returns `reached_minimum = true`. This happens **once only**, so the payments are captured exactly once. |
| `ac_record_payment(pi_id)` | Marks PAID. If the row is a replacement, marks the original `REPLACED` / `REFUND_PENDING`. |
| `ac_cancel_place(event_id, user_id)` | Before confirmation → `WITHDRAWN` (the caller voids the PI). After confirmation → `CANCELLED_LIABLE`. Rejected once registration has closed. |
| `ac_rejoin(event_id, user_id)` | `CANCELLED_LIABLE` and not yet replaced → back to `ACTIVE` with no new charge (needs a free place). `REPLACED` or `WITHDRAWN` → handled as a new registration. Never displaces another participant. |
| `ac_close_registration(event_id)` | Atomically sets `REGISTRATION_CLOSED` and freezes the eligible list: `PAID` and `ACTIVE`/`CANCELLED_LIABLE`. Pending payments are not counted (their PIs are cancelled). |
| `ac_compute_split(event_id)` | Integer pence. `n` = eligible count, `base = floor(cost / n)`, `r = cost − base·n`. The first `r` participants by `joined_at` pay `base + 1`. Writes `final_share_pence` and `refund_pence = captured − share`. Asserts `share ≤ commitment`. Same inputs always give the same result. |

**Scheduler:** a `pg_cron` job runs every minute and uses `pg_net` to POST `{action: "tick"}` to `ac-court-sessions` with the `AC_CRON_SECRET` header.

### 3.6 Seed data
- `universities`: "Lancaster University" (id `lancaster`, matching existing profiles).
- Venues: Sports Hall Court 1 (£150), Sports Hall Court 2 (£150), Outdoor Court (£60).
- About 20 demo player auth users plus profiles (`demo.player+N@activcampus.test`) for the "simulate player" button.

### 3.7 Notifications
Extend `notifications_type_check` with `BOOKING` and `PAYMENT`. This is the only change to an existing object. Notifications are created with `create_notification` at the trigger points in spec §10.

## 4. Edge Functions (`supabase/functions/`)

Follow the layout of `google-places/index.ts` (CORS constants, `json()` helper, `Deno.serve`). Use Stripe through `npm:stripe`, and a service-role Supabase client for database writes.

### 4.1 `ac-court-sessions/`: app backend (JWT required)

| Action | Behaviour |
|---|---|
| `create` | Validates input and calls `ac_create_session`: the `events` row (category `Sports`, host_type `USER`, `university_id` set) plus the session. The court appears on the calendar as **Reserved**. |
| `join` | `ac_reserve_place`, then creates a Stripe Customer (reused per user) and a PaymentIntent for `commitment_pence`, GBP: **manual capture** before confirmation, automatic after. Metadata carries `event_id` and `participant_id`; Stripe idempotency key `join-<participant_id>`. Returns the PaymentSheet secrets (PaymentIntent client secret, CustomerSession client secret, customer id). |
| `cancel` | `ac_cancel_place`. Voids the PI if it was cancelled before confirmation. |
| `rejoin` | `ac_rejoin`. If a new payment is needed, follows the `join` flow. |
| `simulate_player` *(demo, organiser only, `AC_DEMO_MODE`)* | Takes the next demo user, reserves a place and creates and confirms a PI server-side with `pm_card_visa`. The normal webhook path then handles it. |
| `expire_hold_now` *(demo)* | Sets `hold_expires_at = now()` and runs a tick |
| `close_registration_now` *(demo)* | Sets `registration_closes_at = now()` and runs a tick |
| `tick` *(cron secret only)* | **Hold expiry:** cancel all authorised PIs → `VOIDED`, session `CANCELLED` (it drops off the calendar), notify. **Cutoff:** `ac_close_registration` → `SETTLING` → `ac_compute_split` → Stripe partial refunds (idempotency key `refund-<participant_id>`) → `REFUND_PENDING`. **Retries:** retry failed captures and refunds; after N failures, set `exception_note` / `SETTLEMENT_EXCEPTION`. |

**Minimum reached** is shared by the webhook and `tick`: capture every `AUTHORISED` PI → session `CONFIRMED` (it turns green on the calendar) + notify. Nothing external is called; when the real university system is integrated later, its confirm call goes here.

**Venue payment timing** (spec §6) is out of scope for the demo.

### 4.2 `ac-stripe-webhook/`
- Verifies the signature (`STRIPE_WEBHOOK_SECRET_<MODE>`, `constructEventAsync`) and inserts the event id into `ac_stripe_events`. If it's already there → return 200 and do nothing.
- `payment_intent.amount_capturable_updated` → `ac_record_authorisation`. If `reached_minimum`, run the minimum-reached path.
- `payment_intent.succeeded` → `ac_record_payment`. For a replacement, start the original player's full refund.
- `payment_intent.payment_failed` → release the place and notify.
- `charge.refunded` / `refund.updated` → `REFUNDED`. When every eligible participant is settled, the session moves to `COMPLETED`.

Deploy with JWT verification **off** (Stripe can't send a JWT). The signature check replaces it.

## 5. App (React Native / Expo)

All new UI uses `useThemedStyles` so it works in light and dark mode (AC-27).

### 5.1 Types: `types/AC_courtBooking.ts`
`Venue`, `CourtSession`, `SessionParticipant`, `CalendarBooking` (a session + event times + venue name, for the calendar), and status enums matching the database values. Document each table in the doc-comment style of `types/event.ts`.

### 5.2 API: `api/AC_courtBooking.api.ts`
- Reads through `supabase.from('ac_…')`; errors through `throwSupabaseError` (`lib/supabaseError.ts`).
- Writes through `supabase.functions.invoke('ac-court-sessions', { body: { action, … } })`.

### 5.3 Hooks: `hooks/courtBooking/`
Follow the existing pattern (e.g. `hooks/events/useJoinEvent.ts`): `loading` plus a named data field or mutate alias, with invalidation on success. Add keys to `lib/queryKeys.ts` under `qk.courtBooking`.

| Hook | Notes |
|---|---|
| `AC_useCourtSession(eventId)` | session + participants + my participation; `refetchInterval: 3000` while the demo flag is on |
| `AC_useVenues` | |
| `AC_useCreateCourtSession` | |
| `AC_useJoinCourtSession` | calls `join`, then `initPaymentSheet` / `presentPaymentSheet` |
| `AC_useCancelCourtPlace`, `AC_useRejoinCourtSession` | |
| `AC_useBookingCalendar(weekStart)` | non-cancelled sessions for the week, with event times and venue names; `refetchInterval: 3000` in demo mode so colours change live |
| `AC_useDemoControls(eventId)` | simulate player / expire hold / close registration |

### 5.4 Stripe client
- `npx expo install @stripe/stripe-react-native` (works in Expo Go and dev client).
- Wrap the app in `StripeProvider` in `app/_layout.tsx`, using `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`. On iOS/Android only; hide payment UI on web.

### 5.5 Screens & components (`components/activCampus/courtBooking/`)

**Create:** add a "Book a university court" entry to `app/create.tsx` → new route `app/court-booking/new.tsx` → `AC_CreateCourtSessionForm`:
- Venue picker → date and start/end time (reusing `components/DateTimeInput.tsx`) → name/description. If the slot clashes, show "That court is already reserved at this time".
- Min/max players, plus the reservation window: 6 h (default) or 12 h. In a demo, "Expire hold now" ends it early.
- A live summary: court cost, **commitment per player**, and "price drops to £X if max players join".
- On submit → navigate to the event.

**Event detail:** in `app/event/[id].tsx`, when the event has a court session, render `AC_CourtSessionPanel` in place of the normal join/leave buttons:
- `AC_SessionStatusTimeline`: Hold → Confirmed → Registration closed → Settled. The hold is clearly labelled **"Temporary hold"** with a countdown, separate from **"Booking confirmed"**.
- `AC_CommitmentProgress`: X of min committed and Y of max places.
- `AC_PriceBreakdown`: current price per player, my commitment, my projected refund.
- Action button: **Pay £15 & join**, **Cancel place**, or **Rejoin**, depending on state.
- `AC_CancelConfirmSheet`: explains the consequences for the current state (full refund / still liable unless replaced / no refund after cutoff). Has a **Confirm cancellation** button; backing out changes nothing.
- `AC_SettlementSummary` (after the cutoff): final share, refund and refund status.
- `AC_DemoControls` (organiser + `EXPO_PUBLIC_DEMO_MODE`): **+ Simulate player**, **+5 players**, **Expire hold now**, **Close registration now**.

**Booking calendar:** `app/court-booking/calendar.tsx` → `AC_BookingCalendar`. This is the "university booking system" for the pitch, and it's read-only:
- A week view: day columns, hour rows, one block per session, labelled with the venue name.
- **Amber = Reserved** (shows "6 / 10 paid" and time left on the hold). **Green = Confirmed** (minimum paid).
- A venue filter chip row (All / Court 1 / Court 2 / Outdoor).
- Tapping a block opens the event.
- Reached from a Profile entry (shown in demo mode) and from the court session panel.
- Built with plain `View`s, no calendar library.

### 5.6 Env
Add `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `EXPO_PUBLIC_DEMO_MODE` to `.env.example`. Mention them in `.claude/CLAUDE.md`'s env section.

## 6. Build order

1. **Database:** migration, functions, RLS and seed. Test the functions with SQL scenarios (§7).
2. **Backend:** `ac-court-sessions` (create/join/cancel/rejoin/tick) and `ac-stripe-webhook`. Set the secrets, deploy and register the Stripe webhook.
3. **App data layer:** types, API, hooks, query keys, StripeProvider.
4. **Student UI:** the create flow and the session panel on event detail.
5. **Booking calendar + demo controls.**

## 7. Verification

**Static:** `yarn lint`, `npx tsc --noEmit`.

**SQL scenarios** (`execute_sql` in a transaction that is rolled back):
- A £150 court with min 10 gives shares of £15 / £12.50 / £10 / £7.50 for 10 / 12 / 15 / 20 players.
- £100 with min 3: commitment 3334p; shares sum to exactly 10000p, none above the commitment.
- Two concurrent reservations for the last place: one succeeds.
- Creating a session that overlaps a Reserved/Confirmed one on the same venue is rejected; a different venue or a cancelled session is fine.
- `ac_record_authorisation` called twice for the minimum-reaching PI: `reached_minimum` is true only once.
- Cancel after confirmation → new joiner → the original is `REPLACED`. Rejoin by a `CANCELLED_LIABLE` player is free; rejoin by a `REPLACED` player needs a new payment; rejoin when full is rejected.

**End to end (device, Stripe test mode):**
1. Create a session (Court 1, £150, min 10, max 20, 6 h reservation). The calendar shows an amber Reserved block.
2. Pay yourself (test card `4242…`) + simulate 9 players. The calendar block turns green; all 10 PIs are captured exactly once in Stripe.
3. Add 2 late joiners (immediate capture). Cancel one player and confirm the dialog → simulate a replacement. The canceller gets a full refund.
4. **Close registration now** → 12 eligible → £12.50 each → £2.50 partial refunds are visible in the Stripe dashboard → session `COMPLETED`.
5. A new session with 4 players → **Expire hold now**: PIs cancelled (no charges), session `CANCELLED`, block removed from the calendar, notifications sent.
6. `stripe events resend <id>` for an authorisation and a refund event: no duplicate capture or refund.

## 8. Demo run-through (for the meeting)
1. Open the booking calendar: show the week.
2. A student creates a court session → an amber **Reserved** block appears.
3. Players join (simulate) → the block shows "x / 10 paid" → at the minimum it turns green **Confirmed**, and the payments are captured in Stripe.
4. More players join → the live price per player drops.
5. A player cancels and is replaced → automatic refund.
6. Close registration → the final split and refunds appear in the Stripe dashboard.
7. A second session that fails to fill → the reservation disappears from the calendar, nobody is charged.

## 9. Out of scope for the demo
- A separate university booking API or integration (the calendar reads the app's own sessions).
- Venue payment and payout to the university.
- Payment-processing fees in the split (the commitment is court cost only).
- Venue-side cancellations and price changes.
- Attendance tracking.
- Email notifications (in-app only).
