import { describe, expect, test, vi, afterEach } from "vitest";

import {
  getTranscriptionPollDelayMs,
  runTranscription,
} from "./use-transcription";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

const metadata = {
  transcriptionModel: "gpt-4o-mini-transcribe",
  transcriptionPromptVersion: 1,
  transcriptionStructuringModel: "gpt-4o-mini",
  transcriptionStructuringPromptVersion: 1,
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("getTranscriptionPollDelayMs", () => {
  test("uses the fast poll interval for early attempts", () => {
    expect(getTranscriptionPollDelayMs({ attemptNumber: 1 })).toBe(2000);
    expect(getTranscriptionPollDelayMs({ attemptNumber: 30 })).toBe(2000);
  });

  test("uses the slower poll interval for later attempts", () => {
    expect(getTranscriptionPollDelayMs({ attemptNumber: 31 })).toBe(5000);
  });
});

describe("runTranscription", () => {
  test("returns the completed transcription payload when the job succeeds", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jobId: "job-123", status: "queued" }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "succeeded",
            transcriptionRaw: "raw transcript",
            transcriptionStructured: "structured transcript",
            metadata,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const result = await runTranscription({
      filename: "audio/test.m4a",
      fetchFn,
    });

    expect(result.extract()).toEqual({
      filename: "audio/test.m4a",
      transcriptionRaw: "raw transcript",
      transcriptionStructured: "structured transcript",
      metadata,
    });
    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      "/api/assets/audio%2Ftest.m4a/transcriptions",
      { method: "POST" },
    );
    expect(fetchFn).toHaveBeenNthCalledWith(2, "/api/jobs/job-123", {
      method: "GET",
      cache: "no-store",
    });
  });

  test("returns a left when starting the transcription fails", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response("boom", {
        status: 500,
      }),
    );

    const result = await runTranscription({
      filename: "audio/test.m4a",
      fetchFn,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.extract()).toBe("Failed to start transcription");
  });

  test("returns a left when the job reports failure", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jobId: "job-123", status: "queued" }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "failed", error: "bad audio" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await runTranscription({
      filename: "audio/test.m4a",
      fetchFn,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.extract()).toBe("Transcription job failed");
  });

  test("keeps polling when a status request throws and eventually succeeds", async () => {
    vi.useFakeTimers();

    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jobId: "job-123", status: "queued" }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockRejectedValueOnce(new Error("temporary network issue"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "succeeded",
            transcriptionRaw: "raw transcript",
            transcriptionStructured: "structured transcript",
            metadata,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const resultPromise = runTranscription({
      filename: "audio/test.m4a",
      fetchFn,
    });

    await vi.advanceTimersByTimeAsync(2000);

    const result = await resultPromise;

    expect(result.isRight()).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
});
