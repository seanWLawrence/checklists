import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { Heading } from "@/components/heading";
import { logger } from "@/lib/logger";
import {
  AWS_JOURNAL_VECTOR_BUCKET_NAME,
  AWS_JOURNAL_VECTOR_INDEX_NAME,
} from "@/lib/secrets";
import { putVectors } from "@/lib/aws/s3vectors/put-vectors";
import { getExistingVectorKeys } from "@/lib/aws/s3vectors/get-existing-vector-keys";
import { getAllJournalsScanKey } from "@/app/journals/model/get-all-created-at-locals.model";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { Journal } from "@/app/journals/journal.types";
import { Button } from "@/components/button";

const getJournalEmbeddingInput = (journal: Journal): string => {
  return typeof journal.content === "string" ? journal.content.trim() : "";
};

const JournalEmbeddingsPage: React.FC<{
  searchParams?: Promise<{ run?: string }>;
}> = async ({ searchParams }) => {
  const { run } = (await searchParams) ?? {};

  const page = await EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const keys = await fromPromise(
      scan({
        key: getAllJournalsScanKey({ user }),
      }),
    );

    const journals = await fromPromise(getAllItems({ keys, decoder: Journal }));

    const inputs = journals
      .map((journal) => ({
        journal,
        text: getJournalEmbeddingInput(journal),
        key: `journalEmbedding#${journal.createdAtLocal}#${journal.updatedAtIso.toISOString()}`,
      }))
      .filter((entry) => entry.text.length > 0);

    const vectorBucketName = await liftEither(AWS_JOURNAL_VECTOR_BUCKET_NAME);
    const indexName = await liftEither(AWS_JOURNAL_VECTOR_INDEX_NAME);

    console.log(vectorBucketName, indexName);

    const existingKeys = await fromPromise(
      getExistingVectorKeys({
        vectorBucketName,
        indexName,
        keys: inputs.map((entry) => entry.key),
      }),
    );

    const pending = inputs.filter((entry) => !existingKeys.has(entry.key));

    let uploadSummary:
      | { model: string; dimensions?: number; uploaded: number }
      | undefined;

    if (run === "1" && pending.length > 0) {
      logger.info(`Embedding ${pending.length} journals...`);

      const dimensionsRaw = process.env.AWS_JOURNAL_VECTOR_DIMENSION;
      const parsedDimensions = dimensionsRaw ? Number(dimensionsRaw) : NaN;
      if (!Number.isFinite(parsedDimensions)) {
        return throwE("AWS_JOURNAL_VECTOR_DIMENSION must be a valid number");
      }
      const dimensions = parsedDimensions;

      const result = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: pending.map((entry) => entry.text),
        maxParallelCalls: 4,
        providerOptions: { openai: { dimensions } },
      });

      const vectors = pending.map((entry, index) => ({
        key: entry.key,
        embedding: result.embeddings[index],
        metadata: {
          journalId: entry.journal.id,
          createdAtLocal: entry.journal.createdAtLocal,
          updatedAtIso: entry.journal.updatedAtIso.toISOString(),
          createdAtIso: entry.journal.createdAtIso.toISOString(),
          username: entry.journal.user.username,
          source: "journals",
        },
      }));
      const { uploaded } = await fromPromise(
        putVectors({
          vectorBucketName,
          indexName,
          vectors,
          expectedDimensions: dimensions,
        }),
      );

      uploadSummary = {
        model: "text-embedding-3-small",
        dimensions,
        uploaded,
      };
    }

    return (
      <section className="space-y-4 text-center items-center flex flex-col">
        <Heading level={1}>Journal embeddings</Heading>

        <div className="flex flex-col items-center space-y-2 text-sm text-zinc-600">
          <span>
            {inputs.length} journal{inputs.length === 1 ? "" : "s"} total
          </span>
          <span>
            {existingKeys.size} already embedded, {pending.length} pending
          </span>
          <form action="/journals/embeddings" method="get">
            <input type="hidden" name="run" value="1" />

            <Button variant="primary" disabled={pending.length === 0}>
              Run embeddings
            </Button>
          </form>
        </div>

        {run === "1" ? (
          uploadSummary ? (
            <div className="w-full max-w-3xl text-left space-y-3">
              <div className="text-xs text-zinc-500">
                Model: {uploadSummary.model}
                {uploadSummary.dimensions
                  ? ` (dimensions: ${uploadSummary.dimensions})`
                  : ""}
              </div>
              <div className="text-sm text-zinc-700">
                Uploaded {uploadSummary.uploaded} vector
                {uploadSummary.uploaded === 1 ? "" : "s"} to the vector index.
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              No pending vectors to upload.
            </p>
          )
        ) : (
          <p className="text-sm text-zinc-600">
            Click “Run embeddings” to generate vectors for the pending journals.
          </p>
        )}
      </section>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            Failed to load journal embeddings.
          </p>
          <pre className="text-xs text-red-800">{String(error)}</pre>
        </div>
      );
    })
    .run();

  return page.extract();
};

export default JournalEmbeddingsPage;
