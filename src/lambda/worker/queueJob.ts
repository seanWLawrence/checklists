import { EitherAsync } from "purify-ts/EitherAsync";
import {
  EnqueueFailedJob,
  isEnqueueFailedJob,
  isFailedJob,
  JobInput,
  JobType,
  QueuedJob,
} from "./job.types";
import { putItem } from "@/lib/aws/dynamodb/put-item";
import { getJobPk, getJobSk } from "./keys";
import { sendMessage } from "@/lib/aws/sqs/send-message";
import { getJob } from "./get-job";
import { updateJob } from "./updateJob";
import { logger } from "@/lib/logger";

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
  return EitherAsync(async ({ fromPromise, throwE }) => {
    const now = new Date();
    const ttlEpochSeconds = getTtlEpochSeconds(now);

    const queuedJob = QueuedJob.encode({
      jobType,
      status: "queued",
      ttlEpochSeconds,
      input,
    }) as QueuedJob;

    const existingJob = await fromPromise(
      getJob({
        username,
        jobId,
      }),
    );

    if (!existingJob) {
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
    } else if (isEnqueueFailedJob(existingJob) || isFailedJob(existingJob)) {
      logger.info("Requeueing existing job", {
        username,
        jobId,
        previousStatus: existingJob.status,
      });

      await fromPromise(
        updateJob({
          username,
          jobId,
          job: queuedJob,
        }),
      );
    } else {
      return throwE(`Job already exists for ${username} with job ID ${jobId}`);
    }

    const enqueueResult = await sendMessage({
      message: { jobId, username, jobType },
    }).run();

    if (enqueueResult.isLeft()) {
      const enqueueError = enqueueResult.extract();

      const markFailedResult = await updateJob({
        username,
        jobId,
        job: EnqueueFailedJob.encode({
          jobType,
          status: "enqueueFailed",
          ttlEpochSeconds,
          input,
          error: String(enqueueError),
          completedAtIso: new Date(),
        }),
      }).run();

      if (markFailedResult.isLeft()) {
        logger.error("Failed to mark job as enqueueFailed after SQS send error", {
          error: String(markFailedResult.extract()),
          jobId,
          username,
        });
      }

      return throwE(enqueueError);
    }
  });
};
