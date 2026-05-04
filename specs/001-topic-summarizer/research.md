# Research: AI Topic Summarizer

## Decision: Use Supabase SSR for App Router auth

**Rationale**: Supabase's current Next.js guidance recommends cookie-based auth
with `@supabase/ssr` for App Router projects. That fits the need for
server-validated Route Handlers and simple email/password auth UI.

**Alternatives considered**:

- Use only the browser auth client and trust client state.
  Rejected because `POST /api/summarize` must independently verify the user.
- Build a custom auth cookie layer around the REST API.
  Rejected because it adds unnecessary risk over the supported SSR helpers.

## Decision: Implement `GET /api/me` in addition to `POST /api/summarize`

**Rationale**: The user explicitly allowed `GET /api/me` or equivalent auth
handling. A small session endpoint gives the client a stable authenticated user
shape for bootstrap and gives tests a direct way to verify auth state.

**Alternatives considered**:

- Skip `GET /api/me` and rely only on client-side Supabase auth state.
  Rejected because server-derived session checks are still needed and the extra
  endpoint is low-cost.

## Decision: Query Brave Web Search with 10 English results

**Rationale**: Brave's current web search docs support `count`, `search_lang`,
and locale parameters. Using `count=10`, `search_lang=en`, `ui_lang=en-US`, and
`country=US` matches the English-only requirement while keeping the request
compact.

**Alternatives considered**:

- Use Brave's LLM Context product directly.
  Rejected because the requested architecture calls the standard search API and
  then prepares compact context locally.
- Fetch more than 10 results and trim later.
  Rejected because the constitution fixes the limit at 10.

## Decision: Keep the OpenRouter model allowlist server-side in one module

**Rationale**: The model IDs are product policy, not UI decoration. A server
allowlist prevents tampering and gives one central place to manage future model
changes.

**Alternatives considered**:

- Trust the client-selected model string.
  Rejected because it would allow unsupported model IDs to reach OpenRouter.
- Hardcode the allowlist separately in multiple components.
  Rejected because it increases drift risk.

## Decision: Keep `tencent/hy3-preview:free` in the MVP allowlist but mark it as an operational risk

**Rationale**: The user explicitly approved this model, so the plan keeps it in
scope. Current OpenRouter model pages show the free preview as going away on
2026-05-08, so the allowlist must be isolated for quick replacement if needed.

**Alternatives considered**:

- Remove the model now.
  Rejected because it would conflict with the approved product scope.
- Make the model the default while it is still available.
  Rejected because the approved default is `openai/gpt-oss-120b:free`.

## Decision: Enforce daily quotas with a Supabase rate-limit table and RPC, not summary storage

**Rationale**: Vercel Route Handlers are stateless, so the app needs durable
per-user daily counters. A dedicated `daily_summary_usage` table plus an atomic
RPC keeps the logic inside Postgres and avoids storing any summary content.

**Alternatives considered**:

- In-memory rate limiting in the Route Handler.
  Rejected because serverless instances do not share memory reliably.
- One database row per summary request without an RPC.
  Rejected because count-then-insert flows are race-prone.
- Use `SUPABASE_SERVICE_ROLE_KEY` for all quota writes.
  Rejected for MVP because authenticated RPC calls can avoid broader privileges.

## Decision: Use client-side `jspdf` export for `topic-summary.pdf`

**Rationale**: The product only needs a PDF version of the current text output.
Client-side PDF generation avoids a server export route and keeps the summary
ephemeral.

**Alternatives considered**:

- Server-side PDF rendering.
  Rejected because the approved architecture says the PDF should be created on
  the client.
- DOM screenshot to PDF using `html2canvas`.
  Rejected for MVP because the content is mostly text and `jspdf` is simpler,
  lighter, and easier to test.

## Decision: Map the length slider to server-side verbosity bands

**Rationale**: A UI slider should influence both prompt wording and token budget
without forcing the client to manage LLM-specific parameters. A `0-100` value
mapped to five verbosity bands gives enough range for MVP.

**Alternatives considered**:

- Only three discrete values (`short`, `medium`, `long`).
  Rejected because the UI requirement is explicitly a slider.
- Expose token counts directly to users.
  Rejected because it is too implementation-specific for the product.

## Decision: Treat weak Brave results as a hard user-facing error

**Rationale**: The clarified spec explicitly says weak results should trigger a
clear instruction to try a more specific topic. That is safer than generating
low-confidence summaries from thin evidence.

**Alternatives considered**:

- Always generate something even from weak results.
  Rejected because it increases hallucination risk.
- Silently reduce quality and continue.
  Rejected because the user would not understand why the result degraded.
