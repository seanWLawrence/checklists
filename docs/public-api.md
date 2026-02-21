# Public API

This API is for token-authenticated automation (for example agents).

## Base URL and Versioning

- Current stable version: `/api/public/v1`

## Agent Quickstart

Use these rules exactly:

1. Send `Authorization: Bearer <API_TOKEN>` on every request.
2. Send JSON with `Content-Type: application/json`.
3. Handle auth and throttle errors:
   - `401` -> `{"error":"Unauthorized"}`
   - `403` -> `{"error":"Forbidden"}`
   - `429` -> `{"error":"Too Many Requests"}` (check `Retry-After` header)
4. For checklist `content`, follow the checklist grammar section below.
5. For note `content`, use GitHub-flavored markdown.

## Authentication

- Header: `Authorization: Bearer <token>`
- Token format: `pat_<username>.<tokenId>.<secret>`
- Tokens are scoped. Missing scope returns `403`.
- Expired or revoked tokens return `401`.

## Token Expiry and Revocation

- API tokens default to expiring in 1 year from creation.
- Expired tokens are rejected with `401`.
- Revoked tokens are rejected with `401`.
- Successful requests update `lastUsedAtIso` and token `updatedAtIso`.

## Rate Limiting

- Limit: `120` requests per `60` seconds per token.
- On limit exceed:
  - Status: `429`
  - Header: `Retry-After: 60`

## Scopes

- `notes:create`
- `notes:read`
- `notes:list`
- `notes:update`
- `checklists:create`
- `checklists:read`
- `checklists:list`
- `checklists:update`
- `checklists:generate-share-link`

## Endpoint Behavior

- `POST` create endpoints are not idempotent. Retrying can create duplicates.
- `PATCH` endpoints update `updatedAtIso` when a change is accepted.
- `500` can occur for unexpected server-side failures; treat as retryable with backoff.

## Endpoints

### Notes

- `GET /api/public/v1/notes` (`notes:list`)
- `POST /api/public/v1/notes` (`notes:create`)
  - body: `{ "name": string, "content": string }`
- `GET /api/public/v1/notes/{id}` (`notes:read`)
- `PATCH /api/public/v1/notes/{id}` (`notes:update`)
  - body: `{ "name"?: string, "content"?: string }`
  - at least one field required
  - body is GitHub-flavored Markdown format

### Checklists

- `GET /api/public/v1/checklists` (`checklists:list`)
- `POST /api/public/v1/checklists` (`checklists:create`)
  - body: `{ "name": string, "content": string }`
- `GET /api/public/v1/checklists/{id}` (`checklists:read`)
- `PATCH /api/public/v1/checklists/{id}` (`checklists:update`)
  - body: `{ "name"?: string, "content"?: string }`
  - at least one field required
- `POST /api/public/v1/checklists/{id}/share-links` (`checklists:generate-share-link`)
  - returns one share token/url
  - share link expires in 24h

## Checklist Content Grammar

Checklist `content` is parsed using newline/blank-line structure.

Rules:

1. A checklist is split into sections by blank lines (`\n\n`).
2. First line of each section is the section name.
3. Each following non-empty line is an item.
4. Item line syntax:
   - `--` prefix marks item as completed.
   - `( ... )` optional note.
   - `10m` or `2h` optional time estimate.

Examples:

```txt
Morning
Drink water
--Workout (legs) 45m

Work
Ship API docs 1h
--Review PR (token auth) 20m
```

Notes:

- Keep one note group per line for predictable parsing.
- Keep time estimate as a single token ending with `m` or `h`.

## cURL Examples

Create note:

```bash
curl -i -X POST 'http://localhost:3000/api/public/v1/notes' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  --data-raw '{"name":"Agent note","content":"Created by API"}'
```

Create checklist:

```bash
curl -i -X POST 'http://localhost:3000/api/public/v1/checklists' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  --data-raw '{"name":"Agent checklist","content":"Today\nDraft plan\n--Ship v1 1h"}'
```

Generate share link:

```bash
curl -i -X POST 'http://localhost:3000/api/public/v1/checklists/CHECKLIST_UUID/share-links' \
  -H 'Authorization: Bearer YOUR_API_TOKEN'
```
