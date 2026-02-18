import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { GenerateUserCredentialsClient } from "./generate-user-credentials.client";

export const dynamic = "force-dynamic";

const AdminUserCredentialGeneratorPage: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    if (!isAdminUsername(user.username)) {
      return throwE("Not authorized to access credential tools");
    }

    return (
      <div className="space-y-4">
        <GenerateUserCredentialsClient />
      </div>
    );
  }).mapLeft((error) => {
    return (
      <section className="space-y-2">
        <Heading level={1}>Generate user credentials</Heading>
        <p className="text-sm text-zinc-600">Failed to load credential tools.</p>
        <pre className="text-xs text-red-800">{String(error)}</pre>
      </section>
    );
  });

  return page.extract();
};

export default AdminUserCredentialGeneratorPage;
