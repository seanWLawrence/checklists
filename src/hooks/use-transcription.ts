"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EitherAsync } from "purify-ts/EitherAsync";

import { logger } from "@/lib/logger";
import {
  JobStartResponse,
  TranscriptionJobStatusResponse,
  TranscriptionMetadata,
} from "@/lambda/worker/job.types";

type TranscribeStatus = "idle" | "loading" | "done" | "error";

const TRANSCRIPTION_POLL_MAX_ATTEMPTS = 150;

export const getTranscriptionPollDelayMs = ({
  attemptNumber,
}: {
  attemptNumber: number;
}) => {
  return attemptNumber <= 30 ? 2000 : 5000;
};

export const runTranscription = async ({
  filename,
  discardSourceAfterTranscription = false,
  fetchFn = fetch,
}: {
  filename: string;
  discardSourceAfterTranscription?: boolean;
  fetchFn?: typeof fetch;
}) => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const response = await fetchFn(
      `/api/assets/${encodeURIComponent(filename)}/transcriptions${
        discardSourceAfterTranscription ? "?discardSourceAfterTranscription=true" : ""
      }`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      return throwE("Failed to start transcription");
    }

    const { jobId } = await liftEither(
      JobStartResponse.decode(await response.json()),
    );

    let attempts = 0;

    while (attempts < TRANSCRIPTION_POLL_MAX_ATTEMPTS) {
      attempts += 1;

      if (attempts > 1) {
        const pollDelayMs = getTranscriptionPollDelayMs({
          attemptNumber: attempts - 1,
        });

        await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
      }

      let statusResponse: Response;

      try {
        statusResponse = await fetchFn(`/api/jobs/${encodeURIComponent(jobId)}`, {
          method: "GET",
          cache: "no-store",
        });
      } catch (error) {
        logger.error("Failed to poll transcription job status", error);
        continue;
      }

      if (!statusResponse.ok) {
        logger.error(
          "Failed to load transcription job status",
          statusResponse,
        );
        return throwE("Failed to load transcription job status");
      }

      const statusJson = await liftEither(
        TranscriptionJobStatusResponse.decode(await statusResponse.json()),
      );

      if (statusJson.status === "succeeded") {
        return {
          filename,
          transcriptionStructured: statusJson.transcriptionStructured,
          transcriptionRaw: statusJson.transcriptionRaw ?? "",
          metadata: statusJson.metadata,
        };
      }

      if (statusJson.status === "failed") {
        logger.error("Transcription job failed", statusJson.error);
        return throwE("Transcription job failed");
      }
    }

    return throwE("Transcription timed out");
  }).run();
};

export const useTranscription = ({
  onCompleted,
  onError,
}: {
  onCompleted?: (result: {
    filename: string;
    transcriptionStructured: string;
    transcriptionRaw: string;
    metadata: TranscriptionMetadata;
  }) => void;
  onError?: (result: { filename: string; error: string }) => void;
}) => {
  const isMountedRef = useRef(true);
  const [statusByFilename, setStatusByFilename] = useState<
    Record<string, TranscribeStatus>
  >({});
  const [errorByFilename, setErrorByFilename] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isTranscribing = useMemo(() => {
    return Object.values(statusByFilename).includes("loading");
  }, [statusByFilename]);

  const setTranscribeStatus = ({
    filename,
    status,
  }: {
    filename: string;
    status: TranscribeStatus;
  }) => {
    if (!isMountedRef.current) {
      return;
    }

    setStatusByFilename((current) => ({
      ...current,
      [filename]: status,
    }));
  };

  const clearTranscriptionState = ({ filename }: { filename: string }) => {
    if (!isMountedRef.current) {
      return;
    }

    setStatusByFilename((current) => {
      const next = { ...current };
      delete next[filename];
      return next;
    });
    setErrorByFilename((current) => {
      const next = { ...current };
      delete next[filename];
      return next;
    });
  };

  const startTranscription = async ({
    filename,
    discardSourceAfterTranscription = false,
  }: {
    filename: string;
    discardSourceAfterTranscription?: boolean;
  }) => {
    setTranscribeStatus({ filename, status: "loading" });
    setErrorByFilename((current) => {
      const next = { ...current };
      delete next[filename];
      return next;
    });

    const result = await runTranscription({
      filename,
      discardSourceAfterTranscription,
    });

    result.caseOf({
      Right: ({
        filename: completedFilename,
        transcriptionStructured,
        transcriptionRaw,
        metadata,
      }) => {
        if (!isMountedRef.current) {
          return;
        }

        onCompleted?.({
          filename: completedFilename,
          transcriptionStructured,
          transcriptionRaw,
          metadata,
        });
        setTranscribeStatus({ filename: completedFilename, status: "done" });
      },
      Left: (error) => {
        if (!isMountedRef.current) {
          return;
        }

        const message = String(error);
        logger.error("Failed to transcribe asset", message);
        setTranscribeStatus({ filename, status: "error" });
        setErrorByFilename((current) => ({
          ...current,
          [filename]: message,
        }));
        onError?.({ filename, error: message });
      },
    });
  };

  return {
    startTranscription,
    setTranscribeStatus,
    clearTranscriptionState,
    statusByFilename,
    errorByFilename,
    isTranscribing,
  };
};
