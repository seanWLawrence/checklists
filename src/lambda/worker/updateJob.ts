import { updateItem } from "@/lib/aws/dynamodb/update-item";
import {
  FailedJob,
  isFailedJob,
  isRunningJob,
  isSucceededJob,
  RunningJob,
  SucceededJob,
} from "./job.types";
import { getJobPk, getJobSk } from "./keys";
import { EitherAsync } from "purify-ts/EitherAsync";
import { logger } from "@/lib/logger";

export const updateJob = ({
  username,
  jobId,
  job,
}: {
  username: string;
  jobId: string;
  job: RunningJob | SucceededJob | FailedJob;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    if (isRunningJob(job)) {
      return fromPromise(
        updateItem({
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          attributeNames: {
            "#status": "status",
            "#startedAtIso": "startedAtIso",
          },
          attributeValues: {
            ":status": job.status,
            ":startedAtIso": job.startedAtIso.toISOString(),
          },
          updateExpression:
            "SET #status = :status, #startedAtIso = :startedAtIso",
        }),
      );
    }

    if (isFailedJob(job)) {
      return fromPromise(
        updateItem({
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          attributeNames: {
            "#status": "status",
            "#error": "error",
            "#completedAtIso": "completedAtIso",
          },
          attributeValues: {
            ":status": job.status,
            ":error": job.error,
            ":completedAtIso": job.completedAtIso.toISOString(),
          },
          updateExpression:
            "SET #status = :status, #completedAtIso = :completedAtIso, #error = :error",
        }),
      );
    }

    if (isSucceededJob(job)) {
      return fromPromise(
        updateItem({
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          attributeNames: {
            "#status": "status",
            "#completedAtIso": "completedAtIso",
            "#output": "output",
          },
          attributeValues: {
            ":status": job.status,
            ":completedAtIso": job.completedAtIso.toISOString(),
            ":output": job.output,
          },
          updateExpression:
            "SET #status = :status, #completedAtIso = :completedAtIso, #output = :output",
        }),
      );
    }

    logger.error("invalid job: ", job);
    throwE("Invalid job status");
  });
};
