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
  AWS_JOURNAL_VECTOR_DIMENSION,
  AWS_JOURNAL_VECTOR_BUCKET_NAME,
  AWS_JOURNAL_VECTOR_INDEX_NAME,
} from "@/lib/env.server";
import { getAppEnvironment } from "@/lib/env.server";
import { putVectors } from "@/lib/aws/s3vectors/put-vectors";
import { deleteVectors } from "@/lib/aws/s3vectors/delete-vectors";
import { logger } from "@/lib/logger";

export const upsertJournalEmbedding = async ({
  journal,
}: {
  journal: Journal;
}): Promise<boolean> => {
  const result = await EitherAsync(async ({ fromPromise, throwE }) => {
    const text = getJournalEmbeddingInput(journal);
    const key = getJournalEmbeddingKey(journal);
    const appEnvironment = getAppEnvironment();

    if (text.length === 0) {
      await fromPromise(
        deleteVectors({
          vectorBucketName: AWS_JOURNAL_VECTOR_BUCKET_NAME,
          indexName: AWS_JOURNAL_VECTOR_INDEX_NAME,
          keys: [key],
        }),
      );
      return;
    }

    const embedded = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: [text],
      providerOptions: { openai: { dimensions: AWS_JOURNAL_VECTOR_DIMENSION } },
    });

    const embedding = embedded.embeddings[0];
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return throwE("Could not create embedding for journal");
    }

    await fromPromise(
      putVectors({
        vectorBucketName: AWS_JOURNAL_VECTOR_BUCKET_NAME,
        indexName: AWS_JOURNAL_VECTOR_INDEX_NAME,
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
        expectedDimensions: AWS_JOURNAL_VECTOR_DIMENSION,
      }),
    );
  }).run();

  result.ifLeft((error) => {
    logger.error(
      `Failed to upsert journal embedding for '${journal.createdAtLocal}'`,
      error,
    );
  });

  return result.isRight();
};
