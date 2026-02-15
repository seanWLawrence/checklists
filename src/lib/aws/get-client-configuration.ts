import "server-only";

import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import { S3ClientConfig } from "@aws-sdk/client-s3";

import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_ROLE_ARN,
  AWS_ROLE_DURATION_SECONDS,
  AWS_ROLE_SESSION_NAME,
  AWS_SECRET_ACCESS_KEY,
} from "@/lib/secrets";
import { EitherAsync } from "purify-ts/EitherAsync";

export const getClientConfiguration = ({
  endpoint = undefined,
}: {
  endpoint?: string;
} = {}): EitherAsync<unknown, S3ClientConfig> => {
  return EitherAsync(async ({ liftEither }) => {
    const region = await liftEither(AWS_REGION);
    const accessKeyId = await liftEither(AWS_ACCESS_KEY_ID);
    const secretAccessKey = await liftEither(AWS_SECRET_ACCESS_KEY);

    if (endpoint) {
      return {
        region,
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId: "minio", secretAccessKey: "minio123" },
      };
    }

    const credentials = fromTemporaryCredentials({
      params: {
        RoleArn: await liftEither(AWS_ROLE_ARN),
        RoleSessionName: AWS_ROLE_SESSION_NAME,
        DurationSeconds: AWS_ROLE_DURATION_SECONDS,
      },
      clientConfig: { region },
      masterCredentials: { accessKeyId, secretAccessKey },
    });

    return {
      credentials,
      region,
    };
  });
};
