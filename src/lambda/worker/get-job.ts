import "@nobush/server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { Job } from "./job.types";
import { getItem } from "@/lib/aws/dynamodb/get-item";
import { getJobPk, getJobSk } from "./keys";

export const getJob = ({
  username,
  jobId,
}: {
  username: string;
  jobId: string;
}): EitherAsync<unknown, Job | null> => {
  return getItem({
    pk: getJobPk({ username }),
    sk: getJobSk({ jobId }),
    decoder: Job,
  });
};
