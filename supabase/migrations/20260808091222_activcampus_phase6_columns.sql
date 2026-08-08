-- Phase 6 column additions for the ActivCampus redesign.
-- All additive and nullable (or defaulted), so existing rows and the currently
-- deployed client stay valid without a backfill.

-- ── AC-21 · Activity category & tags ────────────────────────────────────────
-- The Discover feed's category strip and the card's tag pills had no column to
-- read from, so both were built behind a flag.
alter table public.events
  add column if not exists category text,
  add column if not exists tags     text[] not null default '{}';

-- Constrained in the database rather than only in TypeScript: `category` drives
-- a filter, so an unexpected value silently empties the feed instead of erroring.
alter table public.events
  drop constraint if exists events_category_check;
alter table public.events
  add constraint events_category_check check (
    category is null or category in (
      'Sports','Social','Academic','Creative',
      'Gaming','Cultural','Careers','Other'
    )
  );

-- Feed filters by category, and by tag containment.
create index if not exists events_category_idx on public.events (category);
create index if not exists events_tags_idx     on public.events using gin (tags);

-- ── AC-22 · Profile interests ───────────────────────────────────────────────
alter table public.profiles
  add column if not exists interests text[] not null default '{}';

-- ── AC-26 · Degree and year of study ────────────────────────────────────────
-- `course` already exists and is kept; these sit alongside it for the profile
-- header's "{degree} ({year})" line.
alter table public.profiles
  add column if not exists degree         text,
  add column if not exists year_of_study  text;

-- ── AC-25 · Society banner & verification ───────────────────────────────────
-- `verified_official` is NOT NULL DEFAULT false: a society is unverified until
-- something explicitly says otherwise, and a null would render as a missing tick
-- rather than an absent one.
alter table public.societies
  add column if not exists banner_url        text,
  add column if not exists verified_official boolean not null default false;
