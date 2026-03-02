import { FlexibleSchema, generateText, JSONSchema7, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { logger } from "@/lib/logger";
import { workerEnv } from "../../env";
import { EitherAsync } from "purify-ts/EitherAsync";
import { TranscriptionJobOutput } from "../../job.types";
import { getWorkerSecret } from "../../get-worker-secret";
import { array, Codec, exactly, GetType, oneOf, string } from "purify-ts/Codec";
import { Either } from "purify-ts/Either";
import { TranscribeAudioPayload } from "./transcribe-audio";

const TRANSCRIPTION_STRUCTURING_PROMPT_VERSION = 1;
const TIMEOUT_IN_MILLI = workerEnv.TIMEOUT_IN_MIN * 60 * 1000;

let openAiClient: ReturnType<typeof createOpenAI> | null = null;

const AllowedHeading = oneOf([
  exactly("Dreams"),
  exactly("Grateful for"),
  exactly("Goals"),
  exactly("Highlights"),
  exactly("Ideas"),
  exactly("Things learned"),
  exactly("Action Items"),
  exactly("Other"),
]);

type AllowedHeading = GetType<typeof AllowedHeading>;

const ALLOWED_HEADINGS: AllowedHeading[] = [
  "Dreams",
  "Grateful for",
  "Goals",
  "Highlights",
  "Ideas",
  "Things learned",
  "Action Items",
  "Other",
];

const TranscriptionSection = Codec.interface({
  heading: AllowedHeading,
  bullets: array(string),
});

const TranscriptionStructuringResult = Codec.interface({
  sections: array(TranscriptionSection),
});

type TranscriptionStructuringResult = GetType<
  typeof TranscriptionStructuringResult
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
  return EitherAsync(async ({ liftEither, fromPromise }) => {
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
        schema: {
          jsonSchema: TranscriptionStructuringResult.schema() as JSONSchema7,
          validate: (value) => {
            const validation = TranscriptionStructuringResult.decode(value);

            if (validation.isRight()) {
              return { success: true, value: validation.extract() };
            }

            if (validation.isLeft()) {
              return { success: false, error: new Error(validation.extract()) };
            }

            return { success: false, error: new Error("Should never happen") };
          },
        } as FlexibleSchema<TranscriptionStructuringResult>,
      }),
    });

    const result = await liftEither(
      Either.encase(() => JSON.parse(response.text)).chain(
        TranscriptionStructuringResult.decode,
      ),
    );

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
