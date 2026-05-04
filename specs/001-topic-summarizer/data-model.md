# Data Model: AI Topic Summarizer

## Entity: User Session

**Purpose**: Represents the currently authenticated user who is allowed to
generate summaries and download PDFs.

**Fields**:

- `id`: UUID, sourced from Supabase Auth
- `email`: string, email/password identity
- `isAuthenticated`: boolean
- `lastValidatedAt`: ISO timestamp used in runtime checks

**Relationships**:

- One `User Session` can create many `Summary Request` records in runtime memory
- One `User Session` maps to one `Daily Summary Usage` row per calendar day

**Validation rules**:

- `isAuthenticated` must be true before `/api/summarize` succeeds
- Missing or expired sessions return unauthorized responses

## Entity: Summary Request

**Purpose**: Captures one end-to-end summarization request initiated by a
signed-in user.

**Fields**:

- `topic`: string, trimmed user input
- `model`: enum
  - `openai/gpt-oss-120b:free`
  - `tencent/hy3-preview:free`
  - `minimax/minimax-m2.5:free`
  - `nvidia/nemotron-3-super-120b-a12b:free`
- `mode`: enum
  - `summary`
  - `bullet-list`
  - `one-liner`
  - `mind-map`
  - `meme`
- `lengthValue`: integer from 0 to 100
- `language`: fixed literal `en`
- `requestedAt`: ISO timestamp

**Validation rules**:

- `topic` must not be empty after trimming
- `topic` must not be a bare URL or pasted source block
- `topic` should stay within a topic-sized limit suitable for search queries
- `model` must match the server allowlist
- `mode` must match one of the five approved modes
- `lengthValue` must be an integer between 0 and 100
- `language` must always equal `en`

**State transitions**:

1. `draft` when the client edits controls
2. `submitted` when the client posts to `/api/summarize`
3. `validated` after auth, input, and quota checks pass
4. `searched` after Brave results are normalized
5. `generated` after OpenRouter returns output
6. `failed` if any validation, quota, provider, or weak-results rule stops the
   flow

## Entity: Search Result Document

**Purpose**: Represents one Brave result used internally to ground a summary.

**Fields**:

- `rank`: integer from 1 to 10
- `title`: string
- `snippet`: string
- `description`: string or null
- `url`: string
- `displayHost`: string or null

**Validation rules**:

- `rank` must be unique within one `Summary Request`
- `url` is internal-only and must never be returned to the UI
- Empty or unusable result sets trigger the weak-results path

**Relationships**:

- Many `Search Result Document` items belong to one `Summary Request`

## Entity: Generated Output

**Purpose**: Represents the single current result shown in the right panel and
used for client-side PDF export.

**Fields**:

- `content`: string
- `topic`: string
- `model`: allowlisted model id
- `mode`: approved output mode
- `lengthBand`: enum
  - `micro`
  - `short`
  - `medium`
  - `long`
  - `extended`
- `generatedAt`: ISO timestamp
- `fileName`: fixed string `topic-summary.pdf`

**Validation rules**:

- `content` must be non-empty before PDF download is enabled
- `content` must be English-only in intent and contain no citations or URLs
- Only one `Generated Output` may exist in client state at a time

**Lifecycle**:

- Created after a successful `Summary Request`
- Replaced by the next successful request
- Cleared on refresh, sign-out, or session loss

## Entity: Daily Summary Usage

**Purpose**: Stores the only allowed durable usage data for enforcing the MVP
quota.

**Fields**:

- `user_id`: UUID, foreign key to the authenticated user
- `usage_date`: date in UTC or app-standard server date
- `request_count`: integer
- `updated_at`: timestamptz

**Primary key**:

- Composite key on (`user_id`, `usage_date`)

**Validation rules**:

- `request_count` must stay between 0 and 10 for MVP
- Writes must never include summary content or prompt text

**Relationships**:

- One `Daily Summary Usage` row belongs to one user for one day

**State transitions**:

1. No row exists for the day
2. First allowed request creates row with `request_count = 1`
3. Subsequent allowed requests atomically increment the count
4. Requests after count `10` are rejected with a rate-limit error
