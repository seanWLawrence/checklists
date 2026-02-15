import "server-only";

import { GetVectorsCommand } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3VectorsClient } from "./get-s3vectors-client";
import { logger } from "@/lib/logger";

type VectorKeyResponse =
  | { key?: string | null }
  | { vectorKey?: string | null }
  | { id?: string | null };

const toChunks = <T>(values: T[], size: number): T[][] => {
  if (values.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const extractKeysFromResponse = (response: unknown): string[] => {
  if (!response || typeof response !== "object") {
    return [];
  }

  const responseObj = response as Record<string, unknown>;
  const candidates =
    (responseObj.vectors as VectorKeyResponse[] | undefined) ??
    (responseObj.items as VectorKeyResponse[] | undefined) ??
    (responseObj.foundVectors as VectorKeyResponse[] | undefined);

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") {
        return undefined;
      }
      const candidateObj = candidate as VectorKeyResponse;
      return (
        candidateObj.key ??
        candidateObj.vectorKey ??
        candidateObj.id ??
        undefined
      );
    })
    .filter((value): value is string => typeof value === "string");
};

export const getExistingVectorKeys = ({
  vectorBucketName,
  indexName,
  keys,
  batchSize = 100,
}: {
  vectorBucketName: string;
  indexName: string;
  keys: string[];
  batchSize?: number;
}): EitherAsync<unknown, Set<string>> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    if (keys.length === 0) {
      return new Set<string>();
    }

    try {
      const client = await fromPromise(getS3VectorsClient());
      const chunks = toChunks(keys, batchSize);
      const found = new Set<string>();

      for (const chunk of chunks) {
        const response = await client.send(
          new GetVectorsCommand({
            vectorBucketName,
            indexName,
            keys: chunk,
          }),
        );

        const extracted = extractKeysFromResponse(response);
        if (extracted.length === 0) {
          logger.warn(
            "S3 vectors response did not include any keys for existing vectors.",
          );
        }

        for (const key of extracted) {
          found.add(key);
        }
      }

      return found;
    } catch (error) {
      logger.error("Error checking existing S3 vectors", error);
      return throwE(error);
    }
  });
};
