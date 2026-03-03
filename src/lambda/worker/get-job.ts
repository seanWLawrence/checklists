import "@nobush/server-only";

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Job } from "./job.types";
import { getItem } from "@/lib/aws/dynamodb/get-item";
import { getJobPk, getJobSk } from "./keys";

export const getJob = ({
  username,
  jobId,
  client,
  tableName,
}: {
  username: string;
  jobId: string;
  client?: DynamoDBDocumentClient;
  tableName?: string;
}): EitherAsync<unknown, Job | null> => {
  return getItem({
    pk: getJobPk({ username }),
    sk: getJobSk({ jobId }),
    decoder: Job,
    client,
    tableName,
  });
};
