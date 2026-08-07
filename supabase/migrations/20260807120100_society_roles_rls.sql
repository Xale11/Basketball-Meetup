-- society_roles is a small reference/lookup table (id, name) that had RLS
-- enabled with no policies, making it unreadable by the client.
--
-- Read-only for signed-in users; it is only ever written by a migration.

alter table public.society_roles enable row level security;

create policy "Enable read access for all authed users"
  on public.society_roles
  for select
  to authenticated
  using (true);
