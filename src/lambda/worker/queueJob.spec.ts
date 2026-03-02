import { beforeEach, expect, test, vi } from "vitest";
import { EitherAsync } from "purify-ts/EitherAsync";

const getJobMock = vi.fn();
const putItemMock = vi.fn();
const sendMessageMock = vi.fn();
const updateJobMock = vi.fn();

vi.mock("./get-job", () => ({
  getJob: getJobMock,
}));

vi.mock("@/lib/aws/dynamodb/put-item", () => ({
  putItem: putItemMock,
}));

vi.mock("@/lib/aws/sqs/send-message", () => ({
  sendMessage: sendMessageMock,
}));

vi.mock("./updateJob", () => ({
  updateJob: updateJobMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const right = <T>(value: T) => EitherAsync<unknown, T>(async () => value);

test("stores queued status before publishing a new job", async () => {
  const { queueJob } = await import("./queueJob");

  getJobMock.mockReturnValueOnce(right(null));
  putItemMock.mockReturnValueOnce(right(undefined));
  sendMessageMock.mockReturnValueOnce(right(undefined));

  const result = await queueJob({
    username: "sean",
    jobId: "job-1",
    jobType: "journalTranscription",
    input: { filename: "audio.mp3" },
  }).run();

  expect(result.isRight()).toBe(true);
  expect(putItemMock).toHaveBeenCalledTimes(1);
  expect(putItemMock).toHaveBeenCalledWith(
    expect.objectContaining({
      item: expect.objectContaining({
        status: "queued",
        input: { filename: "audio.mp3" },
      }),
    }),
  );
  expect(putItemMock.mock.invocationCallOrder[0]).toBeLessThan(
    sendMessageMock.mock.invocationCallOrder[0],
  );
});

test("refreshes payload and ttl before retrying an enqueueFailed job", async () => {
  const { queueJob } = await import("./queueJob");

  getJobMock.mockReturnValueOnce(
    right({
      status: "enqueueFailed",
      jobType: "journalTranscription",
      ttlEpochSeconds: 100,
      input: { filename: "old.mp3" },
      error: "boom",
      completedAtIso: new Date("2026-03-01T00:00:00.000Z"),
    }),
  );
  updateJobMock.mockReturnValueOnce(right(undefined));
  sendMessageMock.mockReturnValueOnce(right(undefined));

  const result = await queueJob({
    username: "sean",
    jobId: "job-2",
    jobType: "journalTranscription",
    input: { filename: "new.mp3" },
  }).run();

  expect(result.isRight()).toBe(true);
  expect(updateJobMock).toHaveBeenCalledTimes(1);
  expect(updateJobMock).toHaveBeenCalledWith(
    expect.objectContaining({
      job: expect.objectContaining({
        status: "queued",
        input: { filename: "new.mp3" },
        ttlEpochSeconds: expect.any(Number),
      }),
    }),
  );

  const updatedJob = updateJobMock.mock.calls[0]?.[0]?.job;
  expect(updatedJob.ttlEpochSeconds).toBeGreaterThan(100);
  expect(updateJobMock.mock.invocationCallOrder[0]).toBeLessThan(
    sendMessageMock.mock.invocationCallOrder[0],
  );
});

test("requeues a previously failed job using the same job id", async () => {
  const { queueJob } = await import("./queueJob");

  getJobMock.mockReturnValueOnce(
    right({
      status: "failed",
      jobType: "journalTranscription",
      input: { filename: "audio.mp3" },
      error: "boom",
      completedAtIso: new Date("2026-03-01T00:00:00.000Z"),
    }),
  );
  updateJobMock.mockReturnValueOnce(right(undefined));
  sendMessageMock.mockReturnValueOnce(right(undefined));

  const result = await queueJob({
    username: "sean",
    jobId: "job-3",
    jobType: "journalTranscription",
    input: { filename: "audio.mp3" },
  }).run();

  expect(result.isRight()).toBe(true);
  expect(updateJobMock).toHaveBeenCalledWith(
    expect.objectContaining({
      job: expect.objectContaining({
        status: "queued",
      }),
    }),
  );
});

beforeEach(() => {
  vi.resetModules();
  getJobMock.mockReset();
  putItemMock.mockReset();
  sendMessageMock.mockReset();
  updateJobMock.mockReset();
});
