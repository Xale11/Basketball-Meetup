-- Lets an organiser delete their own event.
--
-- Two things blocked this:
--   1. `events` had INSERT/SELECT/UPDATE policies but no DELETE, so a delete
--      matched zero rows and failed silently.
--   2. Four child tables referenced events with ON DELETE RESTRICT, so the
--      delete would have been rejected by the database anyway the moment the
--      event had a single participant — which, with auto-join, is always.
--
-- The children are all rows *about* the event; none of them mean anything once
-- it is gone, so they cascade. `event_invites`, `event_societies` and
-- `notifications` already did.

alter table public.event_participants
  drop constraint event_participants_event_id_fkey,
  add constraint event_participants_event_id_fkey
    foreign key (event_id) references public.events(id)
    on update cascade on delete cascade;

alter table public.event_images
  drop constraint event_images_event_id_fkey,
  add constraint event_images_event_id_fkey
    foreign key (event_id) references public.events(id)
    on update cascade on delete cascade;

alter table public.event_tickets
  drop constraint event_tickets_event_id_fkey,
  add constraint event_tickets_event_id_fkey
    foreign key (event_id) references public.events(id)
    on update cascade on delete cascade;

alter table public.event_univetsities
  drop constraint event_univetsities_event_id_fkey,
  add constraint event_univetsities_event_id_fkey
    foreign key (event_id) references public.events(id)
    on update cascade on delete cascade;

-- Only the creator may delete, mirroring the existing UPDATE policy's owner
-- check. Society leaders are deliberately not included: `events` does not let
-- them edit either, and delete should not be the looser permission.
create policy "Organisers can delete their own events"
  on public.events
  for delete
  to authenticated
  using (auth.uid() = created_by_user_id);
