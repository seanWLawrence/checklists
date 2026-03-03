import {
  Codec,
  GetType,
  date,
  enumeration,
  exactly,
  intersect,
  number,
  oneOf,
  string,
} from "purify-ts/Codec";

import { EitherAsync } from "purify-ts/EitherAsync";
const JobStatus = enumeration({
  enqueueFailed: "enqueueFailed",
  queued: "queued",
  running: "running",
  succeeded: "succeeded",
  failed: "failed",
});
type JobStatus = GetType<typeof JobStatus>;

const JobType = enumeration({ transcription: "journalTranscription" });
export type JobType = GetType<typeof JobType>;

export const JobQueueMessage = Codec.interface({
  username: string,
  jobId: string,
  jobType: JobType,
});
export type JobQueueMessage = GetType<typeof JobQueueMessage>;

export const JobStartResponse = Codec.interface({
  jobId: string,
  status: oneOf([
    exactly("queued"),
    exactly("running"),
    exactly("succeeded"),
  ]),
});
export type JobStartResponse = GetType<typeof JobStartResponse>;

export const TranscriptionJobInput = Codec.interface({
  filename: string,
});
export type TranscriptionJobInput = GetType<typeof TranscriptionJobInput>;

export const TranscriptionMetadata = Codec.interface({
  transcriptionModel: string,
  transcriptionPromptVersion: number,
  transcriptionStructuringModel: string,
  transcriptionStructuringPromptVersion: number,
});
export type TranscriptionMetadata = GetType<typeof TranscriptionMetadata>;

export const TranscriptionJobOutput = Codec.interface({
  transcriptionRaw: string,
  transcriptionStructured: string,
  metadata: TranscriptionMetadata,
});
export type TranscriptionJobOutput = GetType<typeof TranscriptionJobOutput>;

export const JobInput = oneOf([TranscriptionJobInput]);
export type JobInput = GetType<typeof JobInput>;

const JobOutput = oneOf([TranscriptionJobOutput]);
type JobOutput = GetType<typeof JobOutput>;

const BaseJob = Codec.interface({
  status: JobStatus,
  jobType: JobType,
  input: JobInput,
});

export const QueuedJob = intersect(
  BaseJob,
  Codec.interface({
    status: exactly("queued"),
    ttlEpochSeconds: number,
  }),
);
export type QueuedJob = GetType<typeof QueuedJob>;

export const EnqueueFailedJob = intersect(
  BaseJob,
  Codec.interface({
    status: exactly("enqueueFailed"),
    ttlEpochSeconds: number,
    error: string,
    completedAtIso: date,
  }),
);
export type EnqueueFailedJob = GetType<typeof EnqueueFailedJob>;

export const RunningJob = intersect(
  BaseJob,
  Codec.interface({
    status: exactly("running"),
    startedAtIso: date,
  }),
);
export type RunningJob = GetType<typeof RunningJob>;

export const FailedJob = intersect(
  BaseJob,
  Codec.interface({
    status: exactly("failed"),
    error: string,
    completedAtIso: date,
  }),
);
export type FailedJob = GetType<typeof FailedJob>;

export const SucceededJob = intersect(
  BaseJob,
  Codec.interface({
    status: exactly("succeeded"),
    completedAtIso: date,
    output: JobOutput,
  }),
);
export type SucceededJob = GetType<typeof SucceededJob>;

export const Job = oneOf([
  EnqueueFailedJob,
  QueuedJob,
  RunningJob,
  FailedJob,
  SucceededJob,
]);
export type Job = GetType<typeof Job>;

export const isActiveJobStatus = (status: JobStatus): boolean => {
  return status === "queued" || status === "running";
};

export const isEnqueueFailedJob = (job: Job): job is EnqueueFailedJob =>
  job.status === "enqueueFailed";

export const isQueuedJob = (job: Job): job is QueuedJob =>
  job.status === "queued";

export const isRunningJob = (job: Job): job is RunningJob =>
  job.status === "running";

export const isSucceededJob = (job: Job): job is SucceededJob =>
  job.status === "succeeded";

export const isFailedJob = (job: Job): job is FailedJob =>
  job.status === "failed";

export type JobHandler<TJobInput extends JobInput> = (params: {
  message: JobQueueMessage;
  jobInput: TJobInput;
}) => EitherAsync<unknown, void>;

export const WorkerSecret = Codec.interface({
  OPENAI_API_KEY: string,
});
export type WorkerSecret = GetType<typeof WorkerSecret>;

export const TranscriptionJobStatusResponse = oneOf([
  Codec.interface({
    status: exactly("queued"),
  }),
  Codec.interface({
    status: exactly("running"),
  }),
  Codec.interface({
    status: exactly("succeeded"),
    transcriptionStructured: string,
    transcriptionRaw: string,
    metadata: TranscriptionMetadata,
  }),
  Codec.interface({
    status: exactly("failed"),
    error: string,
  }),
]);
export type TranscriptionJobStatusResponse = GetType<
  typeof TranscriptionJobStatusResponse
>;
