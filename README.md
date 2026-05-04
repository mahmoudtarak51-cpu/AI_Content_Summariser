# AI Content Summariser

An AI-powered topic summariser built with Next.js, Supabase, Brave Search, and
OpenRouter. Authenticated users can generate grounded, web-sourced summaries in
multiple formats and export them as a PDF.

## Features

- Email/password authentication via Supabase
- Five output modes: Summary, Bullet List, One Liner, Mind Map, Meme
- Adjustable summary length (short → long)
- Multiple AI models via OpenRouter allowlist
- Rate-limited to 10 summaries per user per day
- Client-side PDF export (`topic-summary.pdf`)

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20 |
| npm | 10 |

## Environment Variables

### Local development (`.env.local`)

```bash
# OpenRouter API key — server-only secret, never expose to the client
OPENROUTER_API_KEY=sk-or-...

# Brave Search API key — server-only secret
BRAVE_SEARCH_API_KEY=BSA...

# Supabase project URL — safe to expose (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co

# Supabase anon/public key — safe to expose (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`SUPABASE_SERVICE_ROLE_KEY` is **not** required; rate-limiting uses the
authenticated Supabase RPC which runs as the calling user.

### Vercel deployment

Add the same four variables in the Vercel project dashboard under
**Settings → Environment Variables**. Set each one for the **Production**,
**Preview**, and **Development** environments as appropriate.

| Variable | Environment |
|----------|------------|
| `OPENROUTER_API_KEY` | Production, Preview |
| `BRAVE_SEARCH_API_KEY` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |

## Supabase Configuration

### Auth callback URLs

In the Supabase dashboard under **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `https://<your-app>.vercel.app` |
| **Redirect URLs** | `https://<your-app>.vercel.app/**` |
| | `http://localhost:3000/**` |

Add each Vercel Preview deployment domain to **Redirect URLs** if you want
auth to work in preview branches (e.g. `https://<project>-*.vercel.app/**`).

### Email/password auth

Enable **Email** provider under **Authentication → Providers**.

### Database migration

Run the migration in `supabase/migrations/` to create the rate-limit table and
RPC:

```bash
npx supabase db push
```

Or apply the SQL manually in the Supabase SQL Editor.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
# Unit and integration tests
npm test

# Linting
npm run lint

# End-to-end tests (requires a running dev server)
npx playwright test
```

## Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Vercel auto-detects Next.js — no build command changes needed.
4. Add the four environment variables listed above.
5. Click **Deploy**.

After the first successful deployment, copy the production URL (e.g.
`https://ai-content-summariser.vercel.app`) and:

- Set it as the **Site URL** in Supabase Auth settings.
- Add `https://ai-content-summariser.vercel.app/**` to **Redirect URLs**.

### Verifying production

1. Navigate to the deployed URL.
2. Sign up or sign in with email/password.
3. Enter a topic and generate a summary.
4. Download `topic-summary.pdf`.
5. Refresh the page and confirm the output is cleared.

## Production Verification

> **Status**: pending first deployment — update this section after the Vercel deployment is live.

Once deployed, run through the following checklist and record results here:

| Step | Expected | Result |
|------|----------|--------|
| Load production URL | App loads, sign-in form visible | — |
| Sign up with email/password | Redirected to summarizer | — |
| Enter topic "Quantum computing overview", click Summarize | Summary text appears | — |
| Download PDF | `topic-summary.pdf` file saved, non-zero size | — |
| Refresh page | Output cleared, empty state shown | — |
| Sign out | Sign-in form shown again | — |
| Submit 10 summaries in one day | 11th request returns daily limit error | — |

