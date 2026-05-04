# Feature Specification: AI Topic Summarizer

**Feature Branch**: `[001-topic-summarizer]`  
**Created**: 2026-05-04  
**Status**: Draft  
**Input**: User description: "Create the full product requirements for an
AI-powered topic summarizer with authenticated access, topic-only input,
approved model choices, multiple output modes, one-time browser-only output,
and PDF download."

## Clarifications

### Session 2026-05-04

- Q: What sign-in and storage model defines MVP access? -> A: Supabase
  email/password sign-in is required, and generated summaries are shown once in
  browser state only and are never saved.
- Q: How do search and summarization inputs behave? -> A: Users provide topic
  input only; Brave Search retrieves up to 10 results, and titles, snippets,
  descriptions, and URLs may be used internally but URLs are never displayed.
- Q: What are the confirmed output and export behaviors? -> A: The app supports
  Summary, Bullet List, One Liner, Mind Map, and Meme modes; Mind Map is nested
  text bullets, Meme is short meme-style text, and export is PDF only.
- Q: What abuse and weak-result behavior applies in MVP? -> A: Signed-in users
  may generate up to 10 summaries per day, and weak search results produce a
  clear error asking for a more specific topic.
- Q: What UI and secret-handling constraints are final? -> A: The UI closely
  matches the provided screenshot, uses no mock buttons or placeholder data,
  runs on the approved Vercel, Supabase, and Next.js stack, and keeps all API
  keys server-side only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a Topic Summary (Priority: P1)

As a signed-in user, I want to enter a topic and receive a grounded summary in
the app so I can understand a subject quickly without collecting sources
myself.

**Why this priority**: This is the core product promise. Without authenticated
topic-to-summary generation, the app has no usable value.

**Independent Test**: Sign in, enter a valid topic, trigger summarization, and
verify that exactly one current output appears in the right panel with clear
loading, success, and error feedback.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on the landing page, **When** they try to use
   summary generation, **Then** the app requires sign-in before generation can
   proceed.
2. **Given** a signed-in user with a valid topic, **When** they click
   `Summarize`, **Then** the app shows a loading state and replaces the empty
   state with one generated output in the right panel.
3. **Given** a signed-in user at the authentication step, **When** they sign
   in, **Then** they use email and password credentials before generation is
   unlocked.
4. **Given** a successful generation, **When** the result is displayed,
   **Then** the output shows only the generated content and does not display
   source links, citations, share controls, copy controls, or saved history.

---

### User Story 2 - Shape the Output (Priority: P2)

As a signed-in user, I want to choose the model, output mode, and summary
length so the result matches the level of detail and format I need.

**Why this priority**: The product differentiates itself through format choice
and controllable output, but it still depends on the core generation flow from
User Story 1.

**Independent Test**: Sign in, enter the same topic more than once, change the
selected model, mode, and length setting, and verify the current output
reflects the selected options each time.

**Acceptance Scenarios**:

1. **Given** a signed-in user with a valid topic, **When** they choose one of
   the approved models and click `Summarize`, **Then** the system generates the
   output using that selected model.
2. **Given** a signed-in user preparing a request, **When** they select one of
   the five mode tabs, **Then** the chosen mode becomes the active format for
   the next generated output.
3. **Given** a signed-in user viewing controls, **When** they open the language
   selector, **Then** English is the only available language option.
4. **Given** a signed-in user adjusting the length slider, **When** they move
   it toward short or long, **Then** the next output reflects the requested
   level of brevity or detail.
5. **Given** a signed-in user selects `Mind Map` or `Meme`, **When** the output
   is generated, **Then** Mind Map appears as a nested text outline and Meme
   appears as short meme-style text rather than an image.

---

### User Story 3 - Download the Current Output (Priority: P3)

As a signed-in user, I want to download the current output as a PDF so I can
keep or share the result outside the app without needing persistent in-app
storage.

**Why this priority**: Downloading completes the one-session workflow and
supports the requirement that summaries are not stored as ongoing history in
the product.

**Independent Test**: Generate an output, download it as a PDF, and verify the
download reflects the currently displayed content without requiring a saved
history page.

**Acceptance Scenarios**:

1. **Given** a signed-in user with a current generated output, **When** they
   click the download button, **Then** the app downloads a PDF of that current
   output.
2. **Given** a signed-in user with no current output, **When** they view the
   output panel, **Then** the app clearly indicates that no download is
   available yet.
3. **Given** a signed-in user who refreshes the page or signs out, **When**
   they return to the app, **Then** the previous generated output is no longer
   available as saved in-app history.
4. **Given** a signed-in user with a current generated output, **When** they
   download it, **Then** the PDF is created from the currently displayed output
   in the browser experience without creating saved summary history.

### Edge Cases

- What happens when a user submits an empty topic or a topic that is only
  whitespace?
- What happens when a user enters a website URL, pasted source material, or a
  request that is not a topic?
- What happens when the search step returns no useful findings or fewer than the
  normal maximum number of findings?
- What happens when search findings are too weak to support a trustworthy
  summary for the requested topic?
- What happens when summary generation is already in progress and the user clicks
  `Summarize` again?
- What happens when a signed-in user exceeds the allowed request rate?
- What happens when the selected model is unavailable at request time?
- What happens when the user tries to download before any output exists?
- What happens when the generated result cannot be turned into a PDF?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require sign-in before a user can generate a
  summary or download a PDF.
- **FR-002**: The system MUST authenticate users with email and password
  sign-in.
- **FR-003**: The system MUST allow signed-in users to sign out at any time.
- **FR-004**: The system MUST provide exactly one primary content input: a topic
  field for the subject the user wants summarized.
- **FR-005**: The system MUST NOT provide alternative source-material inputs
  such as pasted article text, file uploads, or website URL submission fields.
- **FR-006**: The system MUST validate that the topic field contains a usable
  topic before generation starts and MUST show a clear message when it does not.
- **FR-007**: The system MUST reject website URLs, pasted source material, and
  other non-topic submissions as invalid input for summary generation.
- **FR-008**: The system MUST let the user choose from only these approved
  models: `openai/gpt-oss-120b:free`, `tencent/hy3-preview:free`,
  `minimax/minimax-m2.5:free`, and `nvidia/nemotron-3-super-120b-a12b:free`.
- **FR-009**: The system MUST default the model selection to
  `openai/gpt-oss-120b:free`.
- **FR-010**: The system MUST provide these output modes: Summary, Bullet List,
  One Liner, Mind Map, and Meme.
- **FR-011**: The system MUST render Mind Map mode as a structured text mind map
  using nested bullets.
- **FR-012**: The system MUST render Meme mode as a short meme-style text
  response and MUST NOT require image generation.
- **FR-013**: The system MUST provide a short-to-long length control that
  affects the next generated output.
- **FR-014**: The system MUST use the active topic, model, mode, and length
  settings when the user clicks `Summarize`.
- **FR-015**: The system MUST gather live web findings for the topic for each
  generation request using Brave Search and MUST use no more than 10 findings
  for one request.
- **FR-016**: The system MUST use titles, snippets, descriptions, and URLs from
  the retrieved findings internally when preparing a summary request, but it
  MUST NOT display URLs to users.
- **FR-017**: The system MUST ground the generated output in the retrieved
  findings for that request and MUST instruct generation to summarize only those
  findings and avoid unsupported claims outside the retrieved material.
- **FR-018**: The system MUST display the generated output in the right panel as
  the current result for the session.
- **FR-019**: The system MUST show a clear empty state before the first output
  is generated.
- **FR-020**: The system MUST show a clear loading state while generation or
  PDF preparation is in progress.
- **FR-021**: The system MUST show a clear error state when validation,
  generation, download, or availability problems prevent completion.
- **FR-022**: The system MUST show a clear error asking the user to try a more
  specific topic when the retrieved findings are too weak to support a reliable
  summary.
- **FR-023**: The system MUST enforce a request rate limit of 10 summaries per
  signed-in user per day for MVP and MUST explain when that limit blocks a
  request.
- **FR-024**: The system MUST provide a functional PDF download action for the
  current generated output.
- **FR-025**: The system MUST create the downloadable PDF from the currently
  displayed generated output without creating saved summary history.
- **FR-026**: The system MUST NOT display citations, source links, copy
  controls, or share controls in the user interface.
- **FR-027**: The system MUST keep only the current generated output in browser
  session state for immediate display or download and MUST NOT provide saved
  in-app summary history.
- **FR-028**: The system MUST NOT permanently store generated summaries in the
  product's user account records.
- **FR-029**: The system MUST support English-only output and MUST present
  English as the only language choice.
- **FR-030**: Every visible button, tab, selector, slider, and status message
  in the shipped interface MUST correspond to real product behavior.
- **FR-031**: The system MUST NOT show mock data, fake results, or placeholder
  action controls in the live experience.
- **FR-032**: The system MUST ensure that each new successful generation
  replaces the previously displayed current output rather than creating a saved
  list of past summaries.
- **FR-033**: The system MUST provide clear, accessible labels for the topic
  field, model selector, mode controls, length control, summarize action, and
  download action.
- **FR-034**: The system MUST remain usable on both desktop and mobile layouts
  without hiding required controls behind nonfunctional placeholders.
- **FR-035**: The system MUST closely match the provided screenshot in layout
  and visual composition while keeping every visible control functional.
- **FR-036**: The system MUST protect search and generation credentials from end
  users and MUST keep all API keys server-side only.

### Key Entities *(include if feature involves data)*

- **User Session**: The active signed-in state that determines whether the user
  can generate or download output.
- **Summary Request**: One request containing a topic, selected model, selected
  mode, and selected length setting.
- **Generated Output**: The current response created from live findings and
  shown once in the output panel for the active session.
- **Downloadable PDF**: The exported document created from the currently
  displayed output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of signed-in users in acceptance testing can complete
  the flow from topic entry to visible output on their first attempt without
  assistance.
- **SC-002**: At least 95% of successful generation attempts show one current
  output in the selected mode without displaying citations, source links, copy
  controls, share controls, or saved history.
- **SC-003**: At least 95% of successful outputs can be downloaded as a PDF on
  the first download attempt.
- **SC-004**: In usability testing across desktop and mobile layouts, at least
  90% of participants can identify the topic field, model selector, mode tabs,
  length control, summarize action, and download action without guidance.
- **SC-005**: 100% of blocked requests caused by validation errors, missing
  access, rate limits, or unavailable generation present a user-readable
  message that explains what to do next.

## Assumptions

- Users have active accounts and internet access when they use the product.
- The approved model list remains fixed until the product team explicitly
  changes it.
- The product permits normal entry of a topic phrase into the topic field, but
  it does not support pasted source material as a separate summarization input
  method.
- If fewer than 10 useful findings are available for a topic, the system uses
  the available findings rather than blocking the request for that reason alone.
- Refreshing the page, closing the browser session, or signing out clears the
  current generated output from the in-app experience.
