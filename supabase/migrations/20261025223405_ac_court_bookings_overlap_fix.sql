-- ActivCampus · court booking: overlap check fix.
--
-- ac_create_session built tstzrange(e.start_date, e.end_date) for the overlap
-- test. Postgres may evaluate that for events rows outside the join, and some
-- older events end before they start, which raises "range lower bound must be
-- less than or equal to range upper bound". Compare the bounds directly.

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
      -- Plain comparison rather than tstzrange: some older events rows end
      -- before they start, and building a range from them raises an error.
      and e.start_date < p_ends_at
      and e.end_date > p_starts_at
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
revoke all on function public.ac_create_session(uuid, uuid, text, text, timestamptz, timestamptz, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.ac_create_session(uuid, uuid, text, text, timestamptz, timestamptz, integer, integer, integer) to service_role;
