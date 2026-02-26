import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { SubmitButton } from "@/components/submit-button";
import {
  AWS_JOURNAL_VECTOR_BUCKET_NAME,
  AWS_JOURNAL_VECTOR_INDEX_NAME,
} from "@/lib/env.server";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { listVectors } from "@/lib/aws/s3vectors/list-vectors";
import { getAppEnvironment, isProduction } from "@/lib/env.server";
import { isAdminUsername } from "@/lib/auth/is-admin-username";

export const dynamic = "force-dynamic";

const parsePageSize = (raw?: string): number => {
  const value = raw ? Number(raw) : 100;
  if (!Number.isFinite(value)) {
    return 100;
  }

  return Math.max(1, Math.min(500, Math.floor(value)));
};

const VectorsDebugPage: React.FC<{
  searchParams?: Promise<{
    nextToken?: string;
    limit?: string;
  }>;
}> = async ({ searchParams }) => {
  const { nextToken, limit: rawLimit } = (await searchParams) ?? {};
  const limit = parsePageSize(rawLimit);
  const appEnvironment = getAppEnvironment();

  const page = await EitherAsync(async ({ fromPromise, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    if (!isAdminUsername(user.username)) {
      return throwE("Not authorized to access vector admin tools");
    }

    const listed = isProduction()
      ? { vectors: [], nextToken: undefined as string | undefined }
      : await fromPromise(
          listVectors({
            vectorBucketName: AWS_JOURNAL_VECTOR_BUCKET_NAME,
            indexName: AWS_JOURNAL_VECTOR_INDEX_NAME,
            maxResults: limit,
            nextToken,
          }),
        );

    const visibleVectors = listed.vectors.filter((vector) => {
      const username = vector.metadata?.username;
      const environment = vector.metadata?.environment;
      return (
        typeof username === "string" &&
        username === user.username &&
        typeof environment === "string" &&
        environment === appEnvironment
      );
    });

    return (
      <section className="space-y-4">
        <Heading level={1}>Journal vectors (debug)</Heading>

        {isProduction() && (
          <p className="text-sm text-zinc-600">
            Debug vector listing is hidden in production.
          </p>
        )}

        {!isProduction() && (
          <form action="/admin/debug" method="get" className="flex gap-2">
            <Label label="Page size">
              <Input
                name="limit"
                defaultValue={String(limit)}
                className="w-28"
              />
            </Label>
            <div className="self-end">
              <SubmitButton variant="primary">Reload</SubmitButton>
            </div>
          </form>
        )}

        {!isProduction() && (
          <div className="text-sm text-zinc-600 space-y-1">
            <p>Bucket: {AWS_JOURNAL_VECTOR_BUCKET_NAME}</p>
            <p>Index: {AWS_JOURNAL_VECTOR_INDEX_NAME}</p>
            <p>Environment: {appEnvironment}</p>
            <p>Current page vectors: {listed.vectors.length}</p>
            <p>
              Visible for user {user.username}: {visibleVectors.length}
            </p>
          </div>
        )}

        {!isProduction() &&
          (visibleVectors.length === 0 ? (
            <p className="text-sm text-zinc-600">
              No vectors visible on this page.
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleVectors.map((vector) => (
                <li
                  key={vector.key}
                  className="rounded-xl border-2 border-zinc-300 p-3 space-y-1"
                >
                  <p className="text-xs text-zinc-500 break-all">
                    {vector.key}
                  </p>
                  <pre className="text-xs text-zinc-700 overflow-x-auto">
                    {JSON.stringify(vector.metadata ?? {}, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ))}

        {!isProduction() && listed.nextToken && (
          <form action="/admin/debug" method="get">
            <input type="hidden" name="nextToken" value={listed.nextToken} />
            <input type="hidden" name="limit" value={String(limit)} />
            <SubmitButton variant="outline">Next page</SubmitButton>
          </form>
        )}
      </section>
    );
  }).mapLeft((error) => {
    return (
      <div className="space-y-2">
        <Heading level={1}>Journal vectors (debug)</Heading>
        <p className="text-sm text-zinc-600">Failed to load vectors.</p>
        <pre className="text-xs text-red-800">{String(error)}</pre>
      </div>
    );
  });

  return page.extract();
};

export default VectorsDebugPage;
