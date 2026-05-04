# Quickstart: AI Topic Summarizer

## 1. Install the app scaffold

Create a new Next.js App Router project with TypeScript and Tailwind CSS at the
repository root, then install the project dependencies:

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `zod`
- `jspdf`
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `playwright`

## 2. Configure environment variables

Create `.env.local` with these values:

```bash
OPENROUTER_API_KEY=...
BRAVE_SEARCH_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is not required for the MVP plan. Add it only if
the rate-limit implementation later moves away from the authenticated RPC
approach.

## 3. Enable Supabase email/password auth

In Supabase:

1. Enable email/password sign-in.
2. Configure the site URL and local redirect URL for your Vercel and local dev
   environments.
3. Keep summary storage out of the database; only create the rate-limit schema
   below.

## 4. Create the rate-limit table and RPC

Run SQL similar to the following in Supabase migrations:

```sql
create table if not exists public.daily_summary_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date),
  constraint daily_summary_usage_count_check
    check (request_count >= 0 and request_count <= 10)
);

alter table public.daily_summary_usage enable row level security;

create policy "users can read own daily usage"
on public.daily_summary_usage
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.consume_daily_summary_quota()
returns table(allowed boolean, request_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
begin
  if v_user_id is null then
    return query select false, 0;
    return;
  end if;

  insert into public.daily_summary_usage (user_id, usage_date, request_count)
  values (v_user_id, v_today, 1)
  on conflict (user_id, usage_date)
  do update
    set request_count = public.daily_summary_usage.request_count + 1,
        updated_at = now();

  return query
  select (request_count <= 10) as allowed, request_count
  from public.daily_summary_usage
  where user_id = v_user_id and usage_date = v_today;
end;
$$;

grant execute on function public.consume_daily_summary_quota() to authenticated;
```

If you prefer, clamp over-limit updates inside the function body so counts do
not increment past 10. The implementation task should finalize that exact SQL
shape.

## 5. Build the app structure

Create:

- `app/page.tsx` for the main topic summarizer page
- `app/api/me/route.ts`
- `app/api/summarize/route.ts`
- `middleware.ts`
- `components/` modules for auth, controls, layout, and output
- `lib/` modules for auth, validation, Brave Search, OpenRouter, rate limiting,
  PDF export, and summary context building

## 6. Implement the summarize route

`POST /api/summarize` should:

1. Validate the Supabase session from cookies.
2. Validate topic, mode, length, language, and model allowlist.
3. Consume the user's daily quota.
4. Call Brave Search with 10 English web results.
5. Normalize results into compact internal context.
6. Reject weak results with a user-facing "try a more specific topic" error.
7. Call OpenRouter with the strict system prompt.
8. Return only the generated output string in JSON.

## 7. Implement the client flow

On the main page:

1. Show sign-in/sign-out in the top-right.
2. Keep the topic input as the only content input.
3. Render model selector, mode tabs, English-only selector, and length slider.
4. Disable duplicate submissions while loading.
5. Render empty, loading, error, and success states in the right card.
6. Enable PDF download only when current output exists.

## 8. Generate the PDF on the client

Use `jspdf` to export the current generated text as `topic-summary.pdf`. The
download action should read from the current in-memory output only and must not
fetch saved summary history.

## 9. Verify the happy path

1. Start the app locally.
2. Sign up or sign in with email/password.
3. Enter a topic.
4. Choose a model, mode, and length.
5. Generate an output.
6. Download `topic-summary.pdf`.
7. Refresh the page and confirm the summary is gone.

## 10. Deploy to Vercel

### Environment variables

Add these four variables in **Vercel → Settings → Environment Variables** for
Production and Preview environments:

| Variable | Where |
|----------|-------|
| `OPENROUTER_API_KEY` | Production, Preview |
| `BRAVE_SEARCH_API_KEY` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |

`OPENROUTER_API_KEY` and `BRAVE_SEARCH_API_KEY` are server-only secrets — do
**not** prefix them with `NEXT_PUBLIC_`.

### Supabase callback URLs

In the Supabase dashboard under **Authentication → URL Configuration**:

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**:
  - `https://<your-app>.vercel.app/**`
  - `http://localhost:3000/**`
  - `https://<project>-*.vercel.app/**` _(optional: enables auth in preview branches)_

### Deployment steps

1. Push the repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Vercel auto-detects Next.js — no build-command changes required.
4. Add the four environment variables.
5. Click **Deploy** and wait for the build to finish.
6. Copy the production URL and update Supabase **Site URL** and **Redirect URLs**.
7. Navigate to the production URL, sign in, generate a summary, and download the PDF to confirm the full flow works.
