import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { SubmitButton } from "@/components/submit-button";
import { LinkButton } from "@/components/link-button";
import {
  AWS_JOURNAL_VECTOR_BUCKET_NAME,
  AWS_JOURNAL_VECTOR_INDEX_NAME,
} from "@/lib/secrets";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { listVectors } from "@/lib/aws/s3vectors/list-vectors";
import { getAppEnvironment, isProduction } from "@/lib/environment";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { backfillJournalEmbeddingsAction } from "../actions/backfill-journal-embeddings.action";
import { backfillJournalAnalysisAction } from "../actions/backfill-journal-analysis.action";

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
    backfillTotal?: string;
    backfillSuccess?: string;
    backfillFailed?: string;
    backfillError?: string;
    analysisBackfillTotal?: string;
    analysisBackfillSuccess?: string;
    analysisBackfillFailed?: string;
    analysisBackfillError?: string;
  }>;
}> = async ({ searchParams }) => {
  const {
    nextToken,
    limit: rawLimit,
    backfillTotal,
    backfillSuccess,
    backfillFailed,
    backfillError,
    analysisBackfillTotal,
    analysisBackfillSuccess,
    analysisBackfillFailed,
    analysisBackfillError,
  } = (await searchParams) ?? {};
  const limit = parsePageSize(rawLimit);
  const appEnvironment = getAppEnvironment();
  const backfillTotalNumber =
    typeof backfillTotal === "string" ? Number(backfillTotal) : undefined;
  const backfillSuccessNumber =
    typeof backfillSuccess === "string" ? Number(backfillSuccess) : undefined;
  const backfillFailedNumber =
    typeof backfillFailed === "string" ? Number(backfillFailed) : undefined;
  const hasBackfillError = backfillError === "1";
  const analysisBackfillTotalNumber =
    typeof analysisBackfillTotal === "string"
      ? Number(analysisBackfillTotal)
      : undefined;
  const analysisBackfillSuccessNumber =
    typeof analysisBackfillSuccess === "string"
      ? Number(analysisBackfillSuccess)
      : undefined;
  const analysisBackfillFailedNumber =
    typeof analysisBackfillFailed === "string"
      ? Number(analysisBackfillFailed)
      : undefined;
  const hasAnalysisBackfillError = analysisBackfillError === "1";

  const page = await EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    if (!isAdminUsername(user.username)) {
      return throwE("Not authorized to access vector admin tools");
    }

    const vectorBucketName = await liftEither(AWS_JOURNAL_VECTOR_BUCKET_NAME);
    const indexName = await liftEither(AWS_JOURNAL_VECTOR_INDEX_NAME);

    const listed = isProduction()
      ? { vectors: [], nextToken: undefined as string | undefined }
      : await fromPromise(
          listVectors({
            vectorBucketName,
            indexName,
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

        <div className="flex items-center gap-2">
          <LinkButton href="/journals" variant="outline">
            Back to journals
          </LinkButton>
        </div>

        <form action={backfillJournalEmbeddingsAction} className="space-y-2">
          <input type="hidden" name="redirectTo" value="/journals/vectors" />
          <input type="hidden" name="limit" value={String(limit)} />
          <input type="hidden" name="nextToken" value={nextToken ?? ""} />
          <SubmitButton variant="outline">
            Backfill Embeddings (one-time)
          </SubmitButton>
        </form>

        {(typeof backfillTotalNumber === "number" ||
          typeof backfillSuccessNumber === "number" ||
          typeof backfillFailedNumber === "number" ||
          hasBackfillError) && (
          <p
            className={
              hasBackfillError
                ? "text-sm text-red-700"
                : "text-sm text-zinc-600"
            }
          >
            {hasBackfillError
              ? "Backfill failed. Check server logs for details."
              : `Backfill complete. Total: ${
                  backfillTotalNumber ?? 0
                }, Success: ${backfillSuccessNumber ?? 0}, Failed: ${
                  backfillFailedNumber ?? 0
                }.`}
          </p>
        )}

        <form action={backfillJournalAnalysisAction} className="space-y-2">
          <input type="hidden" name="redirectTo" value="/journals/vectors" />
          <input type="hidden" name="limit" value={String(limit)} />
          <input type="hidden" name="nextToken" value={nextToken ?? ""} />
          <SubmitButton variant="outline">
            Backfill AI Analysis (one-time)
          </SubmitButton>
        </form>

        {(typeof analysisBackfillTotalNumber === "number" ||
          typeof analysisBackfillSuccessNumber === "number" ||
          typeof analysisBackfillFailedNumber === "number" ||
          hasAnalysisBackfillError) && (
          <p
            className={
              hasAnalysisBackfillError
                ? "text-sm text-red-700"
                : "text-sm text-zinc-600"
            }
          >
            {hasAnalysisBackfillError
              ? "AI analysis backfill failed. Check server logs for details."
              : `AI analysis backfill complete. Total: ${
                  analysisBackfillTotalNumber ?? 0
                }, Success: ${analysisBackfillSuccessNumber ?? 0}, Failed: ${
                  analysisBackfillFailedNumber ?? 0
                }.`}
          </p>
        )}

        {isProduction() && (
          <p className="text-sm text-zinc-600">
            Debug vector listing is hidden in production.
          </p>
        )}

        {!isProduction() && (
          <form action="/journals/vectors" method="get" className="flex gap-2">
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
            <p>Bucket: {vectorBucketName}</p>
            <p>Index: {indexName}</p>
            <p>Environment: {appEnvironment}</p>
            <p>Current page vectors: {listed.vectors.length}</p>
            <p>Visible for user {user.username}: {visibleVectors.length}</p>
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
                  <p className="text-xs text-zinc-500 break-all">{vector.key}</p>
                  <pre className="text-xs text-zinc-700 overflow-x-auto">
                    {JSON.stringify(vector.metadata ?? {}, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ))}

        {!isProduction() && listed.nextToken && (
          <form action="/journals/vectors" method="get">
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
