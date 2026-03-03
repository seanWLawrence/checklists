# Infra (AWS CDK)

This folder deploys:

- S3 assets bucket + CORS policy
- S3 Vectors bucket + index
- Shared DynamoDB table
- SQS jobs queue + DLQ
- Lambda worker for journal transcription
- CloudWatch alarms + SNS alarm topic
- IAM user/role/policy for app AWS access
- AWS Secrets Manager app secret used by the Next.js app and worker

## Local CDK env

CDK reads from `infra/.env` (or shell env vars). Use [infra/.env.example](/Users/sean/workplace/checklists/infra/.env.example) as the template.

Required:

- `BASE_URL`
  - Production app hostname only, no protocol.
  - Used for S3 CORS allowlist.
- `OPENAI_API_KEY`
  - Stored in the generated AWS app secret.
- `OPENAI_TRANSCRIPTION_MODEL`
  - Passed to the worker Lambda environment.
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`
  - Passed to the worker Lambda environment.
- `AWS_ACCOUNT`
  - Target AWS account ID.
- `AWS_REGION`
  - Target AWS region.
- `AWS_ALARM_EMAIL`
  - Email subscribed to the shared SNS alarm topic.
  - You must confirm the SNS subscription email after deploy.
- `AWS_JOURNAL_VECTOR_DIMENSION`
  - Must match the app embedding dimension (currently `1024`).

## Deploying from your machine

1. Copy the template: `cp infra/.env.example infra/.env`
2. Fill in the production values.
3. Install infra dependencies: `cd infra && npm ci`
4. Bootstrap the target account/region once: `npx cdk bootstrap`
5. Deploy: `npm run deploy`

## Production GitHub Actions env

The production CDK workflow is [infra-cdk.yml](/Users/sean/workplace/checklists/.github/workflows/infra-cdk.yml).

Configure the `production` GitHub environment with:

GitHub `secrets`:

- `AWS_ROLE_TO_ASSUME_PROD`
  - IAM role ARN used by GitHub OIDC to deploy CDK in prod.
- `OPENAI_API_KEY`
  - Copied into the generated AWS app secret.

GitHub `vars`:

- `BASE_URL`
  - Production app hostname only, no protocol.
- `AWS_REGION`
- `AWS_ALARM_EMAIL`
- `AWS_JOURNAL_VECTOR_DIMENSION`
- `OPENAI_TRANSCRIPTION_MODEL`
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`

The workflow resolves `AWS_ACCOUNT` dynamically from STS, so you do not need to store `AWS_ACCOUNT` in GitHub.

## Runtime secret handoff after deploy

This stack creates an AWS Secrets Manager secret containing app runtime values such as:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ROLE_ARN`
- `AWS_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_INDEX_NAME`
- `AWS_JOURNAL_VECTOR_DIMENSION`
- `AWS_TABLE_NAME`
- `AWS_JOBS_QUEUE_URL`
- `OPENAI_API_KEY`

Those values are consumed by:

- the Next.js app runtime (`.env.local` locally, Vercel env vars in prod)
- the Lambda worker indirectly, via `AWS_APP_SECRET_NAME` so it can read `OPENAI_API_KEY`

After deploy:

1. Pull the generated secret values with `./scripts/pull-aws-secrets.sh`
2. Put the app runtime values into Vercel Production env vars
3. Redeploy Vercel after env var updates if needed

## Worker Lambda runtime env

The worker Lambda environment itself is set by CDK. You do not set these in Vercel.

Required on the deployed function:

- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `AWS_TABLE_NAME`
- `AWS_APP_SECRET_NAME`
- `OPENAI_TRANSCRIPTION_MODEL`
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`

Optional on the deployed function:

- `MAX_RECEIVE_ATTEMPTS`
- `TIMEOUT_IN_MIN`

## Notes

- Keep `AWS_JOURNAL_VECTOR_DIMENSION` aligned across infra and app runtime.
- `OPENAI_TRANSCRIPTION_MODEL` should use a real model id such as `whisper-1`.
- Re-deploying can rotate secret values stored in Secrets Manager.
