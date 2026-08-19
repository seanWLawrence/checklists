import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { beforeEach, test, vi } from "vitest";

vi.mock("@/lib/auth/validate-user-logged-in", () => ({
  validateUserLoggedIn: vi.fn(),
}));

vi.mock("@/lambda/worker/queueJob", () => ({
  queueJob: vi.fn(),
}));

vi.mock("@/lambda/worker/get-job", () => ({
  getJob: vi.fn(),
}));

vi.mock("@/lib/aws/s3/get-object", () => ({
  getObject: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { POST } from "./route";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { queueJob } from "@/lambda/worker/queueJob";
import { getJob } from "@/lambda/worker/get-job";
import { getObject } from "@/lib/aws/s3/get-object";

const right = <T>(value: T) => EitherAsync<unknown, T>(async () => value);

const getExpectedJobId = ({
  username,
  body,
  discardSourceAfterTranscription = false,
}: {
  username: string;
  body: Uint8Array;
  discardSourceAfterTranscription?: boolean;
}) => {
  const contentHash = createHash("sha256").update(body).digest("hex");
  return createHash("sha256")
    .update(
      `${username}:${contentHash}${
        discardSourceAfterTranscription ? ":discard-source" : ""
      }`,
    )
    .digest("hex");
};

const createRequest = ({
  discardSourceAfterTranscription = false,
}: {
  discardSourceAfterTranscription?: boolean;
} = {}) =>
  new NextRequest(
    `http://localhost:3000/api/assets/audio.mp3/transcriptions${
      discardSourceAfterTranscription ? "?discardSourceAfterTranscription=true" : ""
    }`,
    {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
    },
  );

beforeEach(() => {
  vi.clearAllMocks();
});

test("POST reuses an existing succeeded job for identical content", async ({
  expect,
}) => {
  const body = new TextEncoder().encode("same-audio");
  const expectedJobId = getExpectedJobId({ username: "sean", body });

  vi.mocked(validateUserLoggedIn).mockReturnValueOnce(
    right({ username: "sean" }),
  );
  vi.mocked(getObject).mockReturnValueOnce(
    right({ body, contentType: "audio/mpeg" }),
  );
  vi.mocked(getJob).mockReturnValueOnce(
    right({
      status: "succeeded",
      jobType: "journalTranscription",
      input: { filename: "audio.mp3" },
      completedAtIso: new Date("2026-03-02T00:00:00.000Z"),
      output: {
        transcriptionRaw: "raw",
        transcriptionStructured: "structured",
        metadata: {
          transcriptionModel: "model-a",
          transcriptionPromptVersion: 1,
          transcriptionStructuringModel: "model-b",
          transcriptionStructuringPromptVersion: 1,
        },
      },
    }),
  );

  const response = await POST(createRequest(), {
    params: Promise.resolve({ filename: "audio.mp3" }),
  });
  const json = await response.json();

  expect(response.status).toBe(202);
  expect(json).toEqual({
    jobId: expectedJobId,
    status: "succeeded",
  });
  expect(queueJob).not.toHaveBeenCalled();
});

test("POST reuses an existing running job for identical content", async ({
  expect,
}) => {
  const body = new TextEncoder().encode("same-audio");
  const expectedJobId = getExpectedJobId({ username: "sean", body });

  vi.mocked(validateUserLoggedIn).mockReturnValueOnce(
    right({ username: "sean" }),
  );
  vi.mocked(getObject).mockReturnValueOnce(
    right({ body, contentType: "audio/mpeg" }),
  );
  vi.mocked(getJob).mockReturnValueOnce(
    right({
      status: "running",
      jobType: "journalTranscription",
      input: { filename: "audio.mp3" },
      startedAtIso: new Date("2026-03-02T00:00:00.000Z"),
    }),
  );

  const response = await POST(createRequest(), {
    params: Promise.resolve({ filename: "audio.mp3" }),
  });
  const json = await response.json();

  expect(response.status).toBe(202);
  expect(json).toEqual({
    jobId: expectedJobId,
    status: "running",
  });
  expect(queueJob).not.toHaveBeenCalled();
});

test("POST queues a new job using the deterministic job id when none exists", async ({
  expect,
}) => {
  const body = new TextEncoder().encode("new-audio");
  const expectedJobId = getExpectedJobId({ username: "sean", body });

  vi.mocked(validateUserLoggedIn).mockReturnValueOnce(
    right({ username: "sean" }),
  );
  vi.mocked(getObject).mockReturnValueOnce(
    right({ body, contentType: "audio/mpeg" }),
  );
  vi.mocked(getJob).mockReturnValueOnce(right(null));
  vi.mocked(queueJob).mockReturnValueOnce(right(undefined));

  const response = await POST(createRequest(), {
    params: Promise.resolve({ filename: "audio.mp3" }),
  });
  const json = await response.json();

  expect(response.status).toBe(202);
  expect(json).toEqual({
    jobId: expectedJobId,
    status: "queued",
  });
  expect(queueJob).toHaveBeenCalledWith({
    username: "sean",
    jobId: expectedJobId,
    jobType: "journalTranscription",
    input: { filename: "audio.mp3" },
  });
});

test("POST marks a job to discard its source after transcription", async ({
  expect,
}) => {
  const body = new TextEncoder().encode("temporary-audio");
  const expectedJobId = getExpectedJobId({
    username: "sean",
    body,
    discardSourceAfterTranscription: true,
  });

  vi.mocked(validateUserLoggedIn).mockReturnValueOnce(
    right({ username: "sean" }),
  );
  vi.mocked(getObject).mockReturnValueOnce(
    right({ body, contentType: "audio/mpeg" }),
  );
  vi.mocked(getJob).mockReturnValueOnce(right(null));
  vi.mocked(queueJob).mockReturnValueOnce(right(undefined));

  const response = await POST(
    createRequest({ discardSourceAfterTranscription: true }),
    { params: Promise.resolve({ filename: "audio.mp3" }) },
  );

  expect(response.status).toBe(202);
  expect(queueJob).toHaveBeenCalledWith({
    username: "sean",
    jobId: expectedJobId,
    jobType: "journalTranscription",
    input: { filename: "audio.mp3", discardSourceAfterTranscription: "true" },
  });
});
