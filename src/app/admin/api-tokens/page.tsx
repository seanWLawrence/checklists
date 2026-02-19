import "server-only";

import { redirect } from "next/navigation";

import { CreateApiTokenForm } from "./create-api-token-form.client";
import { Heading } from "@/components/heading";
import { Fieldset } from "@/components/fieldset";
import { SubmitButton } from "@/components/submit-button";
import { getAllApiTokensForUser } from "@/lib/auth/api-token/get-all-api-tokens-for-user";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { revokeApiTokenAction } from "./actions/revoke-api-token.action";
import { getUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";

const ApiTokensPage: React.FC = async () => {
  const userMaybe = await getUser({});

  if (!userMaybe.isJust()) {
    redirect("/login");
  }

  const user = userMaybe.extract();

  if (!isAdminUsername(user.username)) {
    return (
      <section className="space-y-2">
        <Heading level={1}>API tokens</Heading>
        <p className="text-sm text-zinc-600">Not authorized.</p>
      </section>
    );
  }

  const tokens = (await getAllApiTokensForUser({ user }).run()).orDefault([]);

  return (
    <section className="space-y-4">
      <Heading level={1}>API tokens</Heading>

      <CreateApiTokenForm />

      <Fieldset legend={`Existing tokens (${tokens.length})`}>
        {tokens.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No API tokens yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {tokens.map((token) => (
              <li
                key={token.id}
                className="rounded border border-zinc-200 dark:border-zinc-700 p-2 space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{token.name}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      {token.id}
                    </p>
                  </div>

                  {!token.revokedAtIso && (
                    <form action={revokeApiTokenAction}>
                      <input type="hidden" name="id" value={token.id} />
                      <SubmitButton variant="outline">Revoke</SubmitButton>
                    </form>
                  )}
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  Expires: {token.expiresAtIso.toISOString()}
                </p>

                {token.revokedAtIso && (
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Revoked: {token.revokedAtIso.toISOString()}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {token.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-xs"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Fieldset>
    </section>
  );
};

export default ApiTokensPage;
