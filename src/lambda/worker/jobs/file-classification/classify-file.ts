import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { EitherAsync } from "purify-ts/EitherAsync";
import { z } from "zod";
import { getWorkerSecret } from "../../get-worker-secret";
import { workerEnv } from "../../env";

const CATEGORY_VALUES = ["financial", "taxes", "work", "health", "insurance", "home", "identity", "education", "books", "music", "photos", "other"] as const;
const ClassificationSchema = z.object({
  topLevelCategory: z.enum(CATEGORY_VALUES),
  kind: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(200),
  primaryDate: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/).optional(),
  entities: z.array(z.string().trim().min(1).max(120)).max(20),
  tags: z.array(z.string().trim().min(1).max(80)).max(20),
  summary: z.string().trim().max(1000).optional(),
  confidence: z.number().min(0).max(1),
});

export type FileClassification = z.infer<typeof ClassificationSchema>;

let openAiClient: ReturnType<typeof createOpenAI> | null = null;

export const classifyFile = ({ originalFilename, extractedContent }: { originalFilename: string; extractedContent: string }): EitherAsync<unknown, FileClassification> =>
  EitherAsync(async ({ fromPromise }) => {
    if (!openAiClient) {
      const secret = await fromPromise(getWorkerSecret());
      openAiClient = createOpenAI({ apiKey: secret.OPENAI_API_KEY });
    }
    const response = await generateText({
      model: openAiClient(workerEnv.OPENAI_FILE_CLASSIFICATION_MODEL),
      temperature: 0,
      abortSignal: AbortSignal.timeout(workerEnv.TIMEOUT_IN_MIN * 60 * 1000),
      system: "Classify one personal archive file. Return only the requested schema. Do not include account, policy, employee, Social Security, or other sensitive numbers in title, entities, tags, or kind. Use a concise lowercase hyphenated kind. Infer only from supplied content.",
      prompt: `Original filename: ${originalFilename}\n\nExtracted content or metadata:\n${extractedContent}`,
      output: Output.object({ schema: ClassificationSchema }),
    });
    return response.output;
  });
