import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3Client } from "./get-s3-client";
import { logger } from "../../logger";
import { AWS_BUCKET_NAME } from "@/lib/env.server";

export const getPresignedPutObjectUrl = ({
  filename: path,
  contentType,
  expiresInSeconds = 300,
}: {
  filename: string;
  contentType?: string;
  expiresInSeconds?: number;
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ throwE, fromPromise }) => {
    try {
      const client = await fromPromise(getS3Client());

      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: AWS_BUCKET_NAME,
          Key: path,
          ContentType: contentType,
        }),
        { expiresIn: expiresInSeconds },
      );

      return url;
    } catch (error) {
      logger.error("Error generating presigned PUT URL", error);

      return throwE(error);
    }
  });
};
