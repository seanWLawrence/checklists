import "server-only";

import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Journal } from "../journal.types";
import {
  getJournalEmbeddingInput,
  getJournalEmbeddingKey,
} from "./get-journal-embedding-input.lib";
import {
  AWS_JOURNAL_VECTOR_BUCKET_NAME,
  AWS_JOURNAL_VECTOR_INDEX_NAME,
} from "@/lib/secrets";
import { getAppEnvironment } from "@/lib/environment";
import { putVectors } from "@/lib/aws/s3vectors/put-vectors";
import { deleteVectors } from "@/lib/aws/s3vectors/delete-vectors";
import { logger } from "@/lib/logger";

export const upsertJournalEmbedding = async ({
  journal,
}: {
  journal: Journal;
}): Promise<void> => {
  const result = await EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    const vectorBucketName = await liftEither(AWS_JOURNAL_VECTOR_BUCKET_NAME);
    const indexName = await liftEither(AWS_JOURNAL_VECTOR_INDEX_NAME);
    const text = getJournalEmbeddingInput(journal);
    const key = getJournalEmbeddingKey(journal);
    const appEnvironment = getAppEnvironment();

    if (text.length === 0) {
      await fromPromise(
        deleteVectors({
          vectorBucketName,
          indexName,
          keys: [key],
        }),
      );
      return;
    }

    const dimensionsRaw = process.env.AWS_JOURNAL_VECTOR_DIMENSION;
    const dimensions = dimensionsRaw ? Number(dimensionsRaw) : NaN;
    if (!Number.isFinite(dimensions)) {
      return throwE("AWS_JOURNAL_VECTOR_DIMENSION must be a valid number");
    }

    const embedded = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: [text],
      providerOptions: { openai: { dimensions } },
    });

    const embedding = embedded.embeddings[0];
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return throwE("Could not create embedding for journal");
    }

    await fromPromise(
      putVectors({
        vectorBucketName,
        indexName,
        vectors: [
          {
            key,
            embedding,
            metadata: {
              journalId: journal.id,
              createdAtLocal: journal.createdAtLocal,
              updatedAtIso: journal.updatedAtIso.toISOString(),
              createdAtIso: journal.createdAtIso.toISOString(),
              username: journal.user.username,
              environment: appEnvironment,
              source: "journals",
            },
          },
        ],
        expectedDimensions: dimensions,
      }),
    );
  }).run();

  result.ifLeft((error) => {
    logger.error(
      `Failed to upsert journal embedding for '${journal.createdAtLocal}'`,
      error,
    );
  });
};
