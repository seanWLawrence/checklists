import { EitherAsync } from "purify-ts/EitherAsync";
import { dynamoDbClient } from "./dynamodb-client";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { AWS_TABLE_NAME } from "@/lib/env.server";
import { Codec } from "purify-ts/Codec";

export const getItem = <T extends object>({
  pk,
  sk,
  decoder,
}: {
  pk: string;
  sk: string;
  decoder: Codec<T>;
}): EitherAsync<unknown, T | null> => {
  return EitherAsync(async ({ liftEither }) => {
    const response = await dynamoDbClient.send(
      new GetCommand({
        TableName: AWS_TABLE_NAME,
        Key: {
          pk,
          sk,
        },
      }),
    );

    if (!response.Item) {
      return null;
    }

    return liftEither(decoder.decode(response.Item));
  });
};
