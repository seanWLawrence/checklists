import { EitherAsync } from "purify-ts/EitherAsync";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  JobHandler,
  SucceededJob,
  TranscriptionJobInput,
} from "../../job.types";
import { getObject } from "@/lib/aws/s3/get-object";
import { updateJob } from "../../updateJob";
import { transcribeAudio } from "./transcribe-audio";
import { structureTranscription } from "./structure-transcription";
import { prepareTranscriptionAudio } from "./prepare-transcription-audio";
import { workerEnv } from "../../env";
import { workerDynamoDbClient, workerS3Client } from "../../aws-clients";
import { logger } from "@/lib/logger";

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

    const media = new File(
      [Buffer.from(objectResponse.body)],
      jobInput.filename,
      {
        type: objectResponse.contentType ?? "audio/mpeg",
      },
    );

    const audio = await fromPromise(
      prepareTranscriptionAudio({ media }),
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

    if (
      media.type === "video/mp4" ||
      ("discardSourceAfterTranscription" in jobInput &&
        jobInput.discardSourceAfterTranscription === "true")
    ) {
      try {
        await workerS3Client.send(
          new DeleteObjectCommand({
            Bucket: workerEnv.AWS_BUCKET_NAME,
            Key: jobInput.filename,
          }),
        );
      } catch (error) {
        logger.warn("Failed to delete transcribed source asset", {
          error,
          filename: jobInput.filename,
        });
      }
    }
  });
};
