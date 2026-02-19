"use client";

import { useActionState, useMemo, useState } from "react";

import { Fieldset } from "@/components/fieldset";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { SubmitButton } from "@/components/submit-button";
import {
  API_TOKEN_SCOPES,
  type ApiTokenScope,
} from "@/lib/auth/api-token/api-token-scopes";
import {
  createApiTokenAction,
  type CreateApiTokenActionResult,
} from "./actions/create-api-token.action";

const initialState: CreateApiTokenActionResult = { ok: false, error: "" };
const scopeLabel = (scope: ApiTokenScope): string =>
  scope.replace(":", " / ");

export const CreateApiTokenForm: React.FC = () => {
  const [selectedScopes, setSelectedScopes] = useState<Set<ApiTokenScope>>(
    new Set(),
  );
  const [state, formAction] = useActionState(
    createApiTokenAction,
    initialState,
  );

  const selectedScopeCount = useMemo(
    () => selectedScopes.size,
    [selectedScopes],
  );

  return (
    <form action={formAction} className="space-y-2 max-w-prose">
      <Fieldset legend="Create token">
        <div className="space-y-2">
          <Label label="Token name">
            <Input
              name="name"
              required
              placeholder="e.g. Codex note writer"
              autoComplete="off"
            />
          </Label>

          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Tokens currently expire in 1 year.
          </p>
        </div>
      </Fieldset>

      <Fieldset legend="Scopes">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="underline underline-offset-2 text-xs"
              onClick={() => setSelectedScopes(new Set(API_TOKEN_SCOPES))}
            >
              Enable all
            </button>

            <button
              type="button"
              className="underline underline-offset-2 text-xs"
              onClick={() => setSelectedScopes(new Set())}
            >
              Disable all
            </button>

            <span className="text-xs text-zinc-600 dark:text-zinc-300">
              {selectedScopeCount} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {API_TOKEN_SCOPES.map((scope) => {
              const checked = selectedScopes.has(scope);

              return (
                <label
                  key={scope}
                  className="inline-flex items-center gap-2 rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    name="scopes"
                    value={scope}
                    checked={checked}
                    onChange={(event) => {
                      const next = new Set(selectedScopes);

                      if (event.target.checked) {
                        next.add(scope);
                      } else {
                        next.delete(scope);
                      }

                      setSelectedScopes(next);
                    }}
                    className="accent-blue-500"
                  />
                  <span>{scopeLabel(scope)}</span>
                </label>
              );
            })}
          </div>
        </div>
      </Fieldset>

      <div className="flex justify-end">
        <SubmitButton variant="primary" disabled={selectedScopeCount === 0}>
          Create token
        </SubmitButton>
      </div>

      {state.ok && (
        <Fieldset legend="New token">
          <div className="space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Copy this token now. You will not be able to see it again.
            </p>
            <Input readOnly value={state.token} className="font-mono text-xs" />
          </div>
        </Fieldset>
      )}

      {!state.ok && state.error !== "" && (
        <p className="text-xs text-red-700 dark:text-red-300">{state.error}</p>
      )}
    </form>
  );
};
