-- Hardens the SECURITY DEFINER functions flagged by the Supabase security
-- advisors.
--
-- Note on grants: Postgres grants EXECUTE to PUBLIC by default, and both `anon`
-- and `authenticated` inherit from PUBLIC. Revoking from `anon` alone would do
-- nothing — the grant has to be dropped from PUBLIC and then re-granted to the
-- roles that genuinely need it.

-- 1. create_event: dead AND broken. It inserts into events(title) and
--    event_universities, but the events table has no `title` column (it is
--    `name`) and the join table is actually spelled `event_univetsities`. The
--    app never calls it — api/events.api.ts createEvent() inserts directly.
--    It was also SECURITY DEFINER with a mutable search_path and callable by
--    anon over /rest/v1/rpc/.
drop function if exists public.create_event(text, text, uuid, uuid);

-- 2. rls_auto_enable: an event-trigger function. Postgres will not let it be
--    invoked directly over RPC, so the advisor finding is not exploitable as
--    described — but it has no business being grantable either. Event triggers
--    fire as the trigger owner and need no EXECUTE grant.
revoke all on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- 3. get_event_going_count: must stay executable by `authenticated`, because it
--    is called from inside the event_participants INSERT policy and policy
--    expressions are evaluated with the caller's privileges — revoking it from
--    authenticated would break joining events. Only anon loses access.
--
--    This means the "Signed-In Users Can Execute SECURITY DEFINER Function"
--    advisor will keep flagging it. That is a deliberate, required exception.
revoke all on function public.get_event_going_count(uuid) from public;
revoke execute on function public.get_event_going_count(uuid) from anon;
grant execute on function public.get_event_going_count(uuid) to authenticated, service_role;
