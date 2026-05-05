-- Migration: summary_history
-- Purpose : Store per-user summary history so users can review past summaries.

-- ─── Table ────────────────────────────────────────────────────────────────────

create table if not exists public.summary_history (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  topic      text        not null,
  mode       text        not null,
  model      text        not null,
  length     text        not null,
  output     text        not null,
  created_at timestamptz not null default now()
);

-- ─── Index for fast per-user lookups ─────────────────────────────────────────

create index if not exists summary_history_user_id_created_at_idx
  on public.summary_history (user_id, created_at desc);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

alter table public.summary_history enable row level security;

-- Users may only read their own rows.
create policy "users can read own summary history"
  on public.summary_history
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users may only insert their own rows.
create policy "users can insert own summary history"
  on public.summary_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users may delete their own rows.
create policy "users can delete own summary history"
  on public.summary_history
  for delete
  to authenticated
  using (auth.uid() = user_id);
