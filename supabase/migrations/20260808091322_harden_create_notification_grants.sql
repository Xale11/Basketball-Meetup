-- Fixes a hole in the `notifications` migration.
--
-- `create_notification` is SECURITY DEFINER and inserts a row asserting that
-- something happened to a given user. It was revoked from PUBLIC and
-- authenticated, but Supabase additionally grants EXECUTE on public-schema
-- functions to `anon` and `authenticated` by default, and a revoke from PUBLIC
-- does not remove those explicit role grants. The function was therefore
-- reachable unauthenticated via /rest/v1/rpc/create_notification, which would
-- let anyone fabricate a notification for any user.
--
-- Caught by the database linter (`anon_security_definer_function_executable`).
-- Same remedy as `harden_definer_functions_role_grants` applied to the earlier
-- definer functions: revoke per-role, then grant only to service_role.

revoke all on function public.create_notification(uuid, text, text, text, uuid, text) from anon;
revoke all on function public.create_notification(uuid, text, text, text, uuid, text) from authenticated;
revoke all on function public.create_notification(uuid, text, text, text, uuid, text) from public;

grant execute on function public.create_notification(uuid, text, text, text, uuid, text) to service_role;
