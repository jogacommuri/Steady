-- Steady — Supabase schema for Phase 3 sync.
--
-- Run this in the Supabase SQL editor (or via the CLI) against a new project.
-- It creates the three tracker tables mirroring the local SQLite schema, plus
-- row-level security so each authenticated user only ever sees their own rows,
-- and adds the tables to the realtime publication.
--
-- Auth: the app signs in anonymously by default (v1). Anonymous users are real
-- auth users, so auth.uid() is populated and RLS works. To sync a phone and a
-- tablet, sign both into the SAME account (magic link) — see lib/supabase.ts.

-- Enable anonymous sign-ins under Authentication → Providers in the dashboard,
-- or with the Management API. RLS below applies to anonymous users too.

-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       text not null,
  meal_type  text not null,
  time       text not null,
  text       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_meals_user_updated
  on public.meals (user_id, updated_at);

-- ---------------------------------------------------------------------------
-- weights
-- ---------------------------------------------------------------------------
create table if not exists public.weights (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       text not null,
  value      double precision not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_weights_user_updated
  on public.weights (user_id, updated_at);

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id           uuid primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         text not null,
  workout_type text not null,
  duration     integer not null default 0,
  text         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists idx_workouts_user_updated
  on public.workouts (user_id, updated_at);

-- ---------------------------------------------------------------------------
-- Row-level security: owner-only access.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['meals', 'weights', 'workouts'] loop
    execute format('alter table public.%I enable row level security;', t);

    execute format($p$
      create policy %1$I on public.%1$I
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    $p$, t);
  end loop;
exception
  when duplicate_object then null; -- policies already exist
end $$;

-- ---------------------------------------------------------------------------
-- Realtime: broadcast row changes so other devices update live.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.meals;
  alter publication supabase_realtime add table public.weights;
  alter publication supabase_realtime add table public.workouts;
exception
  when duplicate_object then null; -- already in the publication
end $$;
