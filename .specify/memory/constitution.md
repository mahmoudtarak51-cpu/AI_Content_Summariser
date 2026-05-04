<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle slot 1 -> I. Server-Only Secrets and Authenticated Access
- Template principle slot 2 -> II. Real Search, Real Summaries, No Permanent Storage
- Template principle slot 3 -> III. Fixed Product Scope and Deterministic Output Modes
- Template principle slot 4 -> IV. Honest, Functional, and Responsive UX
- Template principle slot 5 -> V. Abuse Resistance and Release Quality
Added sections:
- Product Scope and Platform Constraints
- Delivery Workflow and Quality Gates
Removed sections:
- None
Templates requiring updates:
- UPDATED: .specify/templates/plan-template.md
- UPDATED: .specify/templates/spec-template.md
- UPDATED: .specify/templates/tasks-template.md
- NOT APPLICABLE: .specify/templates/commands/*.md (directory not present)
Follow-up TODOs:
- None
-->
# AI Topic Summarizer Constitution

## Core Principles

### I. Server-Only Secrets and Authenticated Access
All requests that touch Brave Search or OpenRouter MUST execute in server-side
code deployed on Vercel. Brave Search and OpenRouter API keys MUST never appear
in client bundles, browser storage, user-visible logs, or sample UI payloads.
Users MUST authenticate with Supabase before they can generate or download a
summary. Rationale: the product depends on protected third-party services and
must preserve secret isolation and gated usage.

### II. Real Search, Real Summaries, No Permanent Storage
Every summary MUST start from a live web search for the user-provided topic and
use only the top 10 results returned by the approved free search API. Summary
generation MUST use an allowed OpenRouter free model, and the system MUST NOT
display mock data, fabricated findings, or fake source attributions. Generated
summaries MUST exist only for the active response and any temporary browser
state required to render or export the result; they MUST NOT be stored
permanently in the database or retained server-side after request completion.
Rationale: user trust depends on honest output and minimal retention.

### III. Fixed Product Scope and Deterministic Output Modes
The app is an English-only topic summarizer. It MUST support exactly these
summary modes: Summary, Bullet List, One Liner, Mind Map, and Meme. The only
allowed OpenRouter models are `tencent/hy3-preview:free`,
`minimax/minimax-m2.5:free`, `nvidia/nemotron-3-super-120b-a12b:free`, and
`openai/gpt-oss-120b:free`, with `openai/gpt-oss-120b:free` as the default.
The interface MUST expose a language selector locked to English, a short/long
control, and a download-as-PDF action. The product MUST NOT expose citations or
sources to users, and it MUST NOT add share or copy actions unless this
constitution is amended first. Rationale: strict scope control prevents feature
creep and preserves the approved behavior.

### IV. Honest, Functional, and Responsive UX
Every visible control MUST perform real behavior in production. The shipped UI
MUST closely follow the approved composition: soft lavender background,
centered hero title, logo at top-left, sign-in button at top-right, two rounded
white panels, topic input and controls on the left, generated output on the
right, mode tabs across the output panel, and a download button only. No mock
buttons, placeholder content, or decorative disabled actions may be shown.
Loading, empty, unauthenticated, rate-limited, and failure states MUST be
explicit and understandable. The layout MUST remain usable on desktop and
mobile. Rationale: the app's credibility depends on a clear and honest
experience.

### V. Abuse Resistance and Release Quality
Summary-generation endpoints MUST enforce basic rate limits per authenticated
user and MUST log actionable server-side errors without leaking secrets. A
feature is not complete until the team verifies auth gating, server-only secret
handling, live search plus model generation, all five output modes, PDF export,
responsive behavior, and strong loading and error handling. Automated tests MUST
cover the critical path and at least one negative path for generation and
download flows. Rationale: external-provider products need explicit quality and
abuse controls to remain stable and supportable.

## Product Scope and Platform Constraints

- Frontend MUST use Next.js and React and deploy on Vercel.
- Backend behavior MUST be implemented through Vercel-hosted server routes or
  equivalent server-side Next.js execution paths.
- Supabase is the required authentication provider.
- Brave Search and OpenRouter integrations MUST remain server-side only.
- Generated summaries MUST NOT be persisted in Supabase or any other database.
- Search result limit is fixed at 10 unless the constitution is amended.
- English is the only supported language for input and output in the current
  product scope.
- Download as PDF is required. Share and copy capabilities are out of scope.

## Delivery Workflow and Quality Gates

- Every spec, plan, and task list MUST trace changes back to these principles.
- Plans MUST document the server/client boundary for secrets, auth enforcement,
  rate limiting, summary lifetime, and PDF generation.
- Tasks MUST include verification for every visible button and control changed by
  the feature.
- Releases MUST block on unresolved issues involving fake data, broken loading or
  error states, disallowed persistence, leaked secrets, or missing mobile
  usability.
- Any proposal that adds new models, languages, saved history, citations, share
  actions, or copy actions MUST update this constitution before implementation.

## Governance

This constitution overrides conflicting local conventions for this repository.
Amendments MUST be documented in the same change set as any affected template or
workflow updates. Versioning follows semantic rules: MAJOR for incompatible
principle changes or removals, MINOR for new principles or materially expanded
requirements, and PATCH for clarifications that do not change enforcement
expectations. Every feature review, implementation plan, task breakdown, and
release check MUST confirm compliance with server-only secrets, authenticated
access, real search-backed summaries, no permanent summary storage, approved UI
scope, rate limiting, and responsive functional behavior. If a change cannot
meet these rules, it MUST be redesigned before merge.

**Version**: 1.0.0 | **Ratified**: 2026-05-04 | **Last Amended**: 2026-05-04
