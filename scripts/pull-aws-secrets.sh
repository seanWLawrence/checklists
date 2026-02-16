#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.local"

get_from_env_file() {
  local key="$1"
  npx @dotenvx/dotenvx get "$key" -f "$ENV_FILE" --quiet 2>/dev/null || true
}

DEV_SECRET_NAME="${AWS_SECRET_NAME_DEV:-}"
PROD_SECRET_NAME="${AWS_SECRET_NAME_PROD:-}"
DEV_PROFILE="${AWS_PROFILE_DEV:-${AWS_PROFILE:-}}"
PROD_PROFILE="${AWS_PROFILE_PROD:-${AWS_PROFILE:-}}"

if [ -z "$DEV_SECRET_NAME" ]; then
  DEV_SECRET_NAME="$(get_from_env_file AWS_SECRET_NAME_DEV)"
fi

if [ -z "$PROD_SECRET_NAME" ]; then
  PROD_SECRET_NAME="$(get_from_env_file AWS_SECRET_NAME_PROD)"
fi

if [ -z "$DEV_PROFILE" ]; then
  DEV_PROFILE="$(get_from_env_file AWS_PROFILE_DEV)"
fi

if [ -z "$PROD_PROFILE" ]; then
  PROD_PROFILE="$(get_from_env_file AWS_PROFILE_PROD)"
fi

aws_secret_to_entries() {
  local secret_name="$1"
  local aws_profile="${2:-}"

  if [ -n "$aws_profile" ]; then
    aws --profile "$aws_profile" secretsmanager get-secret-value --secret-id "$secret_name" --query SecretString --output json
  else
    aws secretsmanager get-secret-value --secret-id "$secret_name" --query SecretString --output json
  fi
}

upsert_entries_into_env_file() {
  while IFS= read -r line; do
    local key="${line%%=*}"
    local value="${line#*=}"
    npx @dotenvx/dotenvx set "$key" "$value" -f "$ENV_FILE" --plain >/dev/null
  done
}

if [ -n "$DEV_SECRET_NAME" ]; then
  echo "Pulling dev secret '$DEV_SECRET_NAME' into $ENV_FILE..."
  aws_secret_to_entries "$DEV_SECRET_NAME" "$DEV_PROFILE" |
    jq -r 'if type == "string" then fromjson else . end | to_entries[] | "\(.key)=\(.value)"' |
    upsert_entries_into_env_file
  echo "Updated $ENV_FILE from dev secret."
else
  echo "Skipping dev pull: missing AWS_SECRET_NAME_DEV (or AWS_SECRET_NAME)." >&2
fi

if [ -n "$PROD_SECRET_NAME" ]; then
  echo
  echo "Production values (paste into Vercel env vars):"
  aws_secret_to_entries "$PROD_SECRET_NAME" "$PROD_PROFILE" |
    jq -r 'if type == "string" then fromjson else . end | to_entries[] | "\(.key)=\(.value)"'
else
  echo "Skipping prod print: missing AWS_SECRET_NAME_PROD." >&2
fi
