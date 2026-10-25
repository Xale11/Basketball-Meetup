-- ActivCampus · court booking: complete straight away when nothing is owed.
--
-- A session that closes with exactly the minimum number of players has no
-- refunds to wait for, but it only reached COMPLETED via ac_record_refund, so
-- it stayed in SETTLING forever. ac_compute_split (called only from
-- ac_close_registration) now finishes the session itself in that case.

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

  update public.ac_court_sessions s
     set status = 'COMPLETED', completed_at = now()
   where s.event_id = p_event_id
     and s.status = 'SETTLING'
     and not exists (
       select 1 from public.ac_session_participants p
       where p.event_id = p_event_id
         and p.payment_status in ('REFUND_PENDING', 'SETTLEMENT_EXCEPTION', 'AUTHORISED')
     );
end;
$$;

revoke all on function public.ac_compute_split(uuid) from public, anon, authenticated;
grant execute on function public.ac_compute_split(uuid) to service_role;
