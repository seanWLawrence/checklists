npx @dotenvx/dotenvx run -f .env -- bash -c '
  aws secretsmanager \
    get-secret-value \
    --secret-id "$AWS_SECRET_NAME" \
    --query SecretString \
    --output json \
  | jq -r "if type == \"string\" then fromjson else . end | to_entries[] | \"\\(.key)=\\(.value)\"" \
  | while IFS= read -r line; do
      key="${line%%=*}"
      value="${line#*=}"
      npx @dotenvx/dotenvx set "$key" "$value" -f .env
    done
'
