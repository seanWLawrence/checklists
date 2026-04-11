# Journal Analytics AI Implementation Instructions

## Build Scope

Implement only the basic grounded AI summary flow for `src/app/journals/analytics/[since]/page.tsx`:

1. Typed analytics slice query layer
2. One preset AI flow: `summarize-period`
3. Analyst model call using only requested slices
4. Basic UI entry point on the analytics page

## Core Product Decision

Do **not** send the full analytics page payload to the model.

Instead:

1. App selects a small set of predefined analytics slices
2. Server fetches only those slices
3. Analyst model answers from that structured data only

## Required Data Slices

```ts
type JournalAnalyticsRequest =
  | { kind: "overview" }
  | { kind: "sentimentTimeline"; granularity?: "day" | "week" }
  | { kind: "activityImpact"; minSampleSize?: number }
  | { kind: "helpfulActivities"; limit?: number }
  | {
      kind: "entryRows";
      limit?: number;
      fields: Array<
        "date" | "ratings" | "activities" | "sentiment" | "dailySummary"
      >;
    };
```

### Slice intent

- `overview`: compact summary for most prompts
- `sentimentTimeline`: sentiment trend over time
- `activityImpact`: activity associations with mood/energy/productivity
- `helpfulActivities`: top helpful activity ranking
- `entryRows`: compact row-level data

## Minimum Response Shape

```ts
type JournalAnalyticsQueryResult = {
  meta: {
    since: string;
    generatedAt: string;
    version: number;
    requestedKinds: JournalAnalyticsRequest["kind"][];
  };
  results: {
    overview?: unknown;
    sentimentTimeline?: unknown;
    activityImpact?: unknown;
    helpfulActivities?: unknown;
    entryRows?: unknown;
  };
};
```

Keep payloads compact and serializable.

## `overview` Slice

```ts
type JournalAnalyticsOverview = {
  totalEntries: number;
  analyzedCount: number;
  averageSentimentValence?: number;
  sentimentLabelCounts: Record<string, number>;
  sentimentValenceBucketCounts: Record<string, number>;
  topActivities: Array<{
    key: string;
    label: string;
    count: number;
    percentOfEntries: number;
  }>;
  helpfulActivities: Array<{
    key: string;
    label: string;
    count: number;
    score: number;
    moodDelta: number;
    energyDelta: number;
    productivityDelta: number;
  }>;
  notableMetrics: {
    averageMood?: number;
    averageEnergy?: number;
    averageProductivity?: number;
  };
};
```

Rules:

- optimize for low token usage
- include aggregates, not raw journal text
- no full journal content

## Data Layer

Suggested file:

- `src/app/journals/lib/get-journal-analytics-query-result.lib.ts`

Responsibilities:

- validate `since`
- fetch current user data server-side
- reuse existing analytics logic where possible
- return only requested slices
- enforce limits and defaults server-side

Reuse if possible:

- `parseSinceRange()`
- `getJournalLevelsAnalytics()`
- `getJournalAiAnalytics()`

## Preset AI Flow

Use a deterministic preset plan.

```ts
const summarizePeriodPlan = {
  intent: "summary",
  requests: [
    { kind: "overview" },
    { kind: "sentimentTimeline" },
    { kind: "activityImpact", minSampleSize: 5 },
    { kind: "helpfulActivities", limit: 5 },
  ],
  answerFormat: "sections",
  instructions: [
    "Summarize the most important patterns from the period",
    "Highlight sentiment movement over time",
    "Identify activities associated with better outcomes",
    "Give 3 practical takeaways",
    "Mention weak evidence or sample-size limitations",
  ],
} as const;
```

If implementation speed matters, start with:

```ts
requests: [{ kind: "overview" }];
```

Then expand once the end-to-end flow works.

## Model Configuration

For the initial implementation, reuse the existing `OPENAI_JOURNAL_ANALYSIS_MODEL` for the grounded analytics summary flow.

A separate env/config key can be introduced later if the analyst flow needs a different model.

## Analyst Contract

The analyst should receive only:

- user question
- validated preset plan
- fetched analytics slices

Suggested output:

```ts
type JournalAnalyticsAnswer = {
  answer: string;
  observations: string[];
  caveats: string[];
  followUps?: string[];
};
```

Analyst rules:

- use only supplied data
- do not invent facts
- treat activity relationships as correlation, not causation
- mention thin evidence or low sample size
- keep the answer practical and concise

## UI

Add a basic assistant entry point to:

- `src/app/journals/analytics/[since]/page.tsx`

MVP UI requirements:

- one button: `Summarize this period`
- loading state
- error state
- rendered answer
- optional caveats section

No ad hoc input required.

## Validation / Safety

Use runtime validation for:

- analytics slice requests
- analyst output

Requirements:

- keep auth and user scoping on the server
- cap `entryRows.limit` if implemented
- reject unsupported fields/params
- never include full journal body
- handle low-data periods gracefully

Per project conventions, prefer `Codec`.

## Recommended Files

- `src/app/journals/lib/journal-analytics-query.types.ts`
- `src/app/journals/lib/get-journal-analytics-query-result.lib.ts`
- `src/app/journals/lib/build-journal-analytics-overview.lib.ts`
- `src/app/journals/lib/journal-analytics-ai.types.ts`
- `src/app/journals/lib/get-journal-analytics-preset-plan.lib.ts`
- `src/app/journals/lib/get-journal-analytics-answer.lib.ts`
- `src/app/journals/lib/run-journal-analytics-ai-query.lib.ts`
- `src/app/journals/analytics/[since]/actions.ts`
- `src/app/journals/analytics/[since]/analytics-assistant.tsx`

Add `entryRows` support only if needed.

## Implementation Order

1. Build typed query layer
2. Implement `overview`
3. Add preset `summarize-period` plan
4. Call analyst model with validated slices
5. Render result on analytics page

## Definition of Done

The first merge is done when:

- app can request analytics slices
- `overview` exists and is runtime-validated
- one preset action (`Summarize this period`) works end to end
- analyst answer is grounded only in fetched slices
- UI renders answer, loading, and error states
