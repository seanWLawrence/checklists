if [ -z "$AWS_SECRET_NAME" ]; then
  AWS_SECRET_NAME=$(
    npx @dotenvx/dotenvx get AWS_SECRET_NAME -f .env.local --quiet 2>/dev/null
  )
fi

if [ -z "$AWS_SECRET_NAME" ]; then
  echo "Missing AWS_SECRET_NAME. Set it in .env.local or export it in the shell." >&2
  exit 1
fi

aws secretsmanager \
  get-secret-value \
  --secret-id "$AWS_SECRET_NAME" \
  --query SecretString \
  --output json |
  jq -r "if type == \"string\" then fromjson else . end | to_entries[] | \"\\(.key)=\\(.value)\"" |
  while IFS= read -r line; do
    key="${line%%=*}"
    value="${line#*=}"
    npx @dotenvx/dotenvx set "$key" "$value" -f .env.local --plain
  done
