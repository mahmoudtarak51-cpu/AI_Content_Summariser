# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Keep every
section concrete and scoped to the AI Topic Summarizer product.

## Summary

[Extract the primary user value, the technical approach, and any provider or UI
constraints that materially affect delivery.]

## Technical Context

**Language/Version**: TypeScript, Next.js, React, and the Vercel runtime
versions used by the repository  
**Primary Dependencies**: Next.js App Router, Supabase Auth, Brave Search
integration, OpenRouter integration, PDF generation tooling  
**Storage**: No permanent storage of generated summaries; temporary browser
state only unless a feature explicitly justifies a short-lived transient store  
**Testing**: Unit, integration, and end-to-end coverage for auth, summary
generation, output modes, error handling, and PDF export  
**Target Platform**: Responsive web app for modern desktop and mobile browsers  
**Project Type**: Next.js web application with server-side API routes or server
actions  
**Performance Goals**: Clear progress feedback during generation and acceptable
response times within third-party provider limits  
**Constraints**: English only, authenticated access only, top 10 search
results, server-side API keys only, approved OpenRouter free models only, no
citations, no share action, no copy action  
**Scale/Scope**: One topic at a time, five output modes, one downloadable PDF
artifact per generated summary

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Server/client boundaries keep Brave Search and OpenRouter secrets on the
      server only.
- [ ] The feature requires Supabase-authenticated access before generation or
      download behavior is available.
- [ ] The plan preserves live search on the top 10 results and uses only the
      approved model allowlist, with `openai/gpt-oss-120b:free` as default.
- [ ] The design does not persist generated summaries beyond temporary runtime
      state needed for rendering or PDF export.
- [ ] The UI keeps the approved scope: English-only selector, short/long
      control, five output modes, download button only, and no citations, share,
      or copy actions.
- [ ] Loading, empty, error, unauthorized, and rate-limited states are fully
      specified for desktop and mobile layouts.
- [ ] Validation covers all visible controls and at least one negative path for
      summary generation and PDF export.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- api/
|   |-- auth/
|   |-- summarize/
|   `-- download-pdf/
|-- (marketing-or-app-routes)/
|-- globals.css
`-- layout.tsx

components/
|-- auth/
|-- controls/
|-- layout/
`-- output/

lib/
|-- auth/
|-- brave-search/
|-- openrouter/
|-- pdf/
|-- rate-limit/
`-- validation/

public/
`-- [logo and static assets]

tests/
|-- e2e/
|-- integration/
`-- unit/
```

**Structure Decision**: [Document the exact directories affected by this
feature, note any deviations from the default layout above, and justify them if
they increase complexity.]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., temporary cache layer] | [current need] | [why in-memory request flow is insufficient] |
| [e.g., extra service module] | [specific problem] | [why direct route-level logic is insufficient] |
