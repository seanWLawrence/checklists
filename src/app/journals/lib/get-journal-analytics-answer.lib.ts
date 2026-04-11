import "@nobush/server-only";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { OPENAI_JOURNAL_ANALYSIS_MODEL } from "@/lib/env.server";
import { logger } from "@/lib/logger";
import { JournalAnalyticsAnswer } from "./journal-analytics-ai.types";
import { JournalAnalyticsQueryResult } from "./journal-analytics-query.types";

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

  throw new Error("Could not extract JSON object from model response");
};

export const getJournalAnalyticsAnswer = async ({
  question,
  plan,
  analytics,
}: {
  question: string;
  plan: {
    preset: "summarize-period";
    intent: "summary";
    answerFormat: "sections";
    instructions: string[];
  };
  analytics: JournalAnalyticsQueryResult;
}): Promise<JournalAnalyticsAnswer> => {
  const response = await generateText({
    model: openai(OPENAI_JOURNAL_ANALYSIS_MODEL),
    temperature: 0.2,
    system:
      "You are a grounded journal analytics analyst. Use only the supplied analytics data. Return only strict JSON with no markdown and no extra keys.",
    prompt:
      [
        `User question: ${question}`,
        `Preset: ${plan.preset}`,
        `Intent: ${plan.intent}`,
        `Answer format: ${plan.answerFormat}`,
        "Instructions:",
        ...plan.instructions.map((instruction, index) => `${index + 1}. ${instruction}`),
        "Rules:",
        "- Use only supplied data",
        "- Do not invent facts",
        "- Treat activity relationships as correlation, not causation",
        "- Mention thin evidence or low sample sizes when relevant",
        "- Keep the answer practical and concise",
        'Return this exact JSON shape: { "answer": string, "observations": string[], "caveats": string[], "followUps"?: string[] }',
        "Analytics data:",
        JSON.stringify(analytics),
      ].join("\n\n"),
  });

  const decoded = JournalAnalyticsAnswer.decode(
    JSON.parse(extractJson(response.text)),
  );

  if (decoded.isLeft()) {
    logger.warn(
      "Journal analytics answer failed codec validation",
      decoded.extract(),
    );
    throw new Error("Journal analytics answer validation failed");
  }

  return decoded.unsafeCoerce();
};
