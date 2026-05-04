---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for auth gating, server-side generation, PDF
download, error handling, rate limiting, and any change that affects visible
controls or output modes.

**Organization**: Tasks are grouped by user story to enable independent
implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (for example `US1`,
  `US2`, `US3`)
- Include exact file paths in descriptions
- Include validation tasks for every user-facing control changed by the story

## Path Conventions

- Next.js app routes: `app/`
- Server handlers: `app/api/`
- Shared UI: `components/`
- Shared logic and integrations: `lib/`
- Automated tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`

<!--
  IMPORTANT: The tasks below are sample tasks for illustration only.

  The /speckit.tasks command MUST replace them with concrete tasks derived from:
  - User stories from spec.md
  - Constitution checks from plan.md
  - Data and API artifacts produced during planning

  Generated tasks MUST preserve these project rules:
  - No client-side secret handling
  - No permanent summary persistence
  - No mock buttons or fake data paths
  - No citations, share actions, or copy actions unless the constitution changes
  - All visible controls must be functional and verified
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the application skeleton and delivery tooling

- [ ] T001 Create or confirm the Next.js application structure in `app/`,
      `components/`, `lib/`, and `tests/`
- [ ] T002 Configure repository dependencies for auth, provider integrations,
      PDF generation, and testing
- [ ] T003 [P] Configure linting, formatting, and test runners

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can
be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement Supabase authentication and route protection
- [ ] T005 [P] Add server-only environment configuration for Brave Search and
      OpenRouter keys
- [ ] T006 [P] Create the base server-side search and summarization modules in
      `lib/brave-search/` and `lib/openrouter/`
- [ ] T007 [P] Create rate-limiting and error-handling utilities in
      `lib/rate-limit/` and `lib/validation/`
- [ ] T008 Define the transient summary request and response shapes shared across
      routes and UI
- [ ] T009 Add PDF export plumbing and any server-side rendering helpers needed
      for download

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Describe the primary user journey delivered by this story]

**Independent Test**: [Describe how to validate this story with real provider
behavior and no mock data]

### Tests for User Story 1

> **NOTE**: Write these tests first, verify they fail, then implement the story.

- [ ] T010 [P] [US1] Add integration coverage for authenticated summary
      generation in `tests/integration/[name].test.[ext]`
- [ ] T011 [P] [US1] Add end-to-end coverage for the primary topic entry flow in
      `tests/e2e/[name].test.[ext]`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Build the topic input and control panel in
      `components/controls/`
- [ ] T013 [P] [US1] Implement the summary generation route in
      `app/api/summarize/route.ts`
- [ ] T014 [US1] Connect UI submission state, loading feedback, and success
      rendering in the relevant `app/` and `components/output/` files
- [ ] T015 [US1] Add validation and user-readable failure states for auth,
      provider, and empty-input errors

**Checkpoint**: User Story 1 is functional and independently testable

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Describe the value delivered by this story]

**Independent Test**: [Describe how this can be validated independently]

### Tests for User Story 2

- [ ] T016 [P] [US2] Add integration coverage for mode switching and output
      formatting in `tests/integration/[name].test.[ext]`
- [ ] T017 [P] [US2] Add UI coverage for all visible controls changed by this
      story in `tests/e2e/[name].test.[ext]`

### Implementation for User Story 2

- [ ] T018 [P] [US2] Implement output mode tabs and rendering states in
      `components/output/`
- [ ] T019 [US2] Enforce model allowlist, English-only controls, and length
      options in the relevant route and UI modules
- [ ] T020 [US2] Add responsive layout adjustments for mobile and desktop
      behavior in `app/` and styling files

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Describe the value delivered by this story]

**Independent Test**: [Describe how to verify this story works on its own]

### Tests for User Story 3

- [ ] T021 [P] [US3] Add integration coverage for PDF generation and download in
      `tests/integration/[name].test.[ext]`
- [ ] T022 [P] [US3] Add a negative-path test for rate limiting or download
      failure handling in `tests/e2e/[name].test.[ext]`

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement the PDF export route in
      `app/api/download-pdf/route.ts`
- [ ] T024 [US3] Add the functional download button and completion or failure
      feedback in the output panel UI
- [ ] T025 [US3] Confirm generated summaries remain transient and are not
      persisted beyond the active session state

**Checkpoint**: All planned user stories are independently functional

---

[Add more user story phases as needed, following the same pattern.]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Update documentation and quickstart guidance
- [ ] TXXX Review security, rate limits, and secret isolation
- [ ] TXXX Validate responsive layout, loading states, and empty states across
      the full product flow
- [ ] TXXX Confirm no disallowed UI actions or persistence paths were
      introduced
- [ ] TXXX Run the full validation suite

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user
  stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests MUST be written and fail before implementation
- Server-side behavior before client wiring when secrets or provider calls are
  involved
- Validation and failure handling before final UI polish
- Story-specific verification before moving to the next priority

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel
- Foundational tasks marked `[P]` can run in parallel
- Once Foundational is complete, separate user stories can proceed in parallel
  if they do not modify the same files
- Test tasks marked `[P]` can run in parallel

---

## Notes

- `[P]` tasks target different files with no direct dependency
- `[Story]` labels map tasks to user stories for traceability
- Every story must remain independently testable and free of fake UI states
- Do not add citations, share actions, copy actions, or permanent summary
  persistence unless the constitution is amended first
