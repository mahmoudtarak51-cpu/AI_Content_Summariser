---

description: "Task list for AI Topic Summarizer implementation"
---

# Tasks: AI Topic Summarizer

**Input**: Design documents from `/specs/001-topic-summarizer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for auth gating, server-side generation, rate
limiting, prompt shaping, error handling, and PDF download behavior.

**Organization**: Tasks are grouped by user story so each story can be
implemented and validated independently after the foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Every task includes exact file paths

## Path Conventions

- Next.js routes and pages: `app/`
- Shared UI: `components/`
- Shared logic and integrations: `lib/`
- Supabase SQL migrations: `supabase/migrations/`
- Automated tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the greenfield Next.js codebase and baseline tooling

- [x] T001 Initialize the Next.js App Router TypeScript app in `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, and `app/page.tsx`
- [x] T002 Configure Tailwind CSS and baseline design tokens in `postcss.config.mjs` and `app/globals.css`
- [x] T003 [P] Add project dependencies for Supabase SSR, Zod, jsPDF, Vitest, Testing Library, and Playwright in `package.json`
- [x] T004 [P] Add environment variable validation and shared env access in `.env.example` and `lib/env.ts`
- [x] T005 [P] Configure unit, integration, and end-to-end test tooling in `vitest.config.ts`, `playwright.config.ts`, and `tests/setup.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared infrastructure that every user story depends on

**CRITICAL**: No user story work should start before this phase is complete

  - [x] T006 Implement Supabase browser and server helpers in `lib/auth/browser.ts` and `lib/auth/server.ts`
  - [x] T007 [P] Add auth cookie refresh middleware in `middleware.ts` and `lib/auth/middleware.ts`
  - [x] T008 [P] Implement the daily quota table, RLS policy, and RPC in `supabase/migrations/[timestamp]_daily_summary_usage.sql`
  - [x] T009 [P] Implement rate-limit access helpers in `lib/rate-limit/consume-daily-quota.ts` and `lib/rate-limit/types.ts`
  - [x] T010 [P] Implement topic and summarize request validation schemas in `lib/validation/topic.ts` and `lib/validation/summarize-request.ts`
  - [x] T011 [P] Implement the Brave Search client and result normalization helpers in `lib/brave-search/client.ts` and `lib/brave-search/normalize-results.ts`
  - [x] T012 [P] Implement the OpenRouter allowlist and base client in `lib/openrouter/allowlist.ts` and `lib/openrouter/client.ts`
  - [x] T013 [P] Implement shared summary context and length mapping helpers in `lib/summaries/build-context.ts` and `lib/summaries/map-length.ts`
  - [x] T014 Implement the authenticated session bootstrap route in `app/api/me/route.ts`

**Checkpoint**: Foundation ready - user story implementation can now proceed

---

## Phase 3: User Story 1 - Generate a Topic Summary (Priority: P1)

**Goal**: Let a signed-in user enter a topic and receive one grounded output in
the right panel with full auth, validation, loading, and error handling

**Independent Test**: Sign in with email/password, enter a valid topic, click
`Summarize`, and verify one current output appears with no sources, no saved
history, and clear loading or error feedback

### Tests for User Story 1

> **NOTE**: Write these tests first and confirm they fail before implementation.

- [x] T015 [P] [US1] Add integration coverage for `GET /api/me`, authenticated `POST /api/summarize`, and auth failure responses in `tests/integration/me-route.test.ts` and `tests/integration/summarize-route.test.ts`
- [x] T016 [P] [US1] Add Playwright coverage for email/password sign-in, protected summarizer access, and core topic summarization flow in `tests/e2e/auth.spec.ts` and `tests/e2e/summarize.spec.ts`

### Implementation for User Story 1

- [x] T017 [P] [US1] Build the email/password sign-in form in `components/auth/auth-card.tsx`
- [x] T018 [P] [US1] Build the sign-out control and session-aware header actions in `components/auth/sign-out-button.tsx` and `components/layout/brand-header.tsx`
- [x] T019 [P] [US1] Build the screenshot-inspired shell, hero, badges, and two-card layout in `components/layout/app-shell.tsx`, `components/layout/hero.tsx`, and `app/page.tsx`
- [x] T020 [P] [US1] Build the topic-only form and summarize trigger without upload, URL, share, or copy controls in `components/controls/topic-input.tsx` and `components/controls/summarize-form.tsx`
- [x] T021 [P] [US1] Build the output panel empty, loading, and error states in `components/output/empty-state.tsx`, `components/output/output-card.tsx`, and `components/output/output-status.tsx`
- [x] T022 [US1] Implement `POST /api/summarize` auth checks, topic validation, 10-result Brave Search call, weak-result rejection, OpenRouter request, and generated text response in `app/api/summarize/route.ts`
- [x] T023 [US1] Connect protected client submission state, button disabling, current output state, and success rendering in `app/page.tsx` and `components/output/output-content.tsx`
- [x] T024 [US1] Add user-facing auth, empty-topic, search, model, and no-useful-results error mapping plus no-summary-persistence guards in `app/api/summarize/route.ts` and `lib/validation/topic.ts`

**Checkpoint**: User Story 1 should now be fully functional and independently
testable

---

## Phase 4: User Story 2 - Shape the Output (Priority: P2)

**Goal**: Let the user shape the generated result with approved models, output
modes, a locked English selector, and a short-to-long slider

**Independent Test**: Generate the same topic with different models, modes, and
length settings and verify the visible output reflects the selected options
while staying English-only and source-free

### Tests for User Story 2

- [x] T025 [P] [US2] Add integration coverage for model allowlist validation, mode-specific prompting, length mapping, and weak-result handling in `tests/integration/summarize-route.test.ts`
- [x] T026 [P] [US2] Add Playwright coverage for model selection, mode tabs, locked English control, and length slider behavior in `tests/e2e/summarize.spec.ts`

### Implementation for User Story 2

- [x] T027 [P] [US2] Build the model selector and locked English control in `components/controls/model-selector.tsx`
- [x] T028 [P] [US2] Build the summary mode tabs in `components/controls/mode-tabs.tsx`
- [x] T029 [P] [US2] Build the short-to-long slider control in `components/controls/length-slider.tsx`
- [x] T030 [P] [US2] Implement mode-specific prompt instructions for Summary, Bullet List, One Liner, Mind Map, and Meme in `lib/openrouter/prompt.ts`
- [x] T031 [P] [US2] Implement the length slider to verbosity-band mapping in `lib/summaries/map-length.ts`
- [x] T032 [US2] Enforce selected model, mode, language, and length values through request validation and route handling in `lib/validation/summarize-request.ts` and `app/api/summarize/route.ts`
- [x] T033 [US2] Connect selector, tab, and slider state to the request payload and shaped output rendering in `components/controls/summarize-form.tsx`, `app/page.tsx`, and `components/output/output-content.tsx`
- [x] T034 [US2] Refine responsive screenshot-matching styles for rounded controls, pill badges, and dual-card layout behavior in `app/globals.css` and `components/layout/app-shell.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Download the Current Output (Priority: P3)

**Goal**: Let the user export only the currently visible output as
`topic-summary.pdf` without introducing saved history

**Independent Test**: Generate a result, download `topic-summary.pdf`, verify it
includes topic, mode, model, and generated text only, and confirm no download
is available before output exists

### Tests for User Story 3

- [x] T035 [P] [US3] Add unit coverage for PDF export formatting and filename behavior in `tests/unit/download-summary-pdf.test.ts`
- [x] T036 [P] [US3] Add Playwright coverage for enabled and disabled PDF download states in `tests/e2e/pdf-download.spec.ts`

### Implementation for User Story 3

- [x] T037 [P] [US3] Implement client-side `topic-summary.pdf` generation with topic, mode, model, and generated text in `lib/pdf/download-summary-pdf.ts`
- [x] T038 [US3] Add the PDF download button and current-output-only export flow in `components/output/output-card.tsx` and `app/page.tsx`
- [x] T039 [US3] Ensure PDF exports omit sources and clear output on refresh or sign-out in `lib/pdf/download-summary-pdf.ts`, `components/auth/sign-out-button.tsx`, and `app/page.tsx`

**Checkpoint**: All planned user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish deployment, security review, and full-system validation

- [x] T040 [P] Document Vercel environment variables, Supabase callback URLs, and deployment steps in `README.md` and `specs/001-topic-summarizer/quickstart.md`
- [x] T041 [P] Review server-only secret boundaries and sanitized input handling in `lib/env.ts`, `app/api/summarize/route.ts`, and `lib/openrouter/client.ts`
- [x] T042 [P] Polish accessible labels, focus behavior, and mobile layout details in `components/controls/summarize-form.tsx`, `components/controls/topic-input.tsx`, and `app/globals.css`
- [x] T043 Verify the full local validation suite across `tests/integration/me-route.test.ts`, `tests/integration/summarize-route.test.ts`, `tests/e2e/auth.spec.ts`, `tests/e2e/summarize.spec.ts`, and `tests/e2e/pdf-download.spec.ts`
- [x] T044 Deploy the app to Vercel and record production summarization verification results in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories
- **User Story 1 (Phase 3)**: Starts after Foundational and delivers the MVP
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it shapes the
  same summarize flow
- **User Story 3 (Phase 5)**: Depends on User Story 1 because download requires
  an existing generated output
- **Polish (Phase 6)**: Depends on the desired user stories being complete

### User Story Dependencies

- **US1**: No dependency on later stories; delivers the first usable product
- **US2**: Extends US1 with richer controls and prompt shaping
- **US3**: Extends US1 with export capability and relies on current output state

### Within Each User Story

- Tests MUST be written and fail before implementation
- Shared validation and route behavior before final UI wiring
- Client state integration after server capabilities exist
- Story checkpoint validation before moving to the next priority

### Parallel Opportunities

- **Setup**: `T003`, `T004`, and `T005` can run in parallel after `T001`
- **Foundational**: `T008` through `T013` can run in parallel once the app
  scaffold exists
- **US1**: `T017` through `T021` can run in parallel while `T022` proceeds on
  the server side
- **US2**: `T027` through `T031` can run in parallel before `T032` and `T033`
- **US3**: `T035`, `T036`, and `T037` can run in parallel
- **Polish**: `T040`, `T041`, and `T042` can run in parallel

---

## Parallel Example: User Story 1

```text
Task: "T017 [US1] Build the email/password sign-in form in components/auth/auth-card.tsx"
Task: "T018 [US1] Build the sign-out control and session-aware header actions in components/auth/sign-out-button.tsx and components/layout/brand-header.tsx"
Task: "T019 [US1] Build the screenshot-inspired shell, hero, badges, and two-card layout in components/layout/app-shell.tsx, components/layout/hero.tsx, and app/page.tsx"
Task: "T021 [US1] Build the output panel empty, loading, and error states in components/output/empty-state.tsx, components/output/output-card.tsx, and components/output/output-status.tsx"
```

## Parallel Example: User Story 2

```text
Task: "T027 [US2] Build the model selector and locked English control in components/controls/model-selector.tsx"
Task: "T028 [US2] Build the summary mode tabs in components/controls/mode-tabs.tsx"
Task: "T029 [US2] Build the short-to-long slider control in components/controls/length-slider.tsx"
Task: "T030 [US2] Implement mode-specific prompt instructions in lib/openrouter/prompt.ts"
Task: "T031 [US2] Implement the length slider to verbosity-band mapping in lib/summaries/map-length.ts"
```

## Parallel Example: User Story 3

```text
Task: "T035 [US3] Add unit coverage for PDF export formatting and filename behavior in tests/unit/download-summary-pdf.test.ts"
Task: "T036 [US3] Add Playwright coverage for enabled and disabled PDF download states in tests/e2e/pdf-download.spec.ts"
Task: "T037 [US3] Implement client-side topic-summary.pdf generation in lib/pdf/download-summary-pdf.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate authenticated topic summarization end to end
5. Demo or deploy the MVP if desired

### Incremental Delivery

1. Finish Setup and Foundational phases
2. Deliver US1 for the first usable summarizer
3. Add US2 to unlock model, mode, and length shaping
4. Add US3 to deliver PDF export
5. Finish with deployment and security polish

### Parallel Team Strategy

1. One developer handles scaffold and auth foundations
2. One developer handles search and OpenRouter server modules
3. One developer handles UI controls and output rendering after the interfaces stabilize
4. PDF export and deployment validation can proceed once US1 is stable

---

## Notes

- All tasks use the required checklist format with IDs, labels, and file paths
- Total tasks: 44
- Suggested MVP scope: Phase 1, Phase 2, and Phase 3 only
- The app must never introduce citations, share controls, copy controls, upload controls, URL inputs, or summary persistence
