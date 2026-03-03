import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { logger } from "@/lib/logger";
import { workerEnv } from "../../env";
import { EitherAsync } from "purify-ts/EitherAsync";
import { TranscriptionJobOutput } from "../../job.types";
import { getWorkerSecret } from "../../get-worker-secret";
import { TranscribeAudioPayload } from "./transcribe-audio";
import { z } from "zod";

const TRANSCRIPTION_STRUCTURING_PROMPT_VERSION = 1;
const TIMEOUT_IN_MILLI = workerEnv.TIMEOUT_IN_MIN * 60 * 1000;

let openAiClient: ReturnType<typeof createOpenAI> | null = null;

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

const TranscriptionSectionSchema = z.object({
  heading: z.enum(ALLOWED_HEADINGS),
  bullets: z.array(z.string()),
});

const TranscriptionStructuringResultSchema = z.object({
  sections: z.array(TranscriptionSectionSchema),
});

type TranscriptionStructuringResult = z.infer<
  typeof TranscriptionStructuringResultSchema
>;

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

export const structureTranscription = ({
  transcriptionRaw,
  metadata,
}: TranscribeAudioPayload): EitherAsync<unknown, TranscriptionJobOutput> => {
  return EitherAsync(async ({ fromPromise }) => {
    logger.debug("Structuring transcription...");

    if (openAiClient === null) {
      const secret = await fromPromise(getWorkerSecret());

      openAiClient = createOpenAI({ apiKey: secret.OPENAI_API_KEY });
    }

    const response = await generateText({
      model: openAiClient(workerEnv.OPENAI_TRANSCRIPTION_STRUCTURING_MODEL),
      temperature: 0.35,
      abortSignal: AbortSignal.timeout(TIMEOUT_IN_MILLI),
      system:
        "You are a thoughtful journal-writing assistant. Keep the speaker's voice natural, conversational, and human. Preserve detail and nuance instead of aggressively shortening things. Return only strict JSON with no markdown and no extra keys.",
      prompt:
        "Transform this transcript into the exact JSON shape" +
        "Rules: Use only the allowed headings. Keep as much meaningful detail as possible. Do not over-compress. Keep wording relaxed and natural (not corporate/formal). Preserve uncertainty and qualifiers (like maybe, probably, kind of) when they matter. You may lightly clean obvious transcription mistakes, but do not invent facts. If uncertain where something fits, place it in Other. Return only JSON.\n\nTranscript:\n" +
        transcriptionRaw,
      output: Output.object({
        schema: TranscriptionStructuringResultSchema,
      }),
    });
    const result = response.output;

    return {
      transcriptionRaw,
      transcriptionStructured: formatStructuringResult(result),
      metadata: {
        transcriptionStructuringModel:
          workerEnv.OPENAI_TRANSCRIPTION_STRUCTURING_MODEL,
        transcriptionStructuringPromptVersion:
          TRANSCRIPTION_STRUCTURING_PROMPT_VERSION,
        ...metadata,
      },
    };
  });
};
