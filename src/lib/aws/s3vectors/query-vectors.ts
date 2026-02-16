import "server-only";

import { QueryVectorsCommand } from "@aws-sdk/client-s3vectors";
import type { DocumentType } from "@smithy/types";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3VectorsClient } from "./get-s3vectors-client";
import { logger } from "@/lib/logger";

export type QueriedVector = {
  key: string;
  distance?: number;
  metadata?: Record<string, unknown>;
};

export const queryVectors = ({
  vectorBucketName,
  indexName,
  queryEmbedding,
  topK = 10,
  filter,
}: {
  vectorBucketName: string;
  indexName: string;
  queryEmbedding: number[];
  topK?: number;
  filter?: DocumentType;
}): EitherAsync<unknown, QueriedVector[]> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    try {
      const client = await fromPromise(getS3VectorsClient());

      const response = await client.send(
        new QueryVectorsCommand({
          vectorBucketName,
          indexName,
          topK,
          queryVector: {
            float32: Array.from(new Float32Array(queryEmbedding)),
          },
          filter,
          returnMetadata: true,
          returnDistance: true,
        }),
      );

      const vectors = Array.isArray(response.vectors) ? response.vectors : [];

      return vectors.flatMap((vector) => {
        if (typeof vector?.key !== "string") {
          return [];
        }

        return [
          {
            key: vector.key,
            distance:
              typeof vector.distance === "number" ? vector.distance : undefined,
            metadata:
              vector.metadata &&
              typeof vector.metadata === "object" &&
              !Array.isArray(vector.metadata)
                ? (vector.metadata as Record<string, unknown>)
                : undefined,
          },
        ];
      });
    } catch (error) {
      logger.error("Error querying S3 vectors", error);
      return throwE(error);
    }
  });
};
