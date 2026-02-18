import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { LinkButton } from "@/components/link-button";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { isAdminUsername } from "@/lib/auth/is-admin-username";

export const dynamic = "force-dynamic";

const AdminPage: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    if (!isAdminUsername(user.username)) {
      return throwE("Not authorized to access admin tools");
    }

    return (
      <section className="space-y-4">
        <Heading level={1}>Admin</Heading>

        <div className="flex flex-wrap items-center gap-2">
          <LinkButton href="/admin/debug" variant="outline">
            Vector debug
          </LinkButton>

          <LinkButton href="/admin/api-tokens" variant="outline">
            API tokens
          </LinkButton>

          <LinkButton href="/admin/user-credential-generator" variant="outline">
            Credential generator
          </LinkButton>
        </div>
      </section>
    );
  }).mapLeft((error) => {
    return (
      <section className="space-y-2">
        <Heading level={1}>Admin</Heading>
        <p className="text-sm text-zinc-600">Failed to load admin dashboard.</p>
        <pre className="text-xs text-red-800">{String(error)}</pre>
      </section>
    );
  });

  return page.extract();
};

export default AdminPage;
