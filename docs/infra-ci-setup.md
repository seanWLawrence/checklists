# Infra CI Setup (Prod in GitHub, Dev Local)

This repo is configured for:

- `prod` infra deploys from GitHub Actions
- `dev` infra deploys from your local machine

Workflow file: `.github/workflows/infra-cdk.yml`

## 1) GitHub setup (prod only)

Create GitHub environment:

- `production`

Enable required reviewers on `production` to gate deploys.

Add GitHub secret:

- `AWS_ROLE_TO_ASSUME_PROD` = IAM role ARN in prod account
- `OPENAI_API_KEY` = OpenAI API key copied into the generated AWS app secret

Add GitHub variables:

- `BASE_URL` (example: `app.seanwlawrence.com`, hostname only, no protocol)
- `AWS_REGION` (example: `us-east-1`)
- `AWS_ALARM_EMAIL` (example: `alerts@example.com`)
- `AWS_JOURNAL_VECTOR_DIMENSION` (example: `1024`)
- `OPENAI_TRANSCRIPTION_MODEL` (example: `whisper-1`)
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL` (example: `gpt-4o-mini`)

## 2) AWS setup for GitHub OIDC deploy role (prod account)

Do this in the **prod account**.

### 2.1 Create OIDC provider (one-time per account)

IAM -> Identity providers -> Add provider:

- Provider type: `OpenID Connect`
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2.2 Create deploy role for GitHub

IAM -> Roles -> Create role:

- Trusted entity type: `Web identity`
- Identity provider: `token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Use this trust policy (replace org/repo):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<PROD_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<ORG>/<REPO>:environment:production"
        }
      }
    }
  ]
}
```

Recommended role name:

- `github-actions-cdk-deploy-prod`

### 2.3 Role permissions

Grant permissions needed for CDK deploy in prod:

- CloudFormation stack create/update/delete
- IAM pass role and IAM resources used by your stack
- S3/ECR/CDK bootstrap asset access
- Services used in this stack (S3, S3 Vectors, Secrets Manager, IAM)

If you use modern CDK bootstrap, you can scope this role to bootstrap resources/roles for tighter permissions.

## 3) Local setup for dev deploys

Keep dev deploys on your machine.

Local env vars for dev:

- `AWS_ACCOUNT=<DEV_ACCOUNT_ID>`
- `AWS_REGION=<DEV_REGION>`
- `NODE_ENV=development`
- `AWS_JOURNAL_VECTOR_DIMENSION=1024` (or your value)

Deploy:

```bash
cd infra
npm ci
npm run cdk -- bootstrap
npm run cdk -- deploy --all
```

## 4) Workflow behavior

Automatic:

- On push to `main` with changes under `infra/**`
- Runs in GitHub `production` environment
- Runs `cdk diff`, then `cdk deploy`

Manual:

- Run workflow `Infra CDK (Prod)` from Actions tab
- Choose `diff` or `deploy`

The workflow always sets:

- `BASE_URL` from GitHub `BASE_URL`
- `AWS_REGION` from GitHub `AWS_REGION`
- `AWS_ACCOUNT` from AWS caller identity
- `AWS_JOURNAL_VECTOR_DIMENSION` from `AWS_JOURNAL_VECTOR_DIMENSION`
- `AWS_ALARM_EMAIL` from `AWS_ALARM_EMAIL`
- `OPENAI_API_KEY` from GitHub secret
- `OPENAI_TRANSCRIPTION_MODEL` from `OPENAI_TRANSCRIPTION_MODEL`
- `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL` from `OPENAI_TRANSCRIPTION_STRUCTURING_MODEL`

## 5) Completion checklist

1. Create prod OIDC provider.
2. Create prod GitHub deploy role.
3. Add GitHub secret/variables listed above.
4. Enable required reviewers in GitHub `production` environment.
5. Push a small `infra/**` change to `main` and confirm approval + deploy.
