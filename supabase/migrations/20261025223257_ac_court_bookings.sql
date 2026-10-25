-- ActivCampus · court booking with automatic cost splitting (demo, Phase 1).
--
-- See build_context/cost-splitting-demo-implementation-plan.md. Students book
-- a university court; each player commits ceil(court cost / min players); the
-- court shows as Reserved until the minimum have paid, then Confirmed. At
-- registration close (start + 15 min) the cost is re-split across everyone who
-- paid and the difference is refunded.
--
-- Money moves only through Stripe, driven by the `ac-court-sessions` and
-- `ac-stripe-webhook` edge functions. Clients can read these tables but never
-- write them: every state change goes through the functions below, which are
-- executable by `service_role` only and lock the session row first, so
-- concurrent joins, cancellations and webhooks are serialised per session.
--
-- Errors raised for the edge functions to map start with an `AC_` code, e.g.
-- `AC_FULL`, followed by a human-readable message.

-- Used by the every-minute tick (hold expiry, registration close, retries),
-- which is scheduled once the edge function exists.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Bookable university facilities. Fixed price per session (the spec's MVP
-- assumes no variable venue pricing).
create table if not exists public.ac_venues (
  id               uuid primary key default gen_random_uuid(),
  university_id    text not null references public.universities(id) on update cascade on delete cascade,
  name             text not null,
  address          text,
  court_cost_pence integer not null check (court_cost_pence > 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists ac_venues_university_idx on public.ac_venues (university_id);

-- One per court-booking event. Start/end times live on the `events` row.
create table if not exists public.ac_court_sessions (
  event_id               uuid primary key references public.events(id) on update cascade on delete cascade,
  venue_id               uuid not null references public.ac_venues(id) on update cascade on delete restrict,
  organiser_id           uuid not null references public.profiles(id) on update cascade on delete restrict,
  court_cost_pence       integer not null check (court_cost_pence > 0),
  min_players            integer not null check (min_players >= 2),
  max_players            integer not null,
  -- ceil(court cost / min players): rounded up so the minimum always covers the court.
  commitment_pence       integer not null,
  hold_expires_at        timestamptz not null,
  registration_closes_at timestamptz not null,
  status                 text not null default 'PENDING_COMMITMENTS',
  confirmed_at           timestamptz,
  closed_at              timestamptz,
  completed_at           timestamptz,
  cancelled_at           timestamptz,
  exception_note         text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint ac_court_sessions_status_check check (status in (
    'PENDING_COMMITMENTS', 'CONFIRMING_BOOKING', 'CONFIRMED',
    'REGISTRATION_CLOSED', 'SETTLING', 'COMPLETED', 'CANCELLED'
  )),
  constraint ac_court_sessions_max_check check (max_players >= min_players),
  constraint ac_court_sessions_commitment_check check (commitment_pence * min_players >= court_cost_pence)
);

create index if not exists ac_court_sessions_venue_idx on public.ac_court_sessions (venue_id);
create index if not exists ac_court_sessions_status_idx on public.ac_court_sessions (status);

-- A player's place in a session. Registration and payment are tracked
-- separately: cancelling does not imply a refund (spec §8).
--
-- registration_status:
--   ACTIVE            holds a place
--   CANCELLED_LIABLE  cancelled after confirmation; place released, still pays
--                     their share unless someone replaces them
--   REPLACED          a replacement paid for their place; fully refunded
--   WITHDRAWN         cancelled before paying / before the minimum; authorisation voided
create table if not exists public.ac_session_participants (
  id                       uuid primary key default gen_random_uuid(),
  event_id                 uuid not null references public.ac_court_sessions(event_id) on update cascade on delete cascade,
  user_id                  uuid not null references public.profiles(id) on update cascade on delete cascade,
  registration_status      text not null default 'ACTIVE',
  payment_status           text not null default 'PAYMENT_PENDING',
  commitment_pence         integer not null check (commitment_pence > 0),
  capture_method           text not null,
  stripe_payment_intent_id text unique,
  stripe_customer_id       text,
  amount_captured_pence    integer not null default 0,
  final_share_pence        integer,
  refund_pence             integer not null default 0,
  stripe_refund_id         text,
  replaces_participant_id  uuid references public.ac_session_participants(id) on delete set null,
  eligible                 boolean not null default false,
  frozen                   boolean not null default false,
  joined_at                timestamptz not null default now(),
  paid_at                  timestamptz,
  cancelled_at             timestamptz,
  exception_note           text,
  updated_at               timestamptz not null default now(),
  constraint ac_participants_registration_check check (registration_status in (
    'ACTIVE', 'CANCELLED_LIABLE', 'REPLACED', 'WITHDRAWN'
  )),
  constraint ac_participants_payment_check check (payment_status in (
    'PAYMENT_PENDING', 'AUTHORISED', 'PAID', 'REFUND_PENDING', 'REFUNDED',
    'VOIDED', 'SETTLEMENT_EXCEPTION'
  )),
  constraint ac_participants_capture_check check (capture_method in ('manual', 'automatic')),
  constraint ac_participants_share_check check (final_share_pence is null or final_share_pence <= commitment_pence)
);

-- One live place per user per session.
create unique index if not exists ac_participants_one_place_idx
  on public.ac_session_participants (event_id, user_id)
  where registration_status in ('ACTIVE', 'CANCELLED_LIABLE');

-- A cancelled place can be claimed by at most one live replacement.
create unique index if not exists ac_participants_one_replacement_idx
  on public.ac_session_participants (replaces_participant_id)
  where replaces_participant_id is not null and registration_status = 'ACTIVE';

create index if not exists ac_participants_event_idx on public.ac_session_participants (event_id);
create index if not exists ac_participants_user_idx on public.ac_session_participants (user_id);

-- Stripe Customer per user and mode, so test and live never mix.
create table if not exists public.ac_stripe_customers (
  user_id            uuid not null references public.profiles(id) on update cascade on delete cascade,
  livemode           boolean not null,
  stripe_customer_id text not null unique,
  created_at         timestamptz not null default now(),
  primary key (user_id, livemode)
);

-- Processed webhook events. The webhook inserts here first; a duplicate
-- delivery hits the primary key and is acknowledged without reprocessing.
create table if not exists public.ac_stripe_events (
  id          text primary key,
  type        text not null,
  livemode    boolean not null,
  received_at timestamptz not null default now()
);

-- updated_at bookkeeping
create or replace function public.ac_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ac_court_sessions_touch on public.ac_court_sessions;
create trigger ac_court_sessions_touch before update on public.ac_court_sessions
  for each row execute function public.ac_touch_updated_at();

drop trigger if exists ac_participants_touch on public.ac_session_participants;
create trigger ac_participants_touch before update on public.ac_session_participants
  for each row execute function public.ac_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: read-only for signed-in users
-- ---------------------------------------------------------------------------

alter table public.ac_venues               enable row level security;
alter table public.ac_court_sessions       enable row level security;
alter table public.ac_session_participants enable row level security;
alter table public.ac_stripe_customers     enable row level security;
alter table public.ac_stripe_events        enable row level security;

create policy "Venues are readable by signed-in users"
  on public.ac_venues for select to authenticated using (true);

-- Sessions drive the booking calendar, so every signed-in user can see them.
create policy "Court sessions are readable by signed-in users"
  on public.ac_court_sessions for select to authenticated using (true);

-- Participant rows carry no card data — only statuses and amounts — and the
-- session panel needs the counts.
create policy "Session participants are readable by signed-in users"
  on public.ac_session_participants for select to authenticated using (true);

create policy "Users can read their own Stripe customer"
  on public.ac_stripe_customers for select to authenticated using (user_id = auth.uid());

-- ac_stripe_events: no policies at all; service_role only.

-- ---------------------------------------------------------------------------
-- Notifications: two new types for booking and payment updates
-- ---------------------------------------------------------------------------

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in ('INVITE','REMINDER','JOIN','SOCIETY','ANNOUNCEMENT','BOOKING','PAYMENT')
);

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------

-- Mirrors a court place into event_participants so the existing feed counts,
-- attendee lists and "friends going" keep working unchanged.
create or replace function public.ac_sync_attendance(p_event_id uuid, p_user_id uuid, p_going boolean)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.event_participants (event_id, user_id, status)
  values (p_event_id, p_user_id, case when p_going then 'GOING' else 'LEFT' end)
  on conflict (event_id, user_id)
  do update set status = excluded.status;
end;
$$;

-- Places currently taken: active and not abandoned.
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
    and payment_status in ('PAYMENT_PENDING', 'AUTHORISED', 'PAID');
$$;

-- Commitments that count towards the minimum.
create or replace function public.ac_commitments(p_event_id uuid)
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

-- ---------------------------------------------------------------------------
-- Session lifecycle
-- ---------------------------------------------------------------------------

-- Creates the event and its court session in one transaction. The venue row
-- is locked so two organisers can't book the same slot at once.
create or replace function public.ac_create_session(
  p_organiser_id uuid,
  p_venue_id     uuid,
  p_name         text,
  p_description  text,
  p_starts_at    timestamptz,
  p_ends_at      timestamptz,
  p_min_players  integer,
  p_max_players  integer,
  p_hold_minutes integer
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_venue      public.ac_venues;
  v_commitment integer;
  v_event_id   uuid;
begin
  if p_ends_at <= p_starts_at then
    raise exception 'AC_INVALID: the session must end after it starts';
  end if;
  if p_starts_at <= now() then
    raise exception 'AC_INVALID: the session must start in the future';
  end if;
  if p_min_players < 2 or p_max_players < p_min_players then
    raise exception 'AC_INVALID: need at least 2 players, and max must be at least min';
  end if;
  if p_hold_minutes < 1 or p_hold_minutes > 1440 then
    raise exception 'AC_INVALID: the reservation window must be between 1 minute and 24 hours';
  end if;

  select * into v_venue from public.ac_venues where id = p_venue_id and is_active for update;
  if not found then
    raise exception 'AC_NOT_FOUND: venue not found';
  end if;

  if exists (
    select 1
    from public.ac_court_sessions s
    join public.events e on e.id = s.event_id
    where s.venue_id = p_venue_id
      and s.status <> 'CANCELLED'
      and tstzrange(e.start_date, e.end_date) && tstzrange(p_starts_at, p_ends_at)
  ) then
    raise exception 'AC_SLOT_TAKEN: that court is already reserved at this time';
  end if;

  v_commitment := ceil(v_venue.court_cost_pence::numeric / p_min_players)::integer;

  insert into public.events (
    name, description, category, start_date, end_date, is_online, address,
    visibility, join_policy, max_participants, is_cancelled, created_by_user_id,
    host_type, university_id, booking_mode, price_from, currency
  ) values (
    p_name, p_description, 'Sports', p_starts_at, p_ends_at, false, v_venue.name,
    'PUBLIC', 'OPEN', p_max_players, false, p_organiser_id,
    'USER', v_venue.university_id, 'TICKETED', v_commitment / 100.0, 'GBP'
  )
  returning id into v_event_id;

  insert into public.ac_court_sessions (
    event_id, venue_id, organiser_id, court_cost_pence, min_players, max_players,
    commitment_pence, hold_expires_at, registration_closes_at
  ) values (
    v_event_id, p_venue_id, p_organiser_id, v_venue.court_cost_pence, p_min_players, p_max_players,
    v_commitment,
    least(now() + make_interval(mins => p_hold_minutes), p_starts_at),
    p_starts_at + interval '15 minutes'
  );

  return v_event_id;
end;
$$;

-- Reserves (or re-activates) a place for a user.
--
--   * an abandoned pending payment of theirs is reused, not duplicated;
--   * a CANCELLED_LIABLE player whose place has not been taken gets it back
--     with no new charge (their commitment still stands);
--   * after confirmation a new joiner is linked to the oldest unreplaced
--     cancellation (FIFO), so their payment triggers that player's refund.
--
-- Returns needs_payment = false only for the free rejoin.
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
  v_capture  text;
  v_replaces uuid;
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
        return query select v_existing.id, true, v_existing.commitment_pence,
                            v_existing.capture_method, v_existing.stripe_payment_intent_id;
        return;
      end if;
      raise exception 'AC_ALREADY_JOINED: you already have a place';
    end if;

    -- CANCELLED_LIABLE: free rejoin if nobody has claimed the place.
    if exists (
      select 1 from public.ac_session_participants r
      where r.replaces_participant_id = v_existing.id and r.registration_status = 'ACTIVE'
    ) then
      raise exception 'AC_TRY_AGAIN: someone is paying for your old place right now';
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

  if public.ac_places_taken(p_event_id) >= v_session.max_players then
    raise exception 'AC_FULL: no places left';
  end if;

  if v_session.status = 'PENDING_COMMITMENTS' then
    v_capture := 'manual';
  else
    v_capture := 'automatic';
    select c.id into v_replaces
    from public.ac_session_participants c
    where c.event_id = p_event_id
      and c.registration_status = 'CANCELLED_LIABLE'
      and not exists (
        select 1 from public.ac_session_participants r
        where r.replaces_participant_id = c.id and r.registration_status = 'ACTIVE'
      )
    order by c.cancelled_at, c.id
    limit 1;
  end if;

  insert into public.ac_session_participants (
    event_id, user_id, commitment_pence, capture_method, replaces_participant_id
  ) values (
    p_event_id, p_user_id, v_session.commitment_pence, v_capture, v_replaces
  )
  returning id into v_id;

  return query select v_id, true, v_session.commitment_pence, v_capture, null::text;
end;
$$;

create or replace function public.ac_attach_payment_intent(
  p_participant_id uuid,
  p_payment_intent_id text,
  p_customer_id text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.ac_session_participants
     set stripe_payment_intent_id = p_payment_intent_id,
         stripe_customer_id = p_customer_id
   where id = p_participant_id
     and (stripe_payment_intent_id is null or stripe_payment_intent_id = p_payment_intent_id);
  if not found then
    raise exception 'AC_CONFLICT: participant already has a different payment';
  end if;
end;
$$;

-- Webhook: payment_intent.amount_capturable_updated (card held, manual capture).
--
-- reached_minimum is true for exactly one call per session: the one that
-- moves it to CONFIRMING_BOOKING. should_void / should_capture tell the caller
-- what to do with a hold that arrived after the session moved on.
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
  v_p       public.ac_session_participants;
  v_session public.ac_court_sessions;
begin
  select * into v_p from public.ac_session_participants where stripe_payment_intent_id = p_payment_intent_id;
  if not found then
    raise exception 'AC_NOT_FOUND: no participant for payment %', p_payment_intent_id;
  end if;

  select * into v_session from public.ac_court_sessions s where s.event_id = v_p.event_id for update;
  -- Re-read under the session lock.
  select * into v_p from public.ac_session_participants where id = v_p.id;

  if v_p.payment_status <> 'PAYMENT_PENDING' then
    return query select v_p.event_id, false, false, false;  -- duplicate delivery
    return;
  end if;

  if v_p.registration_status <> 'ACTIVE'
     or v_session.status not in ('PENDING_COMMITMENTS', 'CONFIRMING_BOOKING', 'CONFIRMED') then
    update public.ac_session_participants
       set payment_status = 'VOIDED', registration_status = 'WITHDRAWN'
     where id = v_p.id;
    return query select v_p.event_id, false, true, false;
    return;
  end if;

  update public.ac_session_participants
     set payment_status = 'AUTHORISED', paid_at = now()
   where id = v_p.id;
  perform public.ac_sync_attendance(v_p.event_id, v_p.user_id, true);

  if v_session.status = 'PENDING_COMMITMENTS'
     and public.ac_commitments(v_p.event_id) >= v_session.min_players then
    update public.ac_court_sessions set status = 'CONFIRMING_BOOKING' where ac_court_sessions.event_id = v_p.event_id;
    return query select v_p.event_id, true, false, false;
    return;
  end if;

  -- Held after confirmation already started: capture it straight away.
  return query select v_p.event_id, false, false, v_session.status <> 'PENDING_COMMITMENTS';
end;
$$;

-- Webhook: payment_intent.succeeded (captured, or an automatic-capture payment).
--
-- If this payer is a replacement, the player they replaced becomes REPLACED
-- and is returned so the caller can refund them in full.
create or replace function public.ac_record_payment(p_payment_intent_id text, p_amount_received integer)
returns table (
  event_id                 uuid,
  refund_participant_id    uuid,
  refund_payment_intent_id text,
  refund_amount_pence      integer,
  should_refund_self       boolean
)
language plpgsql
set search_path = ''
as $$
declare
  v_p        public.ac_session_participants;
  v_session  public.ac_court_sessions;
  v_original public.ac_session_participants;
begin
  select * into v_p from public.ac_session_participants where stripe_payment_intent_id = p_payment_intent_id;
  if not found then
    raise exception 'AC_NOT_FOUND: no participant for payment %', p_payment_intent_id;
  end if;

  select * into v_session from public.ac_court_sessions s where s.event_id = v_p.event_id for update;
  select * into v_p from public.ac_session_participants where id = v_p.id;

  if v_p.payment_status in ('PAID', 'REFUND_PENDING', 'REFUNDED', 'SETTLEMENT_EXCEPTION') then
    return query select v_p.event_id, null::uuid, null::text, null::integer, false;  -- duplicate
    return;
  end if;

  update public.ac_session_participants
     set payment_status = 'PAID',
         amount_captured_pence = p_amount_received,
         paid_at = coalesce(paid_at, now())
   where id = v_p.id;

  -- Paid for a place that no longer exists (withdrew mid-payment, or the
  -- session closed/cancelled meanwhile): refund it in full.
  if v_p.registration_status <> 'ACTIVE'
     or v_session.status in ('CANCELLED', 'REGISTRATION_CLOSED', 'SETTLING', 'COMPLETED') then
    update public.ac_session_participants
       set payment_status = 'REFUND_PENDING', refund_pence = p_amount_received,
           registration_status = case when registration_status = 'ACTIVE' then 'WITHDRAWN' else registration_status end
     where id = v_p.id;
    return query select v_p.event_id, v_p.id, v_p.stripe_payment_intent_id, p_amount_received, true;
    return;
  end if;

  perform public.ac_sync_attendance(v_p.event_id, v_p.user_id, true);

  if v_p.replaces_participant_id is not null then
    select * into v_original from public.ac_session_participants
    where id = v_p.replaces_participant_id and registration_status = 'CANCELLED_LIABLE';
    if found then
      update public.ac_session_participants
         set registration_status = 'REPLACED',
             payment_status = 'REFUND_PENDING',
             refund_pence = amount_captured_pence,
             final_share_pence = 0
       where id = v_original.id;
      perform public.create_notification(
        v_original.user_id, 'PAYMENT', 'Your place was filled',
        'Someone took your place, so your commitment is being refunded in full.', v_p.event_id
      );
      return query select v_p.event_id, v_original.id, v_original.stripe_payment_intent_id,
                          v_original.amount_captured_pence, false;
      return;
    end if;
  end if;

  return query select v_p.event_id, null::uuid, null::text, null::integer, false;
end;
$$;

-- After every hold has been captured: CONFIRMING_BOOKING → CONFIRMED.
-- Returns false if there is nothing to do (already confirmed, or still
-- waiting on captures).
create or replace function public.ac_mark_confirmed(p_event_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_session public.ac_court_sessions;
  v_user    uuid;
begin
  select * into v_session from public.ac_court_sessions where event_id = p_event_id for update;
  if not found or v_session.status <> 'CONFIRMING_BOOKING' then
    return false;
  end if;
  if exists (
    select 1 from public.ac_session_participants
    where event_id = p_event_id and registration_status = 'ACTIVE' and payment_status = 'AUTHORISED'
  ) then
    return false;
  end if;

  update public.ac_court_sessions set status = 'CONFIRMED', confirmed_at = now() where event_id = p_event_id;

  for v_user in
    select user_id from public.ac_session_participants
    where event_id = p_event_id and registration_status = 'ACTIVE' and payment_status = 'PAID'
  loop
    perform public.create_notification(
      v_user, 'BOOKING', 'Court confirmed',
      'The minimum was reached and the court is booked. The more people join, the less you pay.', p_event_id
    );
  end loop;
  return true;
end;
$$;

-- Player cancels (after the app's "Confirm cancellation" step).
--   action = 'VOID'   → the caller cancels the PaymentIntent (nothing was taken)
--   action = 'LIABLE' → place released; they still pay unless replaced
create or replace function public.ac_cancel_place(p_event_id uuid, p_user_id uuid)
returns table (participant_id uuid, action text, stripe_payment_intent_id text)
language plpgsql
set search_path = ''
as $$
declare
  v_session public.ac_court_sessions;
  v_p       public.ac_session_participants;
begin
  select * into v_session from public.ac_court_sessions where event_id = p_event_id for update;
  if not found then
    raise exception 'AC_NOT_FOUND: court session not found';
  end if;
  if v_session.status = 'CONFIRMING_BOOKING' then
    raise exception 'AC_TRY_AGAIN: the booking is being confirmed, try again in a moment';
  end if;
  if v_session.status not in ('PENDING_COMMITMENTS', 'CONFIRMED') or now() >= v_session.registration_closes_at then
    raise exception 'AC_CLOSED: registration has closed, so your share is fixed';
  end if;

  select * into v_p from public.ac_session_participants p
  where p.event_id = p_event_id and p.user_id = p_user_id and p.registration_status = 'ACTIVE';
  if not found then
    raise exception 'AC_NOT_FOUND: you do not have a place';
  end if;

  perform public.ac_sync_attendance(p_event_id, p_user_id, false);

  if v_session.status = 'PENDING_COMMITMENTS' or v_p.payment_status = 'PAYMENT_PENDING' then
    update public.ac_session_participants
       set registration_status = 'WITHDRAWN', payment_status = 'VOIDED', cancelled_at = now()
     where id = v_p.id;
    return query select v_p.id, 'VOID'::text, v_p.stripe_payment_intent_id;
    return;
  end if;

  update public.ac_session_participants
     set registration_status = 'CANCELLED_LIABLE', cancelled_at = now()
   where id = v_p.id;
  return query select v_p.id, 'LIABLE'::text, v_p.stripe_payment_intent_id;
end;
$$;

-- Tick: payments opened but never completed release their place after
-- p_minutes. Returns the PaymentIntents to cancel.
create or replace function public.ac_release_stale_payments(p_minutes integer default 20)
returns table (participant_id uuid, stripe_payment_intent_id text)
language plpgsql
set search_path = ''
as $$
begin
  return query
  update public.ac_session_participants p
     set registration_status = 'WITHDRAWN', payment_status = 'VOIDED', cancelled_at = now()
   where p.registration_status = 'ACTIVE'
     and p.payment_status = 'PAYMENT_PENDING'
     and p.joined_at < now() - make_interval(mins => p_minutes)
  returning p.id, p.stripe_payment_intent_id;
end;
$$;

-- Tick: reservations that did not reach the minimum in time are cancelled and
-- every hold is released. Returns the PaymentIntents to cancel.
create or replace function public.ac_expire_holds()
returns table (event_id uuid, stripe_payment_intent_id text)
language plpgsql
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_user     uuid;
begin
  for v_event_id in
    select s.event_id from public.ac_court_sessions s
    where s.status = 'PENDING_COMMITMENTS' and s.hold_expires_at <= now()
    for update skip locked
  loop
    update public.ac_court_sessions s
       set status = 'CANCELLED', cancelled_at = now(),
           exception_note = null
     where s.event_id = v_event_id;
    update public.events set is_cancelled = true where id = v_event_id;

    for v_user in
      select p.user_id from public.ac_session_participants p
      where p.event_id = v_event_id and p.registration_status = 'ACTIVE'
    loop
      perform public.ac_sync_attendance(v_event_id, v_user, false);
      perform public.create_notification(
        v_user, 'BOOKING', 'Court not booked',
        'Not enough players committed in time, so the reservation was released. You have not been charged.', v_event_id
      );
    end loop;

    return query
    update public.ac_session_participants p
       set payment_status = 'VOIDED'
     where p.event_id = v_event_id
       and p.payment_status in ('PAYMENT_PENDING', 'AUTHORISED')
    returning p.event_id, p.stripe_payment_intent_id;
  end loop;
end;
$$;

-- Splits the court cost across the eligible list in integer pence. The
-- remainder pence go one each to the earliest joiners, so shares always sum
-- to the court cost exactly. Deterministic for the same frozen list.
create or replace function public.ac_compute_split(p_event_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_session public.ac_court_sessions;
  v_n       integer;
  v_base    integer;
  v_rem     integer;
begin
  select * into v_session from public.ac_court_sessions where event_id = p_event_id;
  select count(*) into v_n from public.ac_session_participants where event_id = p_event_id and eligible;
  if v_n = 0 then
    raise exception 'AC_INVALID: no eligible participants to split between';
  end if;

  v_base := v_session.court_cost_pence / v_n;
  v_rem  := v_session.court_cost_pence - v_base * v_n;

  with ranked as (
    select id, row_number() over (order by joined_at, id) as rn
    from public.ac_session_participants
    where event_id = p_event_id and eligible
  )
  update public.ac_session_participants p
     set final_share_pence = v_base + case when r.rn <= v_rem then 1 else 0 end,
         refund_pence      = p.amount_captured_pence - (v_base + case when r.rn <= v_rem then 1 else 0 end),
         payment_status    = case
                               when p.amount_captured_pence - (v_base + case when r.rn <= v_rem then 1 else 0 end) > 0
                               then 'REFUND_PENDING' else 'PAID'
                             end
    from ranked r
   where p.id = r.id;

  if exists (
    select 1 from public.ac_session_participants
    where event_id = p_event_id and eligible
      and (refund_pence < 0 or final_share_pence > commitment_pence)
  ) then
    raise exception 'AC_INVARIANT: a share exceeded the commitment for event %', p_event_id;
  end if;
end;
$$;

-- Tick: at the cutoff, freeze the list and compute shares in one step.
-- Returns status 'DEFERRED' while a hold still awaits capture (the tick
-- captures it first), otherwise 'SETTLING' and the abandoned payments to cancel.
create or replace function public.ac_close_registration(p_event_id uuid)
returns table (result text, void_payment_intent_id text)
language plpgsql
set search_path = ''
as $$
declare
  v_session public.ac_court_sessions;
  v_user    uuid;
begin
  select * into v_session from public.ac_court_sessions where event_id = p_event_id for update;
  if not found or v_session.status <> 'CONFIRMED' or now() < v_session.registration_closes_at then
    return query select 'SKIPPED'::text, null::text;
    return;
  end if;

  if exists (
    select 1 from public.ac_session_participants
    where event_id = p_event_id and payment_status = 'AUTHORISED'
  ) then
    return query select 'DEFERRED'::text, null::text;
    return;
  end if;

  update public.ac_session_participants
     set eligible = (payment_status = 'PAID' and registration_status in ('ACTIVE', 'CANCELLED_LIABLE')),
         frozen = true
   where event_id = p_event_id;

  update public.ac_court_sessions set status = 'SETTLING', closed_at = now() where event_id = p_event_id;
  perform public.ac_compute_split(p_event_id);

  for v_user in
    select user_id from public.ac_session_participants where event_id = p_event_id and eligible
  loop
    perform public.create_notification(
      v_user, 'PAYMENT', 'Registration closed',
      'The final player list is set. Any difference from your commitment is being refunded.', p_event_id
    );
  end loop;

  return query
  update public.ac_session_participants p
     set registration_status = 'WITHDRAWN', payment_status = 'VOIDED'
   where p.event_id = p_event_id and p.payment_status = 'PAYMENT_PENDING'
  returning 'SETTLING'::text, p.stripe_payment_intent_id;

  if not found then
    return query select 'SETTLING'::text, null::text;
  end if;
end;
$$;

create or replace function public.ac_set_refund_id(p_participant_id uuid, p_refund_id text)
returns void
language sql
set search_path = ''
as $$
  update public.ac_session_participants set stripe_refund_id = p_refund_id where id = p_participant_id;
$$;

-- Refund outcome from Stripe. Moves the session to COMPLETED once nothing is
-- left to refund.
create or replace function public.ac_record_refund(
  p_participant_id uuid,
  p_refund_id      text,
  p_succeeded      boolean,
  p_failure        text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_p public.ac_session_participants;
begin
  select * into v_p from public.ac_session_participants where id = p_participant_id;
  if not found then
    return;
  end if;
  perform 1 from public.ac_court_sessions where event_id = v_p.event_id for update;

  if p_succeeded then
    update public.ac_session_participants
       set payment_status = 'REFUNDED', stripe_refund_id = p_refund_id, exception_note = null
     where id = p_participant_id and payment_status in ('REFUND_PENDING', 'SETTLEMENT_EXCEPTION');
  else
    update public.ac_session_participants
       set payment_status = 'SETTLEMENT_EXCEPTION', stripe_refund_id = p_refund_id,
           exception_note = coalesce(p_failure, 'refund failed')
     where id = p_participant_id;
  end if;

  update public.ac_court_sessions s
     set status = 'COMPLETED', completed_at = now()
   where s.event_id = v_p.event_id
     and s.status = 'SETTLING'
     and not exists (
       select 1 from public.ac_session_participants p
       where p.event_id = v_p.event_id
         and p.payment_status in ('REFUND_PENDING', 'SETTLEMENT_EXCEPTION', 'AUTHORISED')
     );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: service_role only
-- ---------------------------------------------------------------------------

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.ac_touch_updated_at()',
    'public.ac_sync_attendance(uuid, uuid, boolean)',
    'public.ac_places_taken(uuid)',
    'public.ac_commitments(uuid)',
    'public.ac_create_session(uuid, uuid, text, text, timestamptz, timestamptz, integer, integer, integer)',
    'public.ac_reserve_place(uuid, uuid)',
    'public.ac_attach_payment_intent(uuid, text, text)',
    'public.ac_record_authorisation(text)',
    'public.ac_record_payment(text, integer)',
    'public.ac_mark_confirmed(uuid)',
    'public.ac_cancel_place(uuid, uuid)',
    'public.ac_release_stale_payments(integer)',
    'public.ac_expire_holds()',
    'public.ac_compute_split(uuid)',
    'public.ac_close_registration(uuid)',
    'public.ac_set_refund_id(uuid, text)',
    'public.ac_record_refund(uuid, text, boolean, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;
