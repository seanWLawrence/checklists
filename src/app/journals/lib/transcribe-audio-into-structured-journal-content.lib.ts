import { experimental_transcribe as transcribe, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { EitherAsync } from "purify-ts";
import { logger } from "@/lib/logger";

const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;
const STRUCTURING_VERSION = 1;

export type TranscriptionStructuringStrategy =
  | "structured"
  | "fallback"
  | "empty"
  | "skipped-too-large";

export type TranscriptionAudioContentResult = {
  transcriptionStructured: string;
  transcriptionRaw: string;
  metadata: {
    transcriptionModel: string;
    structuringModel: string;
    structuringVersion: number;
    structuringStrategy: TranscriptionStructuringStrategy;
  };
};

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

  throw new Error(
    "Could not extract JSON object from transcription structuring response",
  );
};

const ALLOWED_HEADINGS = [
  "Dreams",
  "Grateful for",
  "Goals",
  "Highlights",
  "Ideas",
  "Things learned",
  "Action Items",
  "Other",
] as const;

type AllowedHeading = (typeof ALLOWED_HEADINGS)[number];

type TranscriptionSection = {
  heading: AllowedHeading;
  bullets: string[];
};

type TranscriptionStructuringResult = {
  sections: TranscriptionSection[];
};

const isAllowedHeading = (heading: string): heading is AllowedHeading =>
  (ALLOWED_HEADINGS as readonly string[]).includes(heading);

const decodeStructuringResult = (
  value: unknown,
): TranscriptionStructuringResult | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    sections?: unknown;
  };

  const sections = Array.isArray(candidate.sections)
    ? candidate.sections
        .map((section) => {
          if (!section || typeof section !== "object") {
            return null;
          }

          const typedSection = section as {
            heading?: unknown;
            bullets?: unknown;
          };
          if (
            typeof typedSection.heading !== "string" ||
            !Array.isArray(typedSection.bullets) ||
            !typedSection.bullets.every((item) => typeof item === "string")
          ) {
            return null;
          }

          const normalizedHeading = typedSection.heading.trim();
          const heading = isAllowedHeading(normalizedHeading)
            ? normalizedHeading
            : "Other";
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
  };
};

const formatStructuringResult = (
  result: TranscriptionStructuringResult,
): string => {
  const sectionsByHeading = new Map<string, string[]>();

  for (const heading of ALLOWED_HEADINGS) {
    sectionsByHeading.set(heading, []);
  }

  for (const section of result.sections) {
    const existing = sectionsByHeading.get(section.heading) ?? [];
    sectionsByHeading.set(section.heading, [...existing, ...section.bullets]);
  }

  const lines: string[] = [];

  for (const heading of ALLOWED_HEADINGS) {
    const sectionLines = (sectionsByHeading.get(heading) ?? []).filter(Boolean);
    if (sectionLines.length === 0) {
      continue;
    }

    lines.push(`## ${heading}`);
    lines.push(...sectionLines);
    lines.push("");
  }

  return lines.join("\n").trim();
};

const normalizeTranscriptFallback = (transcript: string): string => {
  const lines = transcript
    .split(/[\n\.\?!]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  return ["## Other", ...lines].join("\n");
};

const structureTranscriptContent = async (
  transcript: string,
  structuringModel: string,
): Promise<string> => {
  const response = await generateText({
    model: openai(structuringModel),
    temperature: 0.35,
    system:
      "You are a thoughtful journal-writing assistant. Keep the speaker's voice natural, conversational, and human. Preserve detail and nuance instead of aggressively shortening things. Return only strict JSON with no markdown and no extra keys.",
    prompt:
      "Transform this transcript into the exact JSON shape: " +
      '{ "sections": [{ "heading": "Dreams"|"Grateful for"|"Goals"|"Highlights"|"Ideas"|"Things learned"|"Action Items"|"Other", "bullets": string[] }] }. ' +
      "Rules: Use only the allowed headings. Keep as much meaningful detail as possible. Do not over-compress. Keep wording relaxed and natural (not corporate/formal). Preserve uncertainty and qualifiers (like maybe, probably, kind of) when they matter. You may lightly clean obvious transcription mistakes, but do not invent facts. If uncertain where something fits, place it in Other. Return only JSON.\n\nTranscript:\n" +
      transcript,
  });

  const parsed = JSON.parse(extractJson(response.text));
  const decoded = decodeStructuringResult(parsed);

  if (!decoded) {
    throw new Error("Transcription structuring response failed validation");
  }

  return formatStructuringResult(decoded);
};

export const transcribeJournalAudioIntoStructuredJournalContent = ({
  audio,
  audioTranscriptionModel,
  journalStructuringModel,
}: {
  audio: File;
  audioTranscriptionModel: string;
  journalStructuringModel: string;
}): EitherAsync<unknown, TranscriptionAudioContentResult> => {
  return EitherAsync(async ({ throwE }) => {
    if (audio.size >= MAX_TRANSCRIPTION_BYTES) {
      logger.warn(
        `Audio file too large to transcribe: ${audio.size} bytes. Skipping translation.`,
      );

      return {
        transcriptionStructured: "",
        transcriptionRaw: "",
        metadata: {
          transcriptionModel: audioTranscriptionModel,
          structuringModel: journalStructuringModel,
          structuringVersion: STRUCTURING_VERSION,
          structuringStrategy: "skipped-too-large",
        },
      };
    }

    try {
      logger.debug("Transcribing audio file...");

      const transcriptResponse = await transcribe({
        model: openai.transcription(audioTranscriptionModel),
        audio: new Uint8Array(await audio.arrayBuffer()),
        providerOptions: {
          openai: {
            prompt:
              "Please provide a faithful transcription of the audio recording. Keep natural phrasing and detail. Do not aggressively summarize or strip conversational context.",
          },
        },
      });

      const transcript = transcriptResponse.text.trim();
      if (!transcript) {
        return {
          transcriptionStructured: "",
          transcriptionRaw: "",
          metadata: {
            transcriptionModel: audioTranscriptionModel,
            structuringModel: journalStructuringModel,
            structuringVersion: STRUCTURING_VERSION,
            structuringStrategy: "empty",
          },
        };
      }

      try {
        const structured = await structureTranscriptContent(
          transcript,
          journalStructuringModel,
        );
        if (structured) {
          return {
            transcriptionStructured: structured,
            transcriptionRaw: transcript,
            metadata: {
              transcriptionModel: audioTranscriptionModel,
              structuringModel: journalStructuringModel,
              structuringVersion: STRUCTURING_VERSION,
              structuringStrategy: "structured",
            },
          };
        }
      } catch (error) {
        logger.warn("Failed to structure transcript; using fallback", error);
      }

      return {
        transcriptionStructured: normalizeTranscriptFallback(transcript),
        transcriptionRaw: transcript,
        metadata: {
          transcriptionModel: audioTranscriptionModel,
          structuringModel: journalStructuringModel,
          structuringVersion: STRUCTURING_VERSION,
          structuringStrategy: "fallback",
        },
      };
    } catch (error) {
      logger.error("Error during audio transcription:", error);
      return throwE(error);
    }
  });
};
