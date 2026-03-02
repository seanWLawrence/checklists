import { updateItem } from "@/lib/aws/dynamodb/update-item";
import {
  EnqueueFailedJob,
  FailedJob,
  isEnqueueFailedJob,
  isFailedJob,
  isQueuedJob,
  isRunningJob,
  isSucceededJob,
  QueuedJob,
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
  job: EnqueueFailedJob | QueuedJob | RunningJob | SucceededJob | FailedJob;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    if (isQueuedJob(job)) {
      return fromPromise(
        updateItem({
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          conditionExpression: "#status IN (:failed, :enqueueFailed)",
          attributeNames: {
            "#status": "status",
            "#jobType": "jobType",
            "#ttlEpochSeconds": "ttlEpochSeconds",
            "#input": "input",
            "#error": "error",
            "#completedAtIso": "completedAtIso",
            "#startedAtIso": "startedAtIso",
            "#output": "output",
          },
          attributeValues: {
            ":status": job.status,
            ":jobType": job.jobType,
            ":ttlEpochSeconds": job.ttlEpochSeconds,
            ":input": job.input,
            ":failed": "failed",
            ":enqueueFailed": "enqueueFailed",
          },
          updateExpression:
            "SET #status = :status, #jobType = :jobType, #ttlEpochSeconds = :ttlEpochSeconds, #input = :input REMOVE #error, #completedAtIso, #startedAtIso, #output",
        }),
      );
    }

    if (isEnqueueFailedJob(job)) {
      return fromPromise(
        updateItem({
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          conditionExpression: "#status = :queued",
          attributeNames: {
            "#status": "status",
            "#jobType": "jobType",
            "#ttlEpochSeconds": "ttlEpochSeconds",
            "#input": "input",
            "#error": "error",
            "#completedAtIso": "completedAtIso",
            "#startedAtIso": "startedAtIso",
            "#output": "output",
          },
          attributeValues: {
            ":status": job.status,
            ":jobType": job.jobType,
            ":ttlEpochSeconds": job.ttlEpochSeconds,
            ":input": job.input,
            ":error": job.error,
            ":completedAtIso": job.completedAtIso.toISOString(),
            ":queued": "queued",
          },
          updateExpression:
            "SET #status = :status, #jobType = :jobType, #ttlEpochSeconds = :ttlEpochSeconds, #input = :input, #completedAtIso = :completedAtIso, #error = :error REMOVE #startedAtIso, #output",
        }),
      );
    }

    if (isRunningJob(job)) {
      return fromPromise(
        updateItem({
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          conditionExpression: "#status = :queued",
          attributeNames: {
            "#status": "status",
            "#startedAtIso": "startedAtIso",
          },
          attributeValues: {
            ":status": job.status,
            ":startedAtIso": job.startedAtIso.toISOString(),
            ":queued": "queued",
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
          conditionExpression: "#status = :running",
          attributeNames: {
            "#status": "status",
            "#error": "error",
            "#completedAtIso": "completedAtIso",
          },
          attributeValues: {
            ":status": job.status,
            ":error": job.error,
            ":completedAtIso": job.completedAtIso.toISOString(),
            ":running": "running",
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
          conditionExpression: "#status = :running",
          attributeNames: {
            "#status": "status",
            "#completedAtIso": "completedAtIso",
            "#output": "output",
          },
          attributeValues: {
            ":status": job.status,
            ":completedAtIso": job.completedAtIso.toISOString(),
            ":output": job.output,
            ":running": "running",
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
