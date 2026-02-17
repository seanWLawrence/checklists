# User Guide (Feature-Level)

This guide explains how the app works from a **human feature perspective**.

It covers:

- Checklists (including special syntax)
- Journals (formatting, AI analysis, search, analytics)
- Notes (Markdown behavior)
- Admin/debug backfill tools

---

## 1) Core model: one app, one account namespace

- You log in with a **username + password** (password is validated against `AUTH_SECRET` policy in this app’s auth flow).
- Data is stored per user namespace in KV (`user#<username>#...` keys).
- Main content modules:
  - `/checklists`
  - `/journals`
  - `/notes`

---

## 2) Checklists

## What checklists are good for

Reusable task flows (packing list, weekly reset, launch checklist, etc.), not just one-off todos.

### Checklist list view (`/checklists`)

- Checklists can be auto-grouped by category using name format:
  - `Category/Checklist Name`
  - Example: `Travel/Weekend Trip`
- If there is no `/`, the checklist appears under **Other**.

### Checklist content syntax (important)

Checklist text is parsed into sections/items with a lightweight syntax.

### Section structure

- Split sections by a **blank line**.
- First line of each section is the **section name**.
- Following lines are **items**.

Example:

```txt
Before Leaving
Pack charger 10m
Pack passport (front pocket)
--Take out trash 5m

At Airport
Check in 15m
Grab water
```

### Item syntax rules

For each item row, parser extracts:

- **Completion**: row starts with `--`
  - `--Take out trash`
- **Note**: text in parentheses `( ... )`
  - `Pack passport (front pocket)`
- **Time estimate**: number + unit (`m` or `h`)
  - `10m`, `2h`

What remains becomes the task name.

### Checklist behavior

- Task view autosaves changes (debounced).
- You can:
  - reset completed
  - hide/show completed
  - see time estimate rollups
- Shared checklist mode exists (`/checklists/share/...`) with shared update flow.

---

## 3) Journals

## Journal model

A journal entry includes:

- date (`createdAtLocal`)
- freeform content
- optional assets (image/audio)
- daily levels (1–5):
  - energy
  - mood
  - health
  - creativity
  - relationships
- habits booleans (e.g. cardio, writing, followSleepSchedule, etc.)
- optional AI analysis fields

### Journal content formatting

The journal detail view groups content by `##` headings.

Example:

```md
## Dreams
weird one about flying

## Highlights
met with a friend
finished workout
```

- Lines under each `##` heading become bullet-like rows in the UI.

### Assets

- Entries can include uploaded assets.
- Audio can be transcribed into content.

### Semantic search (`/journals?q=...`)

- Uses embeddings + vector search.
- Search results show qualitative confidence buckets:
  - Strong
  - Fair
  - Weak

### AI analysis for journals

For meaningful content, analysis stores:

- `dailySummary`
- sentiment:
  - `label` (`negative | mixed | neutral | positive`)
  - `valence` (-1 to 1)
  - optional `confidence`

There are two sentiment abstractions in UI/analytics:

1. **Model label** (negative/mixed/neutral/positive)
2. **Valence bucket** (higher-level):
   - Very positive
   - Positive
   - Mixed / neutral
   - Negative
   - Very negative

### Cost/perf guardrails

Analysis is skipped when content is too short after normalization.

- Env-controlled threshold:
  - `MIN_JOURNAL_ANALYSIS_CHARS`
  - default: `40`

### Journal analytics (`/journals/analytics/[since]`)

Includes:

- level charts (radar/pie/line)
- AI summary stats
- sentiment timeline (including rolling average)
- habit impact table (with/without deltas)
- helpful habits ranking with sample-size guardrails

---

## 4) Notes

Notes are Markdown-first documents.

### Supported rendering features

- standard Markdown
- heading anchors
- task lists
- tables
- table of contents plugin support
- syntax highlighting for code blocks
- linkification

Notes are viewed as rendered Markdown and editable as source text.

---

## 5) Admin/debug tools for vectors + backfills

Route: `/journals/vectors`

Admin users can run one-time maintenance tasks like:

- embedding backfill
- AI analysis backfill

If production serverless requests time out, run backfills from local dev against production envs (or use chunked/resumable jobs).

---

## 6) Practical usage patterns

### Daily journaling flow

1. Write journal content
2. Mark habits
3. Set levels at end of day
4. Review AI summary/sentiment
5. Use analytics weekly/monthly for trend checks

### Checklist flow

1. Keep canonical checklist templates
2. Use syntax for notes/time estimates
3. Reset completed between runs

### Notes flow

1. Use notes for long-form markdown docs
2. Use journals for day-based logging
3. Use checklists for repeatable execution

---

## 7) Environment knobs relevant to features

- `AUTH_SECRET` – auth token signing/validation secret
- `OPENAI_API_KEY` – required for journal AI/embeddings
- `MIN_JOURNAL_ANALYSIS_CHARS` – min normalized chars before AI analysis runs
- vector-related vars for journal semantic search/backfill:
  - `AWS_JOURNAL_VECTOR_BUCKET_NAME`
  - `AWS_JOURNAL_VECTOR_INDEX_NAME`
  - `AWS_JOURNAL_VECTOR_DIMENSION`

---

If you update parser rules or AI logic, update this guide so behavior stays discoverable for non-developers.
