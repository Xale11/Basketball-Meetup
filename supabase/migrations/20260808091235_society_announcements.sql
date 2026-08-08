-- AC-24 · Society announcements.
--
-- Backs the Announcements tab on the society detail screen, which until now
-- rendered a "coming soon" empty state because there was nowhere to read from.

create table if not exists public.society_announcements (
  id           uuid primary key default gen_random_uuid(),
  society_id   text not null references public.societies(id) on update cascade on delete cascade,
  author_id    uuid not null references public.profiles(id)  on update cascade on delete cascade,
  title        text not null,
  content      text not null,
  is_important boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

-- The tab lists one society's announcements newest-first.
create index if not exists society_announcements_society_created_idx
  on public.society_announcements (society_id, created_at desc);

alter table public.society_announcements enable row level security;

-- Readable by any authenticated user, matching how societies and their events
-- are already exposed — announcements are notices, not private correspondence.
create policy "Authed users can read announcements"
  on public.society_announcements
  for select
  to authenticated
  using (true);

-- Only that society's leadership may post, and only as themselves: `author_id`
-- is pinned to auth.uid() so a leader cannot attribute a post to someone else.
create policy "Leaders can post announcements"
  on public.society_announcements
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.society_memberships sm
      where sm.society_id = society_announcements.society_id
        and sm.user_id = auth.uid()
        and sm.role_id in ('OWNER','PRESIDENT','EXEC')
    )
  );

-- An author may edit their own post while they still hold a leadership role.
create policy "Authors can edit their announcements"
  on public.society_announcements
  for update
  to authenticated
  using (
    author_id = auth.uid()
    and exists (
      select 1
      from public.society_memberships sm
      where sm.society_id = society_announcements.society_id
        and sm.user_id = auth.uid()
        and sm.role_id in ('OWNER','PRESIDENT','EXEC')
    )
  )
  with check (author_id = auth.uid());

-- Deletion is broader than editing: any current leader can remove a post,
-- including one left behind by a since-departed committee member.
create policy "Leaders can delete announcements"
  on public.society_announcements
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.society_memberships sm
      where sm.society_id = society_announcements.society_id
        and sm.user_id = auth.uid()
        and sm.role_id in ('OWNER','PRESIDENT','EXEC')
    )
  );
