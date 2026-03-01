# Checklists and journals

This is a personal application I wrote for things I use frequently.

## User guide

- Quickstart (non-technical): `docs/quickstart.md`
- High-level feature guide: `docs/user-guide.md`
- Public API guide: `docs/public-api.md`
- Public API OpenAPI spec: `docs/public-api.openapi.yaml`
- Hosted Public API docs: `/api/public/v1/docs`
- Hosted Public API OpenAPI spec: `/api/public/v1/openapi.yaml`

## Checklists

These are lists that you can use as a TODO of sorts. But they shine when you
use them for things you do regularly, like making a list of things that you
pack for travel. You can just reset the list and complete things the next time
you travel without having to create a new list.

It also has some handy things like a note field and time estimate that counts
for you. For example:

- Do this, 15m
- Do that, 15m
- Do this other thing, 2h
- Do that other thing, 1h

Total 3.5h

There are also some actions like hiding completed, clearing items, clearing
completed items, duplicating, etc. that make it useful for everyday usage.

Oh and you can do everything with your keyboard easily. Hitting enter when
focused on a checklist item input creates a new item and focuses to it. And
everything else is standard keyboard accessibility like Tab, etc.

## Journals

I journal a lot of my phone and wanted to have bullet points without typing `-
` or `* `, so each new line makes a new bullet point. There are also some
number sliders to rate how well you each day for different things, like "mood
level", "energy level", "relationships", etc. I may graph this data over time
to see how well I do over time, we'll see!

## Prerequisites

- Node.js
- Docker

## Getting started

> This section is a work in progress

- Clone the repo
- Install your dependencies with `npm install`
- Create a Vercel project and free Vercel KV store
- Pull your Vercel config using the Vercel CLI
- Add an environment variable called `AUTH_SECRET` in your
  `.env.development.local` file. This will be your password for logging in.
  You'll also add this environment variable in the Vercel console. I recommend
  using a different one for local development vs production.

### Running the local dev server

- In a terminal, start the dev server with `npm run dev`
- In another terminal, start the local Redis server with `docker compose up`
- Login with any username, and the value you set for `AUTH_SECRET` as your
  password. All checklists and journals will be stored under this username.

### Deploying

- Connect your cloned repo to Vercel for auto-deployment and it'll auto deploy
  when you push to the repo
- Infrastructure (CDK) deploy setup lives in `docs/infra-ci-setup.md`
- Pulling AWS app secrets:
  - `scripts/pull-aws-secrets.sh` now supports both accounts:
    - Pulls `dev` secret values into `.env.local`
    - Prints `prod` secret values as `KEY=VALUE` lines for Vercel paste
  - Configure either shell env vars or `.env.local` values:
    - Optional profiles: `AWS_PROFILE_DEV`, `AWS_PROFILE_PROD`
  - Run:
    - `./scripts/pull-aws-secrets.sh`

## Vercel environment variables

Set these in your Vercel project for Production (and Preview if you want those
deployments to fully work with AWS + embeddings too).

### Centralized in `src/lib/env.*`

### Required

- `AUTH_SECRET`
  - Password/JWT signing secret used by auth flows.
- `VERCEL_PROJECT_PRODUCTION_URL`
  - Your production host name (for example `app.example.com`, no protocol).
- `AWS_REGION`
  - AWS region for S3/S3 Vectors clients (example: `us-east-1`).
- `AWS_ACCESS_KEY_ID`
  - Access key used as master credentials for role assumption.
- `AWS_SECRET_ACCESS_KEY`
  - Secret for the above access key.
- `AWS_ROLE_ARN`
  - Role ARN the app assumes for AWS operations.
- `AWS_BUCKET_NAME`
  - S3 bucket name used for journal/checklist asset uploads.
- `AWS_TABLE_NAME`
  - Shared DynamoDB table name used by app workflows (including transcription jobs).
- `AWS_TRANSCRIPTION_JOBS_QUEUE_URL`
  - SQS queue URL used by the app to enqueue transcription jobs.
- `AWS_JOURNAL_VECTOR_BUCKET_NAME`
  - S3 Vector bucket name for journal embeddings.
- `AWS_JOURNAL_VECTOR_INDEX_NAME`
  - S3 Vector index name used for query/upsert/delete.
- `AWS_JOURNAL_VECTOR_DIMENSION`
  - Embedding dimension (must match your index, example: `1024`).

### Optional (centralized in `src/lib/env.*`)

- `NODE_ENV`
  - Defaults to `development` locally. Vercel sets this automatically.
- `ADMIN_USERNAMES`
  - Comma-separated usernames allowed to access `/journals/vectors` and run
    embedding backfill (example: `sean,alice`).
- `JOURNAL_VECTOR_TOP_K`
  - Candidate count before post-filtering (default `40`).
- `JOURNAL_VECTOR_MAX_DISTANCE`
  - Distance cutoff for semantic matches (default `0.9`).
- `MIN_JOURNAL_ANALYSIS_CHARS`
  - Minimum content length before running AI analysis (default `40`).
- `LOG_LEVEL`
  - Logger level (default `info`).
- `OPENAI_JOURNAL_ANALYSIS_MODEL`
  - Journal AI analysis model (default `gpt-4o-mini`).
- `VERCEL_GIT_COMMIT_SHA`
  - Optional build metadata injected by Vercel.
- `NEXT_PUBLIC_THEME_OVERRIDE`
  - Optional client theme override (`light`, `dark`, or `system`).

### Additional required runtime secrets / integrations (not in `src/lib/env.*`)

- `OPENAI_API_KEY`
  - Required for journal embeddings and audio transcription (and lambda transcription worker secret loading).

### Lambda transcription worker runtime env (deployed function)

These are consumed by the transcription worker runtime
(`src/lambda/transcription-worker/index.ts` and `src/lambda/transcription-worker/env.ts`).

### Required

- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `AWS_TABLE_NAME`
- `AWS_APP_SECRET_NAME`
  - Secrets Manager secret name containing app secret JSON. The worker currently
    reads `OPENAI_API_KEY` from this secret.
- `OPENAI_AUDIO_TRANSCRIPTION_MODEL`
  - Speech-to-text model used by the worker.
- `OPENAI_JOURNAL_STRUCTURING_MODEL`
  - Structuring model used by the worker.

### Optional

- `LOG_LEVEL`
- `NODE_ENV`

### Required via Vercel KV integration

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If you connect Vercel KV through the Vercel integration, these are usually
added automatically.

## Infra CDK environment variables / secrets

These are used by `infra/lib/env.ts` during CDK synth/deploy (including
`.github/workflows/infra-cdk.yml`).

### Required

- `BASE_URL`
  - Production host name (no protocol), used for infra config like bucket CORS.
- `OPENAI_API_KEY`
  - Included in the app secret payload provisioned for runtime consumers (for
    example the transcription worker).
- `OPENAI_AUDIO_TRANSCRIPTION_MODEL`
  - Passed through to the transcription worker Lambda environment.
- `OPENAI_JOURNAL_STRUCTURING_MODEL`
  - Passed through to the transcription worker Lambda environment.
- `AWS_ACCOUNT`
- `AWS_REGION`
- `AWS_ALARM_EMAIL`
- `AWS_JOURNAL_VECTOR_DIMENSION`

### GitHub Actions (`.github/workflows/infra-cdk.yml`)

The workflow should provide the above via repo/org `vars` and `secrets`
(currently using `vars.AWS_REGION_PROD`, `vars.AWS_JOURNAL_VECTOR_DIMENSION`,
and production secrets for host/API key values).

## Technology

- Next.js/React
- Vercel
- Tailwind
- Redis
- Purify.ts
- Docker (for local Redis server)

## Tenets

- Typesafe: Makes it much easier to code in
- Private: I didn't want to share my inner most journal entries and thoughts on
  a public app that any engineer could read if they wanted to
- Access to my data: In the same vein as privacy, I want to be able to download
  all of my data anytime I want
- Functional style: It makes things easy with Monads to handle runtime
  validation and chaining async operations with nice error handling.
- Simple architecture: Vercel and Redis. No infrastructure as code needed for
  an app this simple.
- Minimalistic UI: Nothing fancy, just easy to use and works great on mobile.

## License

MIT
