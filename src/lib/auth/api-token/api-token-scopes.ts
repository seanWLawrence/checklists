export const API_TOKEN_SCOPES = [
  "notes:create",
  "notes:read",
  "notes:list",
  "notes:update",
  "checklists:create",
  "checklists:read",
  "checklists:list",
  "checklists:update",
  "checklists:generate-share-link",
] as const;

export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number];
