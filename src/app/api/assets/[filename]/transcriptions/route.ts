import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { randomUUID } from "node:crypto";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { Either, Left, Right } from "purify-ts/Either";
import {
  queueJob,
  getJob,
  getJobDedupe,
  updateJobStatus,
} from "@/lambda/worker/get-job";
import { sendMessage } from "@/lib/aws/sqs/send-message";
import {
  isActiveJobStatus,
  type JobStartResponse,
} from "@/lambda/worker/job.types";
import { logger } from "@/lib/logger";

// Reject path separators and ASCII control chars so the route param stays a single safe filename.
const INVALID_FILENAME_PATTERN = /[\/\\\u0000-\u001f\u007f]/;

const isTranscriptionJobDedupeConflict = (error: unknown): boolean => {
  const name =
    error instanceof Error && typeof error.name === "string" ? error.name : "";
  const message =
    error instanceof Error && typeof error.message === "string"
      ? error.message
      : "";

  if (name === "ConditionalCheckFailedException") {
    return true;
  }

  return (
    name === "TransactionCanceledException" &&
    message.toLowerCase().includes("conditional")
  );
};

const validateFilename = (filename: string) => {
  return Either.of(filename)
    .chain((value) =>
      value.length > 0
        ? Right(value)
        : Left("Filename must be a non-empty string"),
    )
    .chain((value) =>
      INVALID_FILENAME_PATTERN.test(value)
        ? Left("Filename contains invalid characters")
        : Right(value),
    )
    .chain((value) =>
      value.length > 255
        ? Left("Filename must be 255 characters or fewer")
        : Right(value),
    );
};

const getErrorStatusCode = (error: string): number => {
  if (
    error.includes("Filename") ||
    error.includes("same-origin") ||
    error.includes("No user found")
  ) {
    return 400;
  }

  if (
    error.includes("Failed to create transcription job") ||
    error.includes("Failed to enqueue transcription job")
  ) {
    return 500;
  }

  return 500;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const response = await EitherAsync(
    async ({ fromPromise, liftEither, throwE }) => {
      await liftEither(verifySameOriginRequest(request));

      const user = await fromPromise(
        validateUserLoggedIn({ variant: "server-action", request }),
      );

      const { filename } = await params;

      await liftEither(validateFilename(filename));

      const existingDedupe = await fromPromise(
        getJobDedupe({
          username: user.username,
          filename,
        }),
      );

      if (existingDedupe && isActiveJobStatus(existingDedupe.status)) {
        const existingJob = await fromPromise(
          getJob({
            username: user.username,
            jobId: existingDedupe.jobId,
          }),
        );

        if (existingJob && isActiveJobStatus(existingJob.status)) {
          return {
            jobId: existingJob.jobId,
            status: existingJob.status,
          } satisfies JobStartResponse;
        }
      }

      const jobId = randomUUID();

      const createJobResult = await queueJob({
        username: user.username,
        jobId,
        filename,
      }).run();

      if (createJobResult.isLeft()) {
        const createError = createJobResult.extract();

        if (isTranscriptionJobDedupeConflict(createError)) {
          const dedupeAfterConflict = await fromPromise(
            getJobDedupe({
              username: user.username,
              filename,
            }),
          );

          if (dedupeAfterConflict) {
            const existingJobAfterConflict = await fromPromise(
              getJob({
                username: user.username,
                jobId: dedupeAfterConflict.jobId,
              }),
            );

            if (
              existingJobAfterConflict &&
              isActiveJobStatus(existingJobAfterConflict.status)
            ) {
              return {
                jobId: existingJobAfterConflict.jobId,
                status: existingJobAfterConflict.status,
              } satisfies JobStartResponse;
            }
          }
        }

        return throwE("Failed to create transcription job");
      }

      const enqueueResult = await sendMessage({
        message: {
          username: user.username,
          jobId,
          filename,
        },
      }).run();

      if (enqueueResult.isLeft()) {
        const updateFailedStatusResult = await updateJobStatus({
          username: user.username,
          jobId,
          filename,
          status: "failed",
          error: `Failed to enqueue transcription job: ${String(enqueueResult.extract())}`,
        }).run();

        if (updateFailedStatusResult.isLeft()) {
          logger.error(
            "Failed to mark transcription job as failed after enqueue error",
            {
              error: String(updateFailedStatusResult.extract()),
              filename,
              jobId,
              username: user.username,
            },
          );
        }

        return throwE("Failed to enqueue transcription job");
      }

      return {
        jobId,
        status: "queued",
      } satisfies JobStartResponse;
    },
  );

  if (response.isLeft()) {
    const error = String(response.extract());
    const status = getErrorStatusCode(error);

    if (status >= 500) {
      logger.error("Failed to start transcription job", { error });
    }

    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json(response.extract(), { status: 202 });
}
