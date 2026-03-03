import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Codec, string } from "purify-ts/Codec";
import { Either } from "purify-ts/Either";

export const getSecret = <TData extends object>({
  decoder,
  secretName,
  client,
}: {
  decoder: Codec<TData>;
  secretName: string;
  client?: SecretsManagerClient;
}): EitherAsync<unknown, TData> => {
  return EitherAsync(async ({ liftEither }) => {
    const resolvedClient =
      client ?? (await import("./secrets-manager-client")).secretsManagerClient;

    const response = await resolvedClient.send(
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
