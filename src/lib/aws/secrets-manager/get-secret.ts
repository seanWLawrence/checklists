import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { EitherAsync } from "purify-ts/EitherAsync";
import { secretsManagerClient } from "./secrets-manager-client";
import { Codec, string } from "purify-ts/Codec";
import { Either } from "purify-ts/Either";

export const getSecret = <TData extends object>({
  decoder,
  secretName,
}: {
  decoder: Codec<TData>;
  secretName: string;
}): EitherAsync<unknown, TData> => {
  return EitherAsync(async ({ liftEither }) => {
    const response = await secretsManagerClient.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      }),
    );

    return liftEither(
      Codec.interface({ SecretString: string })
        .decode(response)
        .map((res) => res.SecretString)
        .chain((secretString) => Either.encase(() => JSON.parse(secretString)))
        .chain((parsed) => decoder.decode(parsed)),
    );
  });
};
