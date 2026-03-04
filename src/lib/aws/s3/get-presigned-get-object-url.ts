import "@nobush/server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EitherAsync } from "purify-ts/EitherAsync";

import { s3Client } from "./s3-client";
import { logger } from "../../logger";
import { AWS_BUCKET_NAME } from "@/lib/env.server";

export const getPresignedGetObjectUrl = ({
  filename,
  responseContentType,
  expiresInSeconds = 60,
}: {
  filename: string;
  responseContentType?: string;
  expiresInSeconds?: number;
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: AWS_BUCKET_NAME,
          Key: filename,
          ResponseContentType: responseContentType,
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
