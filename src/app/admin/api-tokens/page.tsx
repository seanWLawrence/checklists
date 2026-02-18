import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { getAllApiTokensForUser } from "@/lib/auth/api-token/get-all-api-tokens-for-user";

export const dynamic = "force-dynamic";

const ApiTokensPage: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    if (!isAdminUsername(user.username)) {
      return throwE("Not authorized to access API token tools");
    }

    const tokens = await fromPromise(getAllApiTokensForUser({ user }));

    return (
      <section className="space-y-4">
        <Heading level={1}>API tokens</Heading>

        <p className="text-sm text-zinc-600">
          Token management UI will live here. Current token count: {tokens.length}
        </p>
      </section>
    );
  }).mapLeft((error) => {
    return (
      <section className="space-y-2">
        <Heading level={1}>API tokens</Heading>
        <p className="text-sm text-zinc-600">Failed to load token tools.</p>
        <pre className="text-xs text-red-800">{String(error)}</pre>
      </section>
    );
  });

  return page.extract();
};

export default ApiTokensPage;
