# Implementation Plan: AI Topic Summarizer

**Branch**: `[001-topic-summarizer]` | **Date**: 2026-05-04 | **Spec**:
[spec.md](./spec.md)  
**Input**: Feature specification from
`/specs/001-topic-summarizer/spec.md`

**Note**: This plan covers Phase 0 research and Phase 1 design artifacts for an
initial greenfield build of the AI Topic Summarizer.

## Summary

Build a single-page Next.js App Router experience on Vercel where authenticated
users sign in with Supabase, submit one topic, choose an allowlisted OpenRouter
free model, pick one of five output modes, adjust a length slider, and receive
one grounded English-only summary generated from the top 10 Brave Search web
results. The server owns all third-party secrets, validates the request,
enforces a daily quota, prepares compact search context, calls OpenRouter, and
returns only the generated output. The client renders the output in the right
panel and exports the current visible result to `topic-summary.pdf` without
persisting summaries.

## Technical Context

**Language/Version**: TypeScript 5.x with current stable Next.js App Router on
the Vercel-supported Node.js LTS runtime  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS,
`@supabase/ssr`, `@supabase/supabase-js`, Brave Search Web Search API,
OpenRouter Chat Completions API, `jspdf` for client-side PDF export, `zod` for
request validation  
**Storage**: No summary persistence; browser memory only for the current output.
Optional Supabase Postgres table and SQL function for rate limiting only  
**Testing**: Vitest for unit and route-handler tests, Playwright for end-to-end
flows, plus lightweight component tests where useful  
**Target Platform**: Responsive web app for modern desktop and mobile browsers  
**Project Type**: Next.js web application with App Router pages, middleware,
and Route Handlers  
**Performance Goals**: Show loading feedback immediately, keep normal summary
requests within acceptable third-party latency, and return actionable failures
when providers are slow or weak  
**Constraints**: English only, topic-only input, top 10 Brave results,
server-side API keys only, allowlisted OpenRouter free models only, no
citations, no visible URLs, no upload controls, no URL input, no share action,
no copy action, no summary history, no placeholder UI  
**Scale/Scope**: One signed-in user session at a time, one current output in
client state, five output modes, 10 summaries per user per day for MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Server/client boundaries keep Brave Search and OpenRouter secrets on the
      server only through Route Handlers and server-only integration modules.
- [x] The feature requires Supabase-authenticated access before generation or
      download behavior is available.
- [x] The plan preserves live search on the top 10 results and uses only the
      approved model allowlist, with `openai/gpt-oss-120b:free` as default.
- [x] The design does not persist generated summaries beyond temporary browser
      state needed for rendering or PDF export.
- [x] The UI keeps the approved scope: English-only selector, short/long
      control, five output modes, download button only, and no citations, share,
      or copy actions.
- [x] Loading, empty, error, unauthorized, and rate-limited states are fully
      specified for desktop and mobile layouts.
- [x] Validation covers all visible controls and at least one negative path for
      summary generation and PDF export.

**Gate Result**: PASS. No constitution violations are required for this design.

## Project Structure

### Documentation (this feature)

```text
specs/001-topic-summarizer/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- http-api.yaml
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- api/
|   |-- me/
|   |   `-- route.ts
|   `-- summarize/
|       `-- route.ts
|-- globals.css
|-- layout.tsx
`-- page.tsx

components/
|-- auth/
|   |-- auth-card.tsx
|   `-- sign-out-button.tsx
|-- controls/
|   |-- length-slider.tsx
|   |-- model-selector.tsx
|   |-- mode-tabs.tsx
|   |-- summarize-form.tsx
|   `-- topic-input.tsx
|-- layout/
|   |-- app-shell.tsx
|   |-- brand-header.tsx
|   `-- hero.tsx
`-- output/
    |-- empty-state.tsx
    |-- output-card.tsx
    |-- output-content.tsx
    `-- output-status.tsx

lib/
|-- auth/
|   |-- browser.ts
|   |-- middleware.ts
|   `-- server.ts
|-- brave-search/
|   |-- client.ts
|   `-- normalize-results.ts
|-- openrouter/
|   |-- allowlist.ts
|   |-- client.ts
|   `-- prompt.ts
|-- pdf/
|   `-- download-summary-pdf.ts
|-- rate-limit/
|   |-- consume-daily-quota.ts
|   `-- types.ts
|-- summaries/
|   |-- build-context.ts
|   `-- map-length.ts
`-- validation/
    |-- summarize-request.ts
    `-- topic.ts

public/
`-- logo.svg

supabase/
`-- migrations/
    `-- [timestamp]_daily_summary_usage.sql

tests/
|-- e2e/
|   |-- auth.spec.ts
|   |-- summarize.spec.ts
|   `-- pdf-download.spec.ts
|-- integration/
|   |-- me-route.test.ts
|   `-- summarize-route.test.ts
`-- unit/
    |-- build-context.test.ts
    |-- map-length.test.ts
    `-- topic-validation.test.ts

middleware.ts
```

**Structure Decision**: Use a single App Router project at the repository root.
There is no server PDF route because PDF creation happens on the client from the
current rendered output. A small `supabase/migrations/` folder is included only
for rate-limit schema and function management.

## Phase 0: Research Summary

- Use Supabase SSR helpers with cookie-based auth refresh via `middleware.ts`
  and Route Handlers, rather than a custom auth abstraction.
- Keep `GET /api/me` as a thin authenticated session endpoint because the user
  explicitly allowed it and it simplifies client bootstrap plus automated tests.
- Use Brave Web Search `GET /res/v1/web/search` with `count=10`,
  `search_lang=en`, `ui_lang=en-US`, `country=US`, and spellcheck enabled.
- Centralize the OpenRouter model allowlist in one server module so retiring
  models can be removed quickly without broad UI rewrites.
- Avoid `SUPABASE_SERVICE_ROLE_KEY` in MVP by using an authenticated RPC for
  atomic daily quota consumption on a dedicated rate-limit table.
- Generate PDFs client-side with `jspdf` from the current output text rather
  than adding a server export route.

## Phase 1: Design Summary

### UI Architecture

- `app/page.tsx` renders the overall marketing-style shell and mounts a client
  control surface for auth, inputs, and output state.
- The left card contains topic input, model selector, mode tabs, locked English
  selector, length slider, and summarize button.
- The right card contains output mode tabs, empty/loading/error/success states,
  and the only post-generation action: PDF download.
- Tailwind tokens in `app/globals.css` define the lavender background, rounded
  white cards, pill badges, and responsive spacing needed to match the approved
  screenshot.

### Request Pipeline

1. The client validates obvious empty input and posts `{ topic, model, mode,
   length, language: "en" }` to `POST /api/summarize`.
2. The route handler verifies the Supabase session from cookies.
3. The handler validates the request with Zod, including topic-only input and
   model allowlist checks.
4. The handler consumes one unit from the user's daily quota through a Supabase
   RPC backed by a rate-limit table.
5. The handler queries Brave Search for up to 10 English web results.
6. The handler normalizes titles, snippets, descriptions, and URLs into a
   compact internal context block and rejects weak-result sets.
7. The handler calls OpenRouter with a strict system prompt that forbids
   citations, URLs, non-English output, and invented facts.
8. The handler returns `{ output: string }` only.
9. The client stores the output in local component state and exposes download as
   `topic-summary.pdf`.

### Auth and Session Handling

- Supabase email/password auth is handled with browser and server clients from
  `@supabase/ssr`.
- `middleware.ts` refreshes auth cookies for App Router requests.
- `GET /api/me` returns a minimal authenticated user snapshot for client
  bootstrap and integration tests.
- `POST /api/summarize` remains the source of truth for authorization regardless
  of client state.

### Validation and Error Strategy

- Topic validation trims whitespace, rejects empty strings, rejects obvious
  URL-only input, and limits length to a reasonable topic-sized payload.
- Search failures, weak search results, model failures, and rate-limit blocks
  become user-readable errors with stable error codes.
- Duplicate summarize clicks while a request is in flight are prevented on the
  client and rechecked on the server only as normal idempotent requests.

### Output and Prompt Strategy

- A server-side prompt builder injects mode and length instructions plus the
  cleaned search context.
- Mind Map mode returns nested bullet text.
- Meme mode returns short meme-style text only, not an image.
- The length slider is represented as a `0-100` integer and mapped server-side
  to five verbosity bands with matching token budgets.

## Post-Design Constitution Check

- [x] Secrets remain server-side only.
- [x] Auth gating is enforced before summary generation and download.
- [x] Search uses live top-10 results with the approved allowlist.
- [x] Summary data stays ephemeral and is not stored in Supabase.
- [x] UI scope stays within the approved screenshot-aligned control set.
- [x] Error, empty, loading, unauthorized, and rate-limited states are designed.
- [x] Test coverage targets critical visible controls and negative flows.

## Complexity Tracking

No constitution exceptions are planned. The dedicated rate-limit table and RPC
are accepted complexity because Vercel-hosted Route Handlers need durable,
atomic daily quota enforcement without storing summaries.
