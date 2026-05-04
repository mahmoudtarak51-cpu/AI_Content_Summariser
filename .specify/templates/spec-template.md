# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

Write user stories as independently testable slices of value. For this product,
every story that changes visible UI or generation behavior MUST describe desktop
and mobile behavior, loading feedback, and at least one failure or edge
condition.

### User Story 1 - [Brief Title] (Priority: P1)

[Describe the highest-value user journey in plain language.]

**Why this priority**: [Explain the value and why it comes first.]

**Independent Test**: [Describe how this story can be validated on its own with
real behavior and no mock data.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language.]

**Why this priority**: [Explain the value and why it has this priority level.]

**Independent Test**: [Describe how this can be tested independently.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language.]

**Why this priority**: [Explain the value and why it has this priority level.]

**Independent Test**: [Describe how this can be tested independently.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority.]

### Edge Cases

- What happens when an unauthenticated user tries to generate or download a
  summary?
- How does the system handle an empty topic, a non-English request, or a topic
  that produces weak search results?
- What happens when Brave Search fails, returns fewer than 10 usable results, or
  times out?
- How does the system respond when the selected OpenRouter model is unavailable,
  rate-limited, or returns malformed output?
- What happens when a user requests PDF export before a summary exists?
- How does the UI behave when a rate limit is exceeded on desktop and mobile?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require user authentication before summary
  generation or PDF download is available.
- **FR-002**: The system MUST accept a topic as the only required content input
  for summary generation.
- **FR-003**: The system MUST perform a live web search on the server using the
  approved free search API and use at most the top 10 search results.
- **FR-004**: The system MUST generate output through an approved OpenRouter
  free model running behind a server-side API key.
- **FR-005**: The system MUST support these output modes whenever summary
  generation is in scope: Summary, Bullet List, One Liner, Mind Map, and Meme.
- **FR-006**: The system MUST default to `openai/gpt-oss-120b:free` unless a
  different approved model is explicitly selected.
- **FR-007**: The system MUST keep the language selector locked to English until
  the constitution is amended.
- **FR-008**: The system MUST provide a functional PDF download action for
  generated output.
- **FR-009**: The system MUST NOT expose citations or sources to users and MUST
  NOT expose share or copy actions.
- **FR-010**: The system MUST provide clear loading, empty, success, error,
  unauthorized, and rate-limited states.
- **FR-011**: The system MUST prevent permanent storage of generated summaries,
  except for temporary in-browser state needed to present or download the
  current result.
- **FR-012**: The system MUST enforce basic abuse controls such as per-user rate
  limiting on summary generation endpoints.

### Constitution-Derived Constraints

- Brave Search and OpenRouter secrets MUST remain server-side only.
- The feature MUST preserve honest UI behavior: no mock buttons, no placeholder
  output, and no fake data paths.
- Any change that adds citations, new languages, saved history, share actions,
  copy actions, or unapproved models requires a constitution update first.
- Every visible control described in the feature MUST be functional in the
  shipped experience.

### Key Entities *(include if feature involves data)*

- **Authenticated User Session**: The signed-in state and access context used to
  authorize summary generation and download actions.
- **Summary Request**: The transient input and option set for one generation
  attempt, such as topic, model, mode, and length preference.
- **Generated Summary**: The temporary output shown to the user and optionally
  rendered into a PDF, without permanent persistence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can enter a topic and successfully generate an
  output in the requested mode without any mock or placeholder content.
- **SC-002**: Users can download the currently displayed summary as a PDF after
  generation succeeds.
- **SC-003**: Unauthenticated, provider-failure, and rate-limited states show
  actionable feedback without exposing secrets or raw provider internals.
- **SC-004**: The feature remains usable on desktop and mobile layouts with all
  visible controls functional.

## Assumptions

- Users have network connectivity to reach Supabase, Brave Search, OpenRouter,
  and the Vercel-hosted application.
- The product remains English-only unless a future constitution amendment
  expands language support.
- Generated summaries are ephemeral and do not require account-level history or
  database persistence.
- The approved layout and control set are the baseline UX for this repository
  unless explicitly revised.
