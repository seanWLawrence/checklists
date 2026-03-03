# Checklists and Journals

Personal app for recurring checklists and journaling.

## Guides

- Quickstart: `docs/quickstart.md`
- User guide: `docs/user-guide.md`
- Public API guide: `docs/public-api.md`
- Public API OpenAPI spec: `docs/public-api.openapi.yaml`
- Infra / CDK setup: `infra/README.md`
- GitHub Actions infra deploy setup: `docs/infra-ci-setup.md`

## Tech

- Next.js / React
- Vercel
- AWS (S3, DynamoDB, SQS, Lambda, Secrets Manager)
- Upstash / Vercel KV
- Purify.ts
- Docker (for local Redis fallback)

## Local development

Prerequisites:

- Node.js
- Docker

Setup:

1. Install dependencies: `npm install`
2. Copy the app env template: `cp .env.example .env.local`
3. Fill in the required local runtime values in `.env.local`
4. Start local Redis fallback: `docker compose up`
5. Start the app: `npm run dev`

For infra deployment from your machine, also:

1. Copy `infra/.env.example` to `infra/.env`
2. Fill in the CDK deploy values
3. Run `cd infra && npm ci`

## App runtime env (`.env.local` locally, Vercel env in prod)

Use [/.env.example](/Users/sean/workplace/checklists/.env.example) as the template.

Required:

- `AUTH_SECRET`
  - Password/JWT signing secret.
- `AWS_REGION`
- `AWS_ROLE_ARN`
  - App IAM role ARN assumed by the Next.js runtime.
- `AWS_ACCESS_KEY_ID`
  - Base IAM user access key used to assume `AWS_ROLE_ARN`.
- `AWS_SECRET_ACCESS_KEY`
  - Base IAM user secret used to assume `AWS_ROLE_ARN`.
- `AWS_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_INDEX_NAME`
- `AWS_JOURNAL_VECTOR_DIMENSION`
- `AWS_TABLE_NAME`
- `AWS_JOBS_QUEUE_URL`
  - Queue URL used by the app to enqueue transcription jobs.
- `OPENAI_API_KEY`
  - Required for app-side OpenAI usage (journal analysis / embeddings).

Production-required in Vercel:

- `VERCEL_PROJECT_PRODUCTION_URL`
  - Hostname only, no protocol.
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Optional:

- `NODE_ENV`
- `LOG_LEVEL`
- `ADMIN_USERNAMES`
- `JOURNAL_VECTOR_TOP_K`
- `JOURNAL_VECTOR_MAX_DISTANCE`
- `MIN_JOURNAL_ANALYSIS_CHARS`
- `OPENAI_JOURNAL_ANALYSIS_MODEL`
- `VERCEL_GIT_COMMIT_SHA`
- `NEXT_PUBLIC_THEME_OVERRIDE`
  - `light`, `dark`, or `system`

## Worker Lambda runtime env (managed by AWS CDK)

These are not Vercel env vars. They are set on the deployed Lambda by the CDK stack.

Required:

- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `AWS_TABLE_NAME`
- `AWS_APP_SECRET_NAME`
  - Secrets Manager secret name the worker reads to get `OPENAI_API_KEY`.
- `OPENAI_TRANSCRIPTION_MODEL`
  - Use a real model id such as `whisper-1`.
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`

Optional:

- `MAX_RECEIVE_ATTEMPTS`
- `TIMEOUT_IN_MIN`

## Infra CDK env (`infra/.env` locally, GitHub Actions env in prod)

Use [infra/.env.example](/Users/sean/workplace/checklists/infra/.env.example) as the template.

Required:

- `BASE_URL`
  - Production hostname only, no protocol.
- `OPENAI_API_KEY`
- `OPENAI_TRANSCRIPTION_MODEL`
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`
- `AWS_ACCOUNT`
- `AWS_REGION`
- `AWS_ALARM_EMAIL`
- `AWS_JOURNAL_VECTOR_DIMENSION`

## Production deployment checklist

### 1. AWS / CDK

Deploy the infra stack first. See [infra/README.md](/Users/sean/workplace/checklists/infra/README.md).

### 2. GitHub Actions production env

For `.github/workflows/infra-cdk.yml`, configure the `production` GitHub environment.

GitHub `secrets`:

- `AWS_ROLE_TO_ASSUME_PROD`
- `OPENAI_API_KEY`

GitHub `vars`:

- `BASE_URL`
- `AWS_REGION`
- `AWS_ALARM_EMAIL`
- `AWS_JOURNAL_VECTOR_DIMENSION`
- `OPENAI_TRANSCRIPTION_MODEL`
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`

### 3. Vercel production env

After infra deploy, pull the generated AWS app secret values:

- `./scripts/pull-aws-secrets.sh`

Set the resulting runtime values in Vercel Production:

- `AUTH_SECRET`
- `VERCEL_PROJECT_PRODUCTION_URL`
- `AWS_REGION`
- `AWS_ROLE_ARN`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_INDEX_NAME`
- `AWS_JOURNAL_VECTOR_DIMENSION`
- `AWS_TABLE_NAME`
- `AWS_JOBS_QUEUE_URL`
- `OPENAI_API_KEY`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Optional but recommended in Vercel:

- `LOG_LEVEL=info`
- `OPENAI_JOURNAL_ANALYSIS_MODEL=gpt-4o-mini`
- `ADMIN_USERNAMES=<comma-separated admins>`

### 4. Redeploy

After Vercel env vars are set, redeploy the app so all runtime env changes take effect.

## Notes

- Local development uses the Docker Redis fallback instead of Vercel KV.
- The app runtime and the worker runtime are separate env surfaces. Do not put Lambda-only vars into Vercel unless you intentionally need them there.
- The app runtime key is `AWS_JOBS_QUEUE_URL`, not `AWS_TRANSCRIPTION_JOBS_QUEUE_URL`.
