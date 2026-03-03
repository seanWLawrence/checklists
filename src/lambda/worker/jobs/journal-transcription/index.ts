import { EitherAsync } from "purify-ts/EitherAsync";
import {
  JobHandler,
  SucceededJob,
  TranscriptionJobInput,
} from "../../job.types";
import { getObject } from "@/lib/aws/s3/get-object";
import { updateJob } from "../../updateJob";
import { transcribeAudio } from "./transcribe-audio";
import { structureTranscription } from "./structure-transcription";
import { workerEnv } from "../../env";
import { workerDynamoDbClient, workerS3Client } from "../../aws-clients";

export const handler: JobHandler<TranscriptionJobInput> = ({
  message,
  jobInput,
}) => {
  return EitherAsync(async ({ fromPromise }) => {
    const objectResponse = await fromPromise(
      getObject({
        filename: jobInput.filename,
        bucketName: workerEnv.AWS_BUCKET_NAME,
        client: workerS3Client,
      }),
    );

    const audio = new File(
      [Buffer.from(objectResponse.body)],
      jobInput.filename,
      {
        type: objectResponse.contentType ?? "audio/mpeg",
      },
    );

    const transcribeAudioResult = await fromPromise(
      transcribeAudio({
        audio,
      }),
    );

    const output = await fromPromise(
      structureTranscription(transcribeAudioResult),
    );

    await fromPromise(
      updateJob({
        username: message.username,
        jobId: message.jobId,
        client: workerDynamoDbClient,
        tableName: workerEnv.AWS_TABLE_NAME,
        job: {
          status: "succeeded",
          completedAtIso: new Date(),
          jobType: message.jobType,
          output,
          input: jobInput,
        } satisfies SucceededJob,
      }),
    );
  });
};
