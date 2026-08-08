-- AC-23 · Notifications.
--
-- Backs the header bell's unread count and the notifications screen. Until now
-- the bell showed a stand-in count derived from friend requests + event invites.
--
-- NOTE: the EXECUTE grants set up at the bottom of this file are incomplete —
-- see 20260808091322_harden_create_notification_grants.sql, which closes a hole
-- where `anon` retained EXECUTE on create_notification.

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on update cascade on delete cascade,
  type       text not null,
  title      text not null,
  message    text not null,
  read       boolean not null default false,
  event_id   uuid references public.events(id) on update cascade on delete cascade,
  society_id text references public.societies(id) on update cascade on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in ('INVITE','REMINDER','JOIN','SOCIETY','ANNOUNCEMENT')
  );

-- Every read is "my notifications, newest first"; the partial index serves the
-- unread badge without scanning read rows.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read = false;

alter table public.notifications enable row level security;

create policy "Users can read their own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- Marking read/unread is the only field a client has any business changing.
-- Postgres has no column-level RLS, so the WITH CHECK re-asserts ownership and
-- the rest is protected by withholding INSERT (below).
create policy "Users can mark their own notifications read"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own notifications"
  on public.notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Deliberately NO insert policy for `authenticated`.
--
-- A notification is a claim about something that happened ("X invited you"). If
-- clients could insert, any user could fabricate one for anybody else. Rows are
-- created server-side instead, via the SECURITY DEFINER helper below, which
-- callers reach only through triggers or edge functions running as the service
-- role.
create or replace function public.create_notification(
  p_user_id    uuid,
  p_type       text,
  p_title      text,
  p_message    text,
  p_event_id   uuid default null,
  p_society_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, message, event_id, society_id)
  values (p_user_id, p_type, p_title, p_message, p_event_id, p_society_id)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, uuid, text) from public;
revoke all on function public.create_notification(uuid, text, text, text, uuid, text) from authenticated;
grant execute on function public.create_notification(uuid, text, text, text, uuid, text) to service_role;
