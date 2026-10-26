-- ActivCampus · court booking: only the payment flow may change who's attending.
--
-- Bug: the feed card's ordinary "Join" inserted an event_participants row for
-- a court-booking event, so a player showed as "going" without paying. For
-- court sessions, event_participants is a mirror of ac_session_participants,
-- written only by the ac_* functions (via service_role, which bypasses RLS).
--
-- These RESTRICTIVE policies are ANDed with the existing permissive ones, so
-- ordinary events are unaffected; signed-in users just can't insert or delete
-- attendance rows for an event that has a court session.

drop policy if exists "No direct join for court bookings" on public.event_participants;
create policy "No direct join for court bookings"
  on public.event_participants
  as restrictive
  for insert
  to authenticated
  with check (
    not exists (select 1 from public.ac_court_sessions s where s.event_id = event_participants.event_id)
  );

drop policy if exists "No direct leave for court bookings" on public.event_participants;
create policy "No direct leave for court bookings"
  on public.event_participants
  as restrictive
  for delete
  to authenticated
  using (
    not exists (select 1 from public.ac_court_sessions s where s.event_id = event_participants.event_id)
  );

-- Repair rows created before this guard: "going" on a court session without
-- a place that counts (a hold or a payment).
delete from public.event_participants ep
using public.ac_court_sessions s
where s.event_id = ep.event_id
  and ep.status = 'GOING'
  and not exists (
    select 1 from public.ac_session_participants p
    where p.event_id = ep.event_id
      and p.user_id = ep.user_id
      and p.registration_status = 'ACTIVE'
      and p.payment_status in ('AUTHORISED', 'PAID')
  );
