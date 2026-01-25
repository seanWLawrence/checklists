import "server-only";

import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";
import { EitherAsync } from "purify-ts";
import { logger } from "@/lib/logger";

const TRANSCRIPTION_PREFIX = "## From audio - ";
const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;

export const transcribeJournalAudioIntoContent = ({
  audio,
}: {
  audio: File;
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ throwE }) => {
    if (audio.size > MAX_TRANSCRIPTION_BYTES) {
      return "";
    }

    try {
      logger.debug("Transcribing audio file...");

      const transcriptResponse = await transcribe({
        model: openai.transcription("whisper-1"),
        audio: new Uint8Array(await audio.arrayBuffer()),
      });

      const transcript = transcriptResponse.text.trim();
      if (!transcript) {
        return "";
      }

      logger.debug(transcript);

      return (
        TRANSCRIPTION_PREFIX +
        `${Intl.DateTimeFormat("en-US", {
          hour: "numeric", // 12-hour
          minute: "2-digit",
          hour12: true,
        }).format(new Date())}\n` +
        transcript.split(".").join("\n")
      );
    } catch (error) {
      return throwE(error);
    }
  }).ifLeft(logger.error);
};
