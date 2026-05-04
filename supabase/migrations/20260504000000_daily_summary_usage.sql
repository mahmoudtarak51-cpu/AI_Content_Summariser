-- Migration: daily_summary_usage
-- Purpose : Durable per-user daily quota enforcement for the MVP
--           (max 10 summaries per user per calendar day).
-- Notes   : No summary content is stored here — only request counts.

-- ─── Table ────────────────────────────────────────────────────────────────────

create table if not exists public.daily_summary_usage (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  usage_date    date        not null,
  request_count integer     not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, usage_date),
  constraint daily_summary_usage_count_check
    check (request_count >= 0 and request_count <= 10)
);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

alter table public.daily_summary_usage enable row level security;

-- Users may only read their own rows (for quota display if needed).
create policy "users can read own daily usage"
  on public.daily_summary_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes go exclusively through the security-definer RPC below.

-- ─── Atomic quota-consume RPC ─────────────────────────────────────────────────

create or replace function public.consume_daily_summary_quota()
returns table(allowed boolean, request_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today   date := current_date;
  v_count   integer;
begin
  -- Reject unauthenticated callers immediately.
  if v_user_id is null then
    return query select false, 0;
    return;
  end if;

  -- Read current count (if any) before incrementing.
  select request_count
    into v_count
    from public.daily_summary_usage
   where user_id = v_user_id
     and usage_date = v_today;

  -- If already at the limit, refuse without incrementing.
  if v_count >= 10 then
    return query select false, v_count;
    return;
  end if;

  -- Atomic upsert: insert first row at 1, or increment an existing one.
  insert into public.daily_summary_usage (user_id, usage_date, request_count)
  values (v_user_id, v_today, 1)
  on conflict (user_id, usage_date)
  do update
    set request_count = public.daily_summary_usage.request_count + 1,
        updated_at    = now()
  where public.daily_summary_usage.request_count < 10;

  -- Return the new count and whether the call was allowed.
  return query
    select (dsu.request_count <= 10) as allowed, dsu.request_count
      from public.daily_summary_usage dsu
     where dsu.user_id = v_user_id
       and dsu.usage_date = v_today;
end;
$$;

grant execute on function public.consume_daily_summary_quota() to authenticated;
