-- event_images had RLS enabled but ZERO policies, which is deny-all.
--
-- This was not theoretical: api/events.api.ts createEvent() inserts gallery
-- rows into this table and only *logs* the resulting error, so every event
-- gallery image has been silently failing to save.
--
-- Read access mirrors the `events` table (publicly readable). Writes are
-- restricted to the user who created the parent event.

alter table public.event_images enable row level security;

create policy "Enable read access for all users"
  on public.event_images
  for select
  to public
  using (true);

create policy "Event owner can add images"
  on public.event_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id
        and e.created_by_user_id = auth.uid()
    )
  );

create policy "Event owner can update images"
  on public.event_images
  for update
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id
        and e.created_by_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id
        and e.created_by_user_id = auth.uid()
    )
  );

create policy "Event owner can delete images"
  on public.event_images
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id
        and e.created_by_user_id = auth.uid()
    )
  );
