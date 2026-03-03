import { string } from "purify-ts/Codec";

import { logger } from "@/lib/logger";
import {
  isConditionalCheckFailure,
  isTransientWorkerError,
  toWorkerErrorMessage,
} from "@/lambda/worker/worker-errors";
import { workerEnv as workerEnv } from "./env";
import { getJob } from "./get-job";
import { EitherAsync } from "purify-ts/EitherAsync";
import { updateJob } from "./updateJob";
import {
  FailedJob,
  isQueuedJob,
  isRunningJob,
  isSucceededJob,
  JobHandler,
  JobInput,
  JobQueueMessage,
  JobType,
  RunningJob,
} from "./job.types";
import { Either } from "purify-ts/Either";
import { handler as journalTranscriptionJobHandler } from "./jobs/journal-transcription";
import { workerDynamoDbClient } from "./aws-clients";

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
        client: workerDynamoDbClient,
        tableName: workerEnv.AWS_TABLE_NAME,
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

    const shouldStartJob = isQueuedJob(currentJob);
    const shouldRetryRunningJob = isRunningJob(currentJob);

    if (!shouldStartJob && !shouldRetryRunningJob) {
      logger.info("Skipping non-queued job", {
        message,
        attemptCount,
        status: currentJob.status,
      });
      return;
    }

    if (shouldRetryRunningJob) {
      logger.warn("Retrying delivery for job already marked running", {
        message,
        attemptCount,
      });
    } else {
      const now = new Date();

      const markRunningResult = await updateJob({
        username: message.username,
        jobId: message.jobId,
        client: workerDynamoDbClient,
        tableName: workerEnv.AWS_TABLE_NAME,
        job: {
          status: "running",
          jobType: message.jobType,
          startedAtIso: now,
          input: currentJob.input,
        } satisfies RunningJob,
      }).run();

      if (markRunningResult.isLeft()) {
        const claimError = markRunningResult.extract();

        if (isConditionalCheckFailure(claimError)) {
          logger.info(
            "Skipping message because another worker already claimed it",
            {
              message,
              attemptCount,
            },
          );
          return;
        }

        return throwE(claimError);
      }
    }

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
      if (isConditionalCheckFailure(error)) {
        logger.info(
          "Skipping duplicate completion after concurrent worker update",
          {
            message,
            attemptCount,
          },
        );
        return;
      }

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

      const markFailedResult = await updateJob({
        jobId: message.jobId,
        username: message.username,
        client: workerDynamoDbClient,
        tableName: workerEnv.AWS_TABLE_NAME,
        job: {
          status: "failed",
          error: toWorkerErrorMessage(error),
          completedAtIso: new Date(),
          jobType: message.jobType,
          input: currentJob.input,
        } satisfies FailedJob,
      }).run();

      if (markFailedResult.isLeft()) {
        const markFailedError = markFailedResult.extract();

        if (isConditionalCheckFailure(markFailedError)) {
          logger.info(
            "Skipping failed transition because job already reached a final state",
            {
              message,
              attemptCount,
            },
          );
          return;
        }

        return throwE(markFailedError);
      }
    }
  });
};

const getJobHandler = <TJobInput extends JobInput>(
  jobType: JobType,
): JobHandler<TJobInput> => {
  switch (jobType) {
    case "journalTranscription":
    default:
      return journalTranscriptionJobHandler;
  }
};

const handleEvent = (event: SqsEvent): EitherAsync<unknown, void[]> => {
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

export const handler = async (event: SqsEvent): Promise<void[]> => {
  const result = await handleEvent(event).run();

  if (result.isLeft()) {
    const error = result.extract();

    throw error instanceof Error ? error : new Error(String(error));
  }

  return result.extract() as void[];
};
