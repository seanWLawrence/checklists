import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Left } from "purify-ts/Either";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getJob } from "@/lambda/worker/get-job";
import {
  isEnqueueFailedJob,
  isFailedJob,
  isSucceededJob,
  type TranscriptionJobStatusResponse,
} from "@/lambda/worker/job.types";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { logger } from "@/lib/logger";

const getErrorStatusCode = (error: string): number => {
  if (error.includes("not found")) {
    return 404;
  }

  if (error.includes("Missing jobId")) {
    return 400;
  }

  return 500;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    await liftEither(verifySameOriginRequest(request));

    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action", request }),
    );

    const { jobId } = await params;

    if (typeof jobId !== "string" || jobId.trim() === "") {
      return liftEither(Left("Missing jobId"));
    }

    const job = await fromPromise(
      getJob({
        username: user.username,
        jobId,
      }),
    );

    if (!job) {
      return liftEither(Left("Transcription job not found"));
    }

    if (isSucceededJob(job)) {
      return {
        status: "succeeded",
        transcriptionStructured: job.output.transcriptionStructured,
        transcriptionRaw: job.output.transcriptionRaw,
      } satisfies TranscriptionJobStatusResponse;
    }

    if (isFailedJob(job) || isEnqueueFailedJob(job)) {
      return {
        status: "failed",
        error: job.error,
      } satisfies TranscriptionJobStatusResponse;
    }

    return {
      status: job.status,
    } satisfies TranscriptionJobStatusResponse;
  }).run();

  if (response.isLeft()) {
    const error = String(response.extract());
    const statusCode = getErrorStatusCode(error);

    if (statusCode >= 500) {
      logger.error("Failed to get transcription job status", { error });
    }

    return NextResponse.json({ error }, { status: statusCode });
  }

  return NextResponse.json(response.extract());
}
