-- Courts move from Firestore to Supabase (Basketball Meetup only).
--
-- The TS `Court` type nests `location` and `opening_hours`. Location is
-- flattened into columns so it can be indexed and queried by proximity;
-- opening_hours stays jsonb because it is read as a whole and never filtered on.

create table if not exists public.courts (
  id                uuid primary key default gen_random_uuid(),
  name              varchar not null,
  description       varchar not null default '',
  address           varchar not null,
  latitude          double precision not null,
  longitude         double precision not null,
  geohash           varchar not null,
  images            text[] not null default '{}',
  tags              text[] not null default '{}',
  checked_in_users  uuid[] not null default '{}',
  followers         uuid[] not null default '{}',
  opening_hours     jsonb not null,
  created_by        uuid not null references public.profiles(id) on delete cascade,
  rating            numeric,
  verified          boolean not null default false,
  created_at        timestamptz not null default now()
);

-- geohash prefix matching is how nearby-court lookups will be done.
create index if not exists courts_geohash_idx on public.courts (geohash);
create index if not exists courts_created_by_idx on public.courts (created_by);

alter table public.courts enable row level security;

-- Courts are a public directory, same as events.
create policy "Enable read access for all users"
  on public.courts
  for select
  to public
  using (true);

create policy "Authenticated users can add courts"
  on public.courts
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Court creator can update their court"
  on public.courts
  for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "Court creator can delete their court"
  on public.courts
  for delete
  to authenticated
  using (auth.uid() = created_by);

-- Court photos. Public-read like the other image buckets; writes are scoped to
-- a per-user folder so the path itself carries the ownership check.
-- Object paths are `<user_id>/<court_id>/<n>.<ext>`.
insert into storage.buckets (id, name, public)
values ('court_images', 'court_images', true)
on conflict (id) do nothing;

create policy "Court images are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'court_images');

create policy "Users can upload court images to their own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'court_images'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

create policy "Users can update their own court images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'court_images'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

create policy "Users can delete their own court images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'court_images'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );
