import { beforeEach, expect, test, vi } from "vitest";
import { EitherAsync } from "purify-ts/EitherAsync";

const getJobMock = vi.fn();
const updateJobMock = vi.fn();
const journalTranscriptionHandlerMock = vi.fn();

vi.mock("./get-job", () => ({
  getJob: getJobMock,
}));

vi.mock("./updateJob", () => ({
  updateJob: updateJobMock,
}));

vi.mock("./jobs/journal-transcription", () => ({
  handler: journalTranscriptionHandlerMock,
}));

vi.mock("./env", () => ({
  workerEnv: {
    MAX_RECEIVE_ATTEMPTS: 3,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const right = <T>(value: T) => EitherAsync<unknown, T>(async () => value);

test("retries a redelivered job that is already marked running", async () => {
  const { handler } = await import("./index");

  getJobMock.mockReturnValueOnce(
    right({
      status: "running",
      jobType: "journalTranscription",
      startedAtIso: new Date("2026-03-02T00:00:00.000Z"),
      input: { filename: "audio.mp3" },
    }),
  );
  journalTranscriptionHandlerMock.mockReturnValueOnce(right(undefined));

  await expect(
    handler({
      Records: [
        {
          body: JSON.stringify({
            username: "sean",
            jobId: "job-1",
            jobType: "journalTranscription",
          }),
          attributes: {
            ApproximateReceiveCount: "2",
          },
        },
      ],
    }),
  ).resolves.toEqual([undefined]);
  expect(journalTranscriptionHandlerMock).toHaveBeenCalledTimes(1);
  expect(journalTranscriptionHandlerMock).toHaveBeenCalledWith({
    message: {
      username: "sean",
      jobId: "job-1",
      jobType: "journalTranscription",
    },
    jobInput: { filename: "audio.mp3" },
  });
  expect(updateJobMock).not.toHaveBeenCalled();
});

beforeEach(() => {
  vi.resetModules();
  getJobMock.mockReset();
  updateJobMock.mockReset();
  journalTranscriptionHandlerMock.mockReset();
});
