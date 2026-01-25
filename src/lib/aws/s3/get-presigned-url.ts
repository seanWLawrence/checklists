import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3Client } from "./get-s3-client";
import { logger } from "../../logger";
import { AWS_BUCKET_NAME } from "@/lib/secrets";

export const getPresignedUrl = ({
  path,
  expiresInSeconds = 60,
}: {
  path: string;
  expiresInSeconds?: number;
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ throwE, fromPromise, liftEither }) => {
    try {
      const client = await fromPromise(getS3Client());

      const url = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: await liftEither(AWS_BUCKET_NAME),
          Key: path,
        }),
        { expiresIn: expiresInSeconds },
      );

      return url;
    } catch (error) {
      logger.error("Error generating presigned URL", error);

      return throwE(error);
    }
  });
};
