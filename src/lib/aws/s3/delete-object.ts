import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3Client } from "./get-s3-client";
import { logger } from "../../logger";
import { AWS_BUCKET_NAME } from "@/lib/env.server";

export const deleteObject = ({
  filename,
}: {
  filename: string;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    try {
      const client = await fromPromise(getS3Client());

      await client.send(
        new DeleteObjectCommand({
          Bucket: AWS_BUCKET_NAME,
          Key: filename,
        }),
      );
    } catch (error) {
      logger.error("Error deleting S3 object", error);

      return throwE(error);
    }
  });
};
