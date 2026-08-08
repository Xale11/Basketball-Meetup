-- RLS for public.event_tickets.
--
-- The table had RLS enabled with zero policies, which denies everything — the
-- ticket tiers were unreadable and unwritable by any client. Flagged by the
-- database linter as `rls_enabled_no_policy`.
--
-- Ownership follows the parent event. `events` allows INSERT/UPDATE only to
-- `created_by_user_id`, so tickets use the same owner rather than inventing a
-- broader rule (e.g. society leaders) that the events table itself would not
-- honour. If event editing is widened later, widen this in the same change.

-- ── Read ────────────────────────────────────────────────────────────────────
-- Split in two so drafts stay private. `is_active` defaults to false, so a
-- newly created tier is a draft until it is explicitly published; NULL is
-- treated as not-active for the same reason.
--
-- Restricted to `authenticated`. `events` is readable by `public` (including
-- anon), but pricing and remaining stock are commercial detail and the app
-- requires a session to reach any of this.
create policy "Authed users can read active ticket tiers"
  on public.event_tickets
  for select
  to authenticated
  using (is_active is true);

create policy "Organisers can read their own ticket tiers"
  on public.event_tickets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_tickets.event_id
        and e.created_by_user_id = auth.uid()
    )
  );

-- ── Write ───────────────────────────────────────────────────────────────────
-- The WITH CHECK on insert/update re-tests ownership of the *target* event, so
-- a tier cannot be created against — or moved onto — someone else's event.
create policy "Organisers can create ticket tiers"
  on public.event_tickets
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_tickets.event_id
        and e.created_by_user_id = auth.uid()
    )
  );

create policy "Organisers can update their ticket tiers"
  on public.event_tickets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_tickets.event_id
        and e.created_by_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_tickets.event_id
        and e.created_by_user_id = auth.uid()
    )
  );

create policy "Organisers can delete their ticket tiers"
  on public.event_tickets
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_tickets.event_id
        and e.created_by_user_id = auth.uid()
    )
  );

-- Every policy filters by event_id; without this each check is a seq scan.
create index if not exists event_tickets_event_id_idx
  on public.event_tickets (event_id);
