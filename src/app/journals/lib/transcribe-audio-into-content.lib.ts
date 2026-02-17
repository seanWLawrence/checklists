import "server-only";

import { experimental_transcribe as transcribe, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { EitherAsync } from "purify-ts";
import { logger } from "@/lib/logger";

const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;
const CLEANUP_MODEL = process.env.OPENAI_JOURNAL_TRANSCRIPTION_MODEL ?? "gpt-4o-mini";

const extractJson = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Could not extract JSON object from transcription cleanup response");
};

type TranscriptionSection = {
  heading: string;
  bullets: string[];
};

type TranscriptionCleanupResult = {
  sections: TranscriptionSection[];
  todos: string[];
  followUps: string[];
  unclear: string[];
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const decodeCleanupResult = (value: unknown): TranscriptionCleanupResult | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    sections?: unknown;
    todos?: unknown;
    followUps?: unknown;
    unclear?: unknown;
  };

  const sections = Array.isArray(candidate.sections)
    ? candidate.sections
        .map((section) => {
          if (!section || typeof section !== "object") {
            return null;
          }

          const typedSection = section as { heading?: unknown; bullets?: unknown };
          if (
            typeof typedSection.heading !== "string" ||
            !isStringArray(typedSection.bullets)
          ) {
            return null;
          }

          const heading = typedSection.heading.trim();
          const bullets = typedSection.bullets
            .map((bullet) => bullet.trim())
            .filter(Boolean);

          if (!heading || bullets.length === 0) {
            return null;
          }

          return { heading, bullets };
        })
        .filter((section): section is TranscriptionSection => section !== null)
    : [];

  if (sections.length === 0) {
    return null;
  }

  return {
    sections,
    todos: isStringArray(candidate.todos)
      ? candidate.todos.map((x) => x.trim()).filter(Boolean)
      : [],
    followUps: isStringArray(candidate.followUps)
      ? candidate.followUps.map((x) => x.trim()).filter(Boolean)
      : [],
    unclear: isStringArray(candidate.unclear)
      ? candidate.unclear.map((x) => x.trim()).filter(Boolean)
      : [],
  };
};

const formatCleanupResult = (result: TranscriptionCleanupResult): string => {
  const sectionLines = result.sections.flatMap((section) => [
    `### ${section.heading}`,
    ...section.bullets.map((bullet) => `- ${bullet}`),
    "",
  ]);

  const todoLines =
    result.todos.length > 0
      ? ["### Tasks", ...result.todos.map((todo) => `- ${todo}`), ""]
      : [];

  const followUpLines =
    result.followUps.length > 0
      ? ["### Follow-ups", ...result.followUps.map((followUp) => `- ${followUp}`), ""]
      : [];

  const unclearLines =
    result.unclear.length > 0
      ? ["### Unclear", ...result.unclear.map((item) => `- ${item}`), ""]
      : [];

  return [...sectionLines, ...todoLines, ...followUpLines, ...unclearLines]
    .join("\n")
    .trim();
};

const normalizeTranscriptFallback = (transcript: string): string =>
  transcript
    .split(/[\n\.\?!]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");

const cleanupTranscriptIntoStructuredContent = async (
  transcript: string,
): Promise<string> => {
  const response = await generateText({
    model: openai(CLEANUP_MODEL),
    temperature: 0.2,
    system:
      "You clean up voice journal transcriptions and return only strict JSON with no markdown and no extra keys.",
    prompt:
      "Transform this transcript into the exact JSON shape: " +
      '{ "sections": [{ "heading": string, "bullets": string[] }], "todos": string[], "followUps": string[], "unclear": string[] }. ' +
      "Rules: Group related ideas under concise headings. Keep bullets short and faithful to the transcript. Do not invent facts. Put anything uncertain in unclear. Extract explicit action items into todos and followUps. Return only JSON.\n\nTranscript:\n" +
      transcript,
  });

  const parsed = JSON.parse(extractJson(response.text));
  const decoded = decodeCleanupResult(parsed);

  if (!decoded) {
    throw new Error("Transcription cleanup response failed validation");
  }

  return formatCleanupResult(decoded);
};

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

      try {
        const structured = await cleanupTranscriptIntoStructuredContent(transcript);
        if (structured) {
          return structured;
        }
      } catch (error) {
        logger.warn("Failed to structure transcript; using fallback", error);
      }

      return normalizeTranscriptFallback(transcript);
    } catch (error) {
      logger.error("Error during audio transcription:", error);
      return throwE(error);
    }
  });
};
