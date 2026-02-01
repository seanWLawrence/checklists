import "server-only";

import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";
import { EitherAsync } from "purify-ts";
import { logger } from "@/lib/logger";

const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;

export const transcribeJournalAudioIntoContent = ({
  audio,
}: {
  audio: File;
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ throwE }) => {
    if (audio.size >= MAX_TRANSCRIPTION_BYTES) {
      logger.warn(
        `Audio file too large to transcribe: ${audio.size} bytes. Skipping translation.`,
      );

      return "";
    }

    try {
      logger.debug("Transcribing audio file...");

      const transcriptResponse = await transcribe({
        model: openai.transcription("whisper-1"),
        audio: new Uint8Array(await audio.arrayBuffer()),
        providerOptions: {
          openai: {
            prompt:
              "Please provide a clear and concise transcription of the following audio recording. Remove filler words.",
          },
        },
      });

      const transcript = transcriptResponse.text.trim();
      if (!transcript) {
        return "";
      }

      logger.debug(transcript);

      return transcript;
    } catch (error) {
      logger.error("Error during audio transcription:", error);
      return throwE(error);
    }
  });
};
