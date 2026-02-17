# Infra (AWS CDK)

This folder deploys:

- S3 assets bucket + CORS policy
- S3 Vectors bucket + index
- IAM user/role/policy for app AWS access
- AWS Secrets Manager secret containing app runtime AWS values

## Required environment variables

CDK reads these from `infra/.env` (or shell env vars).

- `NODE_ENV`
  - `development` or `production`
  - Controls stack name: `infra-dev` or `infra-prod`
- `AWS_ACCOUNT`
  - Target AWS account ID
- `AWS_REGION`
  - Target region (must support S3 Vectors)
- `AWS_JOURNAL_VECTOR_DIMENSION`
  - Vector dimension for the index (for current embeddings: `1024`)
- `VERCEL_PROJECT_PRODUCTION_URL`
  - Host used in S3 CORS allowlist
  - Use host only (example: `app.example.com`, no `https://`)

Use `infra/.env.example` as the template.

## Local setup

1. Copy env template:
   - `cp infra/.env.example infra/.env`
2. Update values for your target account/environment.
3. Install dependencies:
   - `cd infra && npm ci`

## Deploy

Run from `infra/`:

```bash
npm run cdk -- bootstrap
npm run cdk -- deploy --all
```

## External setup (outside this repo)

1. AWS accounts:
   - Create separate `dev` and `prod` AWS accounts (recommended).
2. AWS credentials on your machine:
   - Configure CLI credentials/profiles with deploy permissions for each account.
3. CDK bootstrap:
   - Bootstrap each target account/region before first deploy.
4. Region support:
   - Ensure your chosen `AWS_REGION` supports S3 Vectors.
5. GitHub Actions (prod deploy):
   - Create OIDC provider and deploy role in prod account.
   - Configure GitHub environment/variables/secrets (see `docs/infra-ci-setup.md`).
6. Vercel runtime env vars:
   - After deploy, pull values from the generated AWS secret and set them in Vercel.
   - Use root script: `./scripts/pull-aws-secrets.sh`

## Outputs / secret handoff

This stack creates an AWS Secrets Manager secret with app runtime values such as:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ROLE_ARN`
- `AWS_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_BUCKET_NAME`
- `AWS_JOURNAL_VECTOR_INDEX_NAME`
- `AWS_JOURNAL_VECTOR_DIMENSION`

Those values are consumed by the app runtime (local `.env.local` and Vercel env vars).

## Notes

- Re-deploying updates resources and may rotate values stored in the generated secret.
- Keep `AWS_JOURNAL_VECTOR_DIMENSION` aligned between infra and app runtime.
