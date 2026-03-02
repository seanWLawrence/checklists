import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { createHash } from "node:crypto";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { Either, Left, Right } from "purify-ts/Either";
import { queueJob } from "@/lambda/worker/queueJob";
import {
  isActiveJobStatus,
  isSucceededJob,
  type JobStartResponse,
} from "@/lambda/worker/job.types";
import { getJob } from "@/lambda/worker/get-job";
import { getObject } from "@/lib/aws/s3/get-object";
import { logger } from "@/lib/logger";

// Reject path separators and ASCII control chars so the route param stays a single safe filename.
const INVALID_FILENAME_PATTERN = /[\/\\\u0000-\u001f\u007f]/;

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

const getContentHash = (input: Uint8Array): string => {
  return createHash("sha256").update(input).digest("hex");
};

const getDeterministicJobId = ({
  username,
  contentHash,
}: {
  username: string;
  contentHash: string;
}): string => {
  return createHash("sha256")
    .update(`${username}:${contentHash}`)
    .digest("hex");
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

      const asset = await fromPromise(
        getObject({
          filename,
        }),
      );

      const jobId = getDeterministicJobId({
        username: user.username,
        contentHash: getContentHash(asset.body),
      });

      const existingJob = await fromPromise(
        getJob({
          username: user.username,
          jobId,
        }),
      );

      if (existingJob) {
        if (isSucceededJob(existingJob)) {
          logger.info("Returning existing succeeded transcription job", {
            username: user.username,
            jobId,
            filename,
          });

          return {
            jobId,
            status: "succeeded",
          } satisfies JobStartResponse;
        }

        if (isActiveJobStatus(existingJob.status)) {
          const activeStatus =
            existingJob.status === "queued" ? "queued" : "running";

          logger.info("Returning existing active transcription job", {
            username: user.username,
            jobId,
            filename,
            status: activeStatus,
          });

          return {
            jobId,
            status: activeStatus,
          } satisfies JobStartResponse;
        }
      }

      const createJobResult = await queueJob({
        username: user.username,
        jobId,
        jobType: "journalTranscription",
        input: { filename },
      }).run();

      if (createJobResult.isLeft()) {
        return throwE("Failed to create transcription job");
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
