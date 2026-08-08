-- Task Map: tasks table + RLS
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  deadline timestamptz not null,
  estimated_minutes integer not null,
  importance integer not null check (importance >= 0 and importance <= 100),
  category text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_completed_idx on public.tasks (user_id, completed);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
  on public.tasks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks
  for delete
  to authenticated
  using (auth.uid() = user_id);
