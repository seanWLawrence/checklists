import { string } from "purify-ts/Codec";

import { logger } from "@/lib/logger";
import {
  isTransientWorkerError,
  toWorkerErrorMessage,
} from "@/lambda/worker/worker-errors";
import { workerEnv as workerEnv } from "./env";
import { getJob } from "./get-job";
import { EitherAsync } from "purify-ts/EitherAsync";
import { updateJob } from "./updateJob";
import {
  FailedJob,
  isFailedJob,
  isSucceededJob,
  JobHandler,
  JobInput,
  JobQueueMessage,
  JobType,
  RunningJob,
} from "./job.types";
import { Either } from "purify-ts/Either";
import { transcriptionJobHandler } from "./transcription";

type SqsEvent = {
  Records: Array<{
    body: string;
    attributes?: {
      ApproximateReceiveCount?: string;
    };
  }>;
};

const processMessage = <
  TMessage extends JobQueueMessage,
  TJobInput extends JobInput,
>({
  message,
  attemptCount,
  handleJob,
}: {
  message: TMessage;
  attemptCount: number;
  handleJob: JobHandler<TJobInput>;
}) => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    const startedAtMs = Date.now();

    const currentJob = await fromPromise(
      getJob({
        username: message.username,
        jobId: message.jobId,
      }),
    );

    if (!currentJob) {
      return throwE(
        `No job found for ${message.username} with job ID ${message.jobId}. This should not happen because the job should have been created before the message was sent to SQS.`,
      );
    }

    if (isSucceededJob(currentJob)) {
      logger.info("Skipping already-succeeded job", {
        message,
        attemptCount,
      });
      return;
    }

    if (isFailedJob(currentJob)) {
      logger.info("Skipping already-failed job", {
        message,
        attemptCount,
      });
      return;
    }

    const now = new Date();

    await fromPromise(
      updateJob({
        username: message.username,
        jobId: message.jobId,
        job: RunningJob.encode({
          status: "running",
          jobType: message.jobType,
          startedAtIso: now,
          input: currentJob.input,
        }),
      }),
    );

    try {
      await fromPromise(
        handleJob({ message, jobInput: currentJob.input as TJobInput }),
      );

      logger.info("Job succeeded", {
        message,
        attemptCount,
        durationMs: Date.now() - startedAtMs,
      });
    } catch (error) {
      const transient = isTransientWorkerError(error);
      const shouldRetry =
        transient && attemptCount < workerEnv.MAX_RECEIVE_ATTEMPTS;

      if (shouldRetry) {
        logger.warn("Transient worker failure, retrying via SQS", {
          message,
          attemptCount,
          durationMs: Date.now() - startedAtMs,
          error: toWorkerErrorMessage(error),
        });

        throw error;
      }

      logger.error("Worker failed", {
        attemptCount,
        durationMs: Date.now() - startedAtMs,
        error: toWorkerErrorMessage(error),
        jobId: message.jobId,
        transient,
        username: message.username,
      });

      await fromPromise(
        updateJob({
          jobId: message.jobId,
          username: message.username,
          job: FailedJob.encode({
            status: "failed",
            error: toWorkerErrorMessage(error),
            completedAtIso: new Date(),
            jobType: message.jobType,
            input: currentJob.input,
          }),
        }),
      );
    }
  });
};

const getJobHandler = <TJobInput extends JobInput>(
  jobType: JobType,
): JobHandler<TJobInput> => {
  switch (jobType) {
    case "transcription":
    default:
      return transcriptionJobHandler;
  }
};

export const handler = (event: SqsEvent): EitherAsync<unknown, void[]> => {
  return EitherAsync.all(
    event.Records.map((record) =>
      EitherAsync(async ({ liftEither, fromPromise }) => {
        const message = await liftEither(
          string
            .decode(record.body)
            .chain((body) => Either.encase(() => JSON.parse(body)))
            .chain((body) => JobQueueMessage.decode(body)),
        );

        const attemptCountRaw = record.attributes?.ApproximateReceiveCount;
        const attemptCount = Number.parseInt(attemptCountRaw ?? "1", 10);

        await fromPromise(
          processMessage({
            handleJob: getJobHandler(message.jobType),
            message,
            attemptCount:
              Number.isFinite(attemptCount) && attemptCount > 0
                ? attemptCount
                : 1,
          }),
        );
      }),
    ),
  );
};
