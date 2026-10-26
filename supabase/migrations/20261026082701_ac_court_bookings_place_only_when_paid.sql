-- ActivCampus · court booking: you only have a place once your payment goes through.
--
-- Before: opening the payment sheet created a PAYMENT_PENDING row that held a
-- place (counted towards capacity, shown as "your place is held"). Product
-- rule: no payment, no place.
--
-- Now:
--   * PAYMENT_PENDING is only a payment attempt. It doesn't count towards
--     capacity, the minimum, or attendance.
--   * Capacity is checked when the card is approved (ac_record_authorisation).
--     If the session filled up in the meantime, the hold is voided, so nobody
--     is charged for a place they didn't get.
--   * Every payment is a manual-capture hold, even after the court is booked.
--     A booked session captures it straight away (should_capture), which is
--     what lets the capacity check void instead of charge-then-refund.
--   * FIFO replacement of a cancelled player is decided when the replacement's
--     card is approved, not when they open the sheet. A cancelled player can
--     reclaim their own place while nobody has paid for it.

create or replace function public.ac_places_taken(p_event_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.ac_session_participants
  where event_id = p_event_id
    and registration_status = 'ACTIVE'
    and payment_status in ('AUTHORISED', 'PAID');
$$;

create or replace function public.ac_reserve_place(p_event_id uuid, p_user_id uuid)
returns table (
  participant_id           uuid,
  needs_payment            boolean,
  amount_pence             integer,
  capture_method           text,
  stripe_payment_intent_id text
)
language plpgsql
set search_path = ''
as $$
declare
  v_session  public.ac_court_sessions;
  v_existing public.ac_session_participants;
  v_id       uuid;
begin
  select * into v_session from public.ac_court_sessions where event_id = p_event_id for update;
  if not found then
    raise exception 'AC_NOT_FOUND: court session not found';
  end if;

  if v_session.status = 'CONFIRMING_BOOKING' then
    raise exception 'AC_TRY_AGAIN: the booking is being confirmed, try again in a moment';
  end if;
  if v_session.status not in ('PENDING_COMMITMENTS', 'CONFIRMED')
     or now() >= v_session.registration_closes_at
     or (v_session.status = 'PENDING_COMMITMENTS' and now() >= v_session.hold_expires_at) then
    raise exception 'AC_CLOSED: registration is closed';
  end if;

  select * into v_existing
  from public.ac_session_participants p
  where p.event_id = p_event_id and p.user_id = p_user_id
    and p.registration_status in ('ACTIVE', 'CANCELLED_LIABLE');

  if found then
    if v_existing.registration_status = 'ACTIVE' then
      if v_existing.payment_status = 'PAYMENT_PENDING' then
        -- An unfinished payment attempt: reuse it rather than start another.
        if public.ac_places_taken(p_event_id) >= v_session.max_players then
          raise exception 'AC_FULL: no places left';
        end if;
        return query select v_existing.id, true, v_existing.commitment_pence,
                            v_existing.capture_method, v_existing.stripe_payment_intent_id;
        return;
      end if;
      raise exception 'AC_ALREADY_JOINED: you already have a place';
    end if;

    -- CANCELLED_LIABLE: they still own the commitment, so they can take the
    -- place back unless a replacement's card is already approved.
    if exists (
      select 1 from public.ac_session_participants r
      where r.replaces_participant_id = v_existing.id
        and r.registration_status = 'ACTIVE'
        and r.payment_status in ('AUTHORISED', 'PAID')
    ) then
      raise exception 'AC_TRY_AGAIN: someone has just paid for your old place';
    end if;
    if public.ac_places_taken(p_event_id) >= v_session.max_players then
      raise exception 'AC_FULL: no places left';
    end if;

    update public.ac_session_participants
       set registration_status = 'ACTIVE', cancelled_at = null
     where id = v_existing.id;
    perform public.ac_sync_attendance(p_event_id, p_user_id, true);

    return query select v_existing.id, false, v_existing.commitment_pence,
                        v_existing.capture_method, v_existing.stripe_payment_intent_id;
    return;
  end if;

  -- Not a guarantee (the place is only theirs once the card is approved), but
  -- don't open a payment sheet for a session that's already full.
  if public.ac_places_taken(p_event_id) >= v_session.max_players then
    raise exception 'AC_FULL: no places left';
  end if;

  insert into public.ac_session_participants (event_id, user_id, commitment_pence, capture_method)
  values (p_event_id, p_user_id, v_session.commitment_pence, 'manual')
  returning id into v_id;

  return query select v_id, true, v_session.commitment_pence, 'manual'::text, null::text;
end;
$$;

create or replace function public.ac_record_authorisation(p_payment_intent_id text)
returns table (
  event_id        uuid,
  reached_minimum boolean,
  should_void     boolean,
  should_capture  boolean
)
language plpgsql
set search_path = ''
as $$
declare
  v_p        public.ac_session_participants;
  v_session  public.ac_court_sessions;
  v_replaces uuid;
begin
  select * into v_p from public.ac_session_participants where stripe_payment_intent_id = p_payment_intent_id;
  if not found then
    raise exception 'AC_NOT_FOUND: no participant for payment %', p_payment_intent_id;
  end if;

  select * into v_session from public.ac_court_sessions s where s.event_id = v_p.event_id for update;
  select * into v_p from public.ac_session_participants where id = v_p.id;

  if v_p.payment_status <> 'PAYMENT_PENDING' then
    return query select v_p.event_id, false, false, false;  -- duplicate delivery
    return;
  end if;

  if v_p.registration_status <> 'ACTIVE'
     or v_session.status not in ('PENDING_COMMITMENTS', 'CONFIRMING_BOOKING', 'CONFIRMED')
     or now() >= v_session.registration_closes_at then
    update public.ac_session_participants
       set payment_status = 'VOIDED', registration_status = 'WITHDRAWN'
     where id = v_p.id;
    return query select v_p.event_id, false, true, false;
    return;
  end if;

  -- The place is only theirs if one is still free now that the card is approved.
  if public.ac_places_taken(v_p.event_id) >= v_session.max_players then
    update public.ac_session_participants
       set payment_status = 'VOIDED', registration_status = 'WITHDRAWN', exception_note = 'AC_FULL'
     where id = v_p.id;
    perform public.create_notification(
      v_p.user_id, 'PAYMENT', 'Session full',
      'The last place went just before your payment completed, so your card hold was released. You have not been charged.',
      v_p.event_id
    );
    return query select v_p.event_id, false, true, false;
    return;
  end if;

  -- After confirmation, a new payer takes the place of the longest-waiting
  -- player who cancelled, whose commitment is then refunded in full.
  if v_session.status <> 'PENDING_COMMITMENTS' then
    select c.id into v_replaces
    from public.ac_session_participants c
    where c.event_id = v_p.event_id
      and c.registration_status = 'CANCELLED_LIABLE'
      and c.payment_status = 'PAID'
      and not exists (
        select 1 from public.ac_session_participants r
        where r.replaces_participant_id = c.id
          and r.registration_status = 'ACTIVE'
          and r.payment_status in ('AUTHORISED', 'PAID')
      )
    order by c.cancelled_at, c.id
    limit 1;
  end if;

  update public.ac_session_participants
     set payment_status = 'AUTHORISED', paid_at = now(), replaces_participant_id = v_replaces
   where id = v_p.id;
  perform public.ac_sync_attendance(v_p.event_id, v_p.user_id, true);

  if v_session.status = 'PENDING_COMMITMENTS'
     and public.ac_commitments(v_p.event_id) >= v_session.min_players then
    update public.ac_court_sessions set status = 'CONFIRMING_BOOKING' where ac_court_sessions.event_id = v_p.event_id;
    return query select v_p.event_id, true, false, false;
    return;
  end if;

  -- The court is already booked: capture this hold straight away.
  return query select v_p.event_id, false, false, v_session.status <> 'PENDING_COMMITMENTS';
end;
$$;

-- Pending payment attempts no longer hold places, so nothing claims a
-- cancelled player's place until its card is approved.
update public.ac_session_participants
   set replaces_participant_id = null
 where payment_status = 'PAYMENT_PENDING'
   and replaces_participant_id is not null;
