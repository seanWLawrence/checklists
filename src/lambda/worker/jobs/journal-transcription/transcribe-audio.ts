import { createOpenAI } from "@ai-sdk/openai";
import { logger } from "@/lib/logger";
import { workerEnv } from "../../env";
import { EitherAsync } from "purify-ts/EitherAsync";
import { TranscriptionJobOutput } from "../../job.types";
import { getWorkerSecret } from "../../get-worker-secret";

const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;
const TRANSCRIPTION_PROMPT_VERSION = 1;
const TIMEOUT_IN_MILLI = workerEnv.TIMEOUT_IN_MIN * 60 * 1000;

export type TranscribeAudioPayload = Pick<
  TranscriptionJobOutput,
  "transcriptionRaw"
> & {
  metadata: Pick<
    TranscriptionJobOutput["metadata"],
    "transcriptionModel" | "transcriptionPromptVersion"
  >;
};

let openAiClient: ReturnType<typeof createOpenAI> | null = null;

export const transcribeAudio = ({
  audio,
}: {
  audio: File;
}): EitherAsync<unknown, TranscribeAudioPayload> => {
  return EitherAsync(async ({ throwE, fromPromise, liftEither }) => {
    if (audio.size >= MAX_TRANSCRIPTION_BYTES) {
      return throwE(
        `Audio file too large to transcribe: ${audio.size} bytes. Skipping translation.`,
      );
    }

    logger.debug("Transcribing audio file...");

    if (openAiClient === null) {
      const secret = await fromPromise(getWorkerSecret());

      openAiClient = createOpenAI({ apiKey: secret.OPENAI_API_KEY });
    }

    const transcriptionClient = openAiClient;

    if (transcriptionClient === null) {
      return throwE("Unable to initialize transcription client");
    }

    const transcriptResponse = await liftEither(
      await EitherAsync(async ({ throwE: throwTranscriptionError }) => {
        try {
          return await transcriptionClient
            .transcription(workerEnv.OPENAI_TRANSCRIPTION_MODEL)
            .doGenerate({
              audio: new Uint8Array(await audio.arrayBuffer()),
              mediaType: audio.type,
              abortSignal: AbortSignal.timeout(TIMEOUT_IN_MILLI),
              providerOptions: {
                openai: {
                  prompt:
                    "Please provide a faithful transcription of the audio recording. Keep natural phrasing and detail. Do not summarize or strip conversational context.",
                  temperature: 0,
                },
              },
            });
        } catch (error) {
          return throwTranscriptionError(error);
        }
      }).run(),
    );

    const transcriptionRaw = transcriptResponse.text.trim();

    if (!transcriptionRaw) {
      return throwE("Transcription result is empty");
    }

    return {
      transcriptionRaw,
      metadata: {
        transcriptionModel: workerEnv.OPENAI_TRANSCRIPTION_MODEL,
        transcriptionPromptVersion: TRANSCRIPTION_PROMPT_VERSION,
      },
    };
  });
};
