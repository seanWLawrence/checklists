import { EitherAsync } from "purify-ts/EitherAsync";
import { JobInput, JobType, QueuedJob } from "./job.types";
import { putItem } from "@/lib/aws/dynamodb/put-item";
import { getJobPk, getJobSk } from "./keys";
import { sendMessage } from "@/lib/aws/sqs/send-message";

const JOB_TTL_SECONDS = 60 * 60 * 24 * 7;

const getTtlEpochSeconds = (date: Date) =>
  Math.floor(date.getTime() / 1000) + JOB_TTL_SECONDS;

export const queueJob = <T extends JobInput>({
  jobId,
  jobType,
  username,
  input,
}: {
  /**
   * Must be same for the same job to ensure deduplication works correctly, but can be generated client-side or server-side as long as it's unique for each job.
   */
  jobId: string;
  jobType: JobType;
  username: string;
  input: T;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise }) => {
    const now = new Date();

    const queuedJob = QueuedJob.encode({
      jobType,
      status: "queued",
      ttlEpochSeconds: getTtlEpochSeconds(now),
      input,
    }) as QueuedJob;

    await fromPromise(
      putItem({
        conditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
        item: {
          pk: getJobPk({ username }),
          sk: getJobSk({ jobId }),
          ...queuedJob,
        },
      }),
    );

    await fromPromise(sendMessage({ message: { jobId, username, jobType } }));
  });
};
