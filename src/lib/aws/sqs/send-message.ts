import "@nobush/server-only";

import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { EitherAsync } from "purify-ts/EitherAsync";

import { sqsClient } from "@/lib/aws/sqs/sqs-client";
import { JobQueueMessage } from "../../../lambda/worker/job.types";
import { AWS_JOBS_QUEUE_URL } from "@/lib/env.server";

export const sendMessage = ({
  message,
}: {
  message: JobQueueMessage;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async () => {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: AWS_JOBS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      }),
    );
  });
};
