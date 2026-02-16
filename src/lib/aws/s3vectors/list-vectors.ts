import "server-only";

import { ListVectorsCommand } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3VectorsClient } from "./get-s3vectors-client";
import { logger } from "@/lib/logger";

type ListedVector = {
  key: string;
  metadata?: Record<string, unknown>;
};

export const listVectors = ({
  vectorBucketName,
  indexName,
  maxResults = 200,
  nextToken,
}: {
  vectorBucketName: string;
  indexName: string;
  maxResults?: number;
  nextToken?: string;
}): EitherAsync<unknown, { vectors: ListedVector[]; nextToken?: string }> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    try {
      const client = await fromPromise(getS3VectorsClient());
      const response = await client.send(
        new ListVectorsCommand({
          vectorBucketName,
          indexName,
          maxResults,
          nextToken,
          returnMetadata: true,
          returnData: false,
        }),
      );

      const vectorsRaw = Array.isArray(response.vectors)
        ? response.vectors
        : [];
      const vectors = vectorsRaw.flatMap((vector) => {
        if (typeof vector?.key !== "string") {
          return [];
        }

        const metadata = vector.metadata;
        return [
          {
            key: vector.key,
            metadata:
              metadata &&
              typeof metadata === "object" &&
              !Array.isArray(metadata)
                ? (metadata as Record<string, unknown>)
                : undefined,
          },
        ];
      });

      return {
        vectors,
        nextToken: response.nextToken,
      };
    } catch (error) {
      logger.error("Error listing S3 vectors", error);
      return throwE(error);
    }
  });
};
