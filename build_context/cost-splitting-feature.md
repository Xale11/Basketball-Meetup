# Student Sports Booking App — MVP Specification

**Status:** Updated product specification  
**Scope:** University sports court bookings with automatic group cost-splitting.

## 1. Product Overview

The app allows students to organise sports sessions by reserving university sports facilities and splitting the cost between participants.

An organiser selects a court, chooses an event time and sets the minimum and maximum number of players. Participants join by paying an upfront commitment fee.

The university booking system temporarily holds the selected court while players join. If the minimum number of players is reached before the hold expires, the app confirms the booking. Otherwise, the hold is released and participants are refunded.

The commitment fee represents the maximum amount a player can pay towards their share of the court. If more players join, the final cost per player decreases and the difference is refunded.

### Core principles

- No player should pay more than their original commitment fee.
- The organiser should not need to fund the entire court personally.
- The court is confirmed only when the minimum number of successful commitments is reached and the university confirms the booking.
- Events that fail to reach their minimum release their reservation and refund participants.
- Players who commit but do not attend remain financially responsible for their share.
- Cancellation, rejoining, payments and refunds must follow consistent rules.

## 2. MVP Scope

### Included

- University facility availability and booking integration.
- Temporary court reservations.
- Event creation and management.
- Minimum and maximum player limits.
- Upfront commitment payments.
- Automatic booking confirmation when the minimum is reached.
- A configurable reservation window, targeting 6–12 hours.
- Registration remaining open until 15 minutes after the scheduled event start.
- Automatic final cost calculation and refunds.
- Participant cancellation and rejoining.
- Notifications for important event and payment changes.
- Administrative handling of failed bookings, payments and refunds.

### Excluded

- Organiser-funded last-minute bookings without temporary holds.
- A stored-value wallet.
- Attendance verification through GPS, QR codes or manual check-in.
- Variable venue pricing.
- Additional charges exceeding the original commitment fee.
- Social feeds, player ratings and competitive league features.

## 3. Event Creation

The organiser selects or enters:

| Field | Description |
|---|---|
| Sport | The activity, such as basketball. |
| Facility | The university court or sports hall. |
| Date | Scheduled event date. |
| Start and end time | Requested booking period. |
| Court cost | Fixed cost returned by the university system. |
| Minimum players | Minimum successful commitments required to confirm the booking. |
| Maximum players | Maximum permitted participants. |
| Reservation window | Time allowed to reach the minimum before the temporary hold expires. |

The maximum must be at least equal to the minimum.

The commitment fee is calculated automatically:

**Commitment fee = Court cost ÷ Minimum players**

For example, a £150 court with a minimum of 10 players requires a £15 commitment per player.

The MVP assumes a fixed court cost and equal cost-sharing.

## 4. University Booking and Reservation Flow

### Step 1 — Create a temporary hold

When an organiser creates an event, the app requests a temporary hold for the selected court and time.

The event enters `PENDING_COMMITMENTS`. The app records the hold expiry and allows players to register.

The app must clearly distinguish a temporary hold from a confirmed booking.

### Step 2 — Collect commitments

Players register and pay the commitment fee. Only successfully confirmed payments count towards the minimum.

### Step 3 — Minimum reached

When the minimum is reached before the hold expires:

1. The app requests confirmation of the held court.
2. The university booking system confirms the booking.
3. The event enters `CONFIRMED`.
4. Registration remains open until 15 minutes after the scheduled start time, subject to capacity.

Duplicate payment notifications must not trigger duplicate booking requests.

### Step 4 — Reservation expires

If the minimum is not reached before the hold expires:

1. Registration closes.
2. The app releases the university hold.
3. Participants are refunded.
4. The event enters `CANCELLED`.
5. Participants are notified.

Failed hold releases and refund operations must be tracked and retried where appropriate.

## 5. Registration Rules

Registration closes **15 minutes after the scheduled event start time**.

This allows late participants to join and potentially reduce everyone's final share.

At the cutoff:

- No new registrations are accepted.
- The eligible participant list is frozen.
- Successful payments confirmed by the cutoff count towards the split.
- Pending payments are not counted unless confirmed before the cutoff.
- The final cost and refunds are calculated from the frozen list.

The maximum capacity is enforced throughout registration.

## 6. Payments and Cost Splitting

### Initial commitment

Every participant pays the same commitment fee when registering. This is the maximum amount they can ultimately be charged for the court.

### Final cost calculation

**Final cost per player = Court cost ÷ Eligible paid players**

**Refund per player = Commitment fee − Final cost per player**

The app must validate that the final share never exceeds the original commitment.

### Example

For a £150 court with a minimum of 10 players and a maximum of 20:

| Eligible players | Commitment | Final cost per player | Refund per player |
|---:|---:|---:|---:|
| 10 | £15 | £15 | £0 |
| 12 | £15 | £12.50 | £2.50 |
| 15 | £15 | £10 | £5 |
| 20 | £15 | £7.50 | £7.50 |

Calculations use integer pence to avoid floating-point errors. Any rounding remainder must be allocated deterministically without exceeding a participant's commitment.

### Settlement timing

The app initiates refunds shortly after registration closes, 15 minutes after the scheduled start.

The university may require payment before the event, so venue payment deadlines must be handled independently of participant settlement.

Refunds must be tracked through the payment provider. A refund is not marked complete until its outcome is confirmed.

## 7. Cancellation and Rejoining

There is **no undo feature**. A cancellation takes effect only after the player explicitly confirms it.

### Cancellation confirmation

When a player selects the cancellation option, display a confirmation prompt explaining the consequences.

The player must press **Confirm cancellation** to proceed. If they back out, their registration remains unchanged.

Once confirmed, cancellation takes effect immediately under the applicable rules. The player may rejoin later if registration remains open and a place is available.

### Before the minimum is reached

- The player receives a full refund.
- Their place becomes available.
- If they rejoin, they are treated as a new registration and must pay the commitment fee again.

### After the court is confirmed, before registration closes

When a player cancels:

- Their place becomes available to another participant.
- Their existing commitment remains financially responsible for the court while their place is unfilled.
- If a replacement successfully pays for the place, the original player becomes eligible for a refund of their commitment fee.
- If nobody replaces them, the original player remains financially responsible for their commitment and counts towards the final split.

### Rejoining after cancellation

A cancelled player may rejoin if registration remains open and a place is available.

- If their original commitment has not been refunded and no replacement has taken their place, their existing commitment remains in effect. They must not be charged twice.
- If their original commitment has already been refunded because a replacement took their place, rejoining is treated as a new registration and requires a new successful payment.
- If no place is available, rejoining is rejected.
- A rejoining player cannot displace another confirmed participant.

The backend must handle simultaneous cancellation, replacement and rejoining requests without allowing duplicate places or inconsistent payments.

### After the registration cutoff

- The final participant list and cost split are frozen.
- A player can no longer rejoin.
- Cancelling attendance does not remove the player's financial responsibility for their share.
- No refund is issued solely because the player does not attend.

The MVP does not require attendance verification. Financial status and attendance status are tracked separately.

## 8. Event and Payment States

Suggested event states:

- `PENDING_COMMITMENTS` — temporary hold active.
- `CONFIRMING_BOOKING` — minimum reached; university confirmation in progress.
- `CONFIRMED` — university booking confirmed.
- `REGISTRATION_CLOSED` — participant list frozen.
- `SETTLING` — final shares and refunds being processed.
- `COMPLETED` — required settlement operations reconciled.
- `CANCELLED` — event cancelled, with applicable refunds or financial handling underway.

Suggested participant payment states:

- `PAYMENT_PENDING`
- `PAID`
- `REFUND_PENDING`
- `REFUNDED`
- `SETTLEMENT_EXCEPTION`

Participant registration and attendance should be tracked separately from payment status. Cancellation should not automatically imply that a commitment has been refunded.

## 9. Technical Requirements

### University integration

The integration should support:

- Checking availability.
- Creating a temporary hold.
- Reading hold expiry.
- Confirming a booking.
- Releasing a hold.
- Reading booking status.

Use university webhooks where available, with appropriate retries or status checks otherwise.

### Payment integration

The payment provider must support the required collection and refund workflow.

The implementation must include:

- Successful and failed payment handling.
- Verified provider webhooks.
- Idempotent payment and refund processing.
- Partial refunds where needed.
- Provider transaction references.
- Reconciliation between app records and provider transactions.

The MVP must not rely on an internal wallet or treat unpaid commitments as available funds.

### Data integrity

The backend must enforce all business rules independently of the frontend.

In particular:

- No duplicate registration charges.
- No duplicate university bookings from repeated requests.
- Atomic closure of registration and freezing of eligible participants.
- Reproducible final cost calculations.
- No duplicate refunds.
- Consistent handling of cancellations, replacements and rejoining.
- No confirmed booking status without university confirmation.

## 10. Notifications

Notify participants when:

- An event is created and a temporary hold begins.
- A payment succeeds or fails.
- The minimum is reached and the court is confirmed.
- The reservation expires without reaching the minimum.
- A cancellation takes effect.
- A cancelled participant's place is filled by a replacement.
- Registration closes.
- A refund is initiated or fails.
- Manual intervention is required.

In-app notifications and email are sufficient for the initial release, subject to implementation feasibility.

## 11. Administrative Handling

Administrators need visibility into:

- Active holds and approaching expiry.
- Failed booking confirmations.
- Holds that have not been released.
- Failed payments and refunds.
- Events stuck during settlement.
- Inconsistent payment or registration records.

Exceptions must be visible and recoverable rather than silently ignored.

## 12. MVP Acceptance Criteria

The MVP must demonstrate that:

1. An organiser can create an event and obtain a temporary hold.
2. Players can register and pay the correct commitment fee.
3. Reaching the minimum triggers one university booking confirmation.
4. Failing to reach the minimum releases the hold and initiates refunds.
5. Registration remains open until 15 minutes after the scheduled start.
6. Maximum capacity cannot be exceeded.
7. More eligible players reduce the final price.
8. Nobody is charged more than their commitment.
9. A dropout who is not replaced remains financially responsible for their commitment.
10. A replacement can take a vacated place and trigger the original player's refund.
11. A cancelled player can rejoin when permitted, without duplicate charges or conflicting registrations.
12. Duplicate requests and webhooks cannot create duplicate bookings, charges or refunds.
13. Failed booking, payment and refund operations can be identified and resolved.

## 13. Decisions Still Requiring Confirmation

Before implementation, confirm:

- The university API's authentication, hold duration, expiry and release behaviour.
- When the university requires payment for a confirmed booking.
- The payment provider and applicable UK legal and operational requirements.
- Whether the commitment includes payment-processing fees; the current model assumes the court cost is the only shared cost.
- How venue cancellations, cancellation fees and changes in court cost are handled.
- The university's permitted reservation window; the target is 6–12 hours.
- How payments initiated before but confirmed after the registration cutoff are treated.

## 14. Success Metrics

The primary metric is the proportion of created events that reach the minimum, secure a court and complete without manual payment chasing or administrative intervention.

Secondary metrics include:

- Time to reach the minimum.
- Average eligible players per event.
- Booking failure rate.
- Refund success rate.
- Cancellation and replacement rates.
- Payment and reservation exceptions requiring intervention.
