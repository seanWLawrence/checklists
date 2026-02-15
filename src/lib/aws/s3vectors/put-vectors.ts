import "server-only";

import { PutVectorsCommand } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3VectorsClient } from "./get-s3vectors-client";
import { logger } from "@/lib/logger";

type VectorInput = {
  key: string;
  embedding: number[];
  metadata?: Record<string, string | number | boolean>;
};

const toChunks = <T>(values: T[], size: number): T[][] => {
  if (values.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

export const putVectors = ({
  vectorBucketName,
  indexName,
  vectors,
  batchSize = 500,
  expectedDimensions,
}: {
  vectorBucketName: string;
  indexName: string;
  vectors: VectorInput[];
  batchSize?: number;
  expectedDimensions?: number;
}): EitherAsync<unknown, { uploaded: number }> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    if (vectors.length === 0) {
      return { uploaded: 0 };
    }

    try {
      if (expectedDimensions) {
        const mismatch = vectors.find(
          (vector) => vector.embedding.length !== expectedDimensions,
        );
        if (mismatch) {
          return throwE(
            `Vector '${mismatch.key}' has ${mismatch.embedding.length} dimensions, expected ${expectedDimensions}`,
          );
        }
      }

      const client = await fromPromise(getS3VectorsClient());
      const chunks = toChunks(vectors, batchSize);

      for (const chunk of chunks) {
        await client.send(
          new PutVectorsCommand({
            vectorBucketName,
            indexName,
            vectors: chunk.map((vector) => ({
              key: vector.key,
              data: { float32: Array.from(new Float32Array(vector.embedding)) },
              metadata: vector.metadata,
            })),
          }),
        );
      }

      return { uploaded: vectors.length };
    } catch (error) {
      logger.error("Error putting S3 vectors", error);
      return throwE(error);
    }
  });
};
