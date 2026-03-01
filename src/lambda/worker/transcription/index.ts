import { EitherAsync } from "purify-ts/EitherAsync";
import { JobHandler, SucceededJob, TranscriptionJobInput } from "../job.types";
import { getObject } from "@/lib/aws/s3/get-object";
import { updateJob } from "../updateJob";
import { transcribeAudio } from "./transcribe-audio";

export const transcriptionJobHandler: JobHandler<TranscriptionJobInput> = ({
  message,
  jobInput,
}) => {
  return EitherAsync(async ({ fromPromise }) => {
    const objectResponse = await fromPromise(
      getObject({ filename: jobInput.filename }),
    );

    const audio = new File(
      [Buffer.from(objectResponse.body)],
      jobInput.filename,
      {
        type: objectResponse.contentType ?? "audio/mpeg",
      },
    );

    const output = await fromPromise(
      transcribeAudio({
        audio,
      }),
    );

    await fromPromise(
      updateJob({
        username: message.username,
        jobId: message.jobId,
        job: SucceededJob.encode({
          status: "succeeded",
          completedAtIso: new Date(),
          jobType: message.jobType,
          output,
          input: jobInput,
        }),
      }),
    );
  });
};
