import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

import { CreatedAtLocal, Journal } from "../journal.types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import {
  AWS_JOURNAL_VECTOR_BUCKET_NAME,
  AWS_JOURNAL_VECTOR_INDEX_NAME,
} from "@/lib/secrets";
import { queryVectors, QueriedVector } from "@/lib/aws/s3vectors/query-vectors";
import { getAppEnvironment } from "@/lib/environment";
import { getJournalKey } from "../model/get-journal.model";
import { getSingleItem } from "@/lib/db/get-single-item";
import { logger } from "@/lib/logger";
import { Key } from "@/lib/types";
import type { DocumentType } from "@smithy/types";

const DEFAULT_MAX_VECTOR_DISTANCE = 0.9;
const DEFAULT_TOP_K = 40;

const parseMaxVectorDistance = (): number => {
  const value = Number(process.env.JOURNAL_VECTOR_MAX_DISTANCE);
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_VECTOR_DISTANCE;
  }

  return Math.max(0, Math.min(2, value));
};

const parseTopK = (): number => {
  const value = Number(process.env.JOURNAL_VECTOR_TOP_K);
  if (!Number.isFinite(value)) {
    return DEFAULT_TOP_K;
  }

  return Math.max(1, Math.min(100, Math.floor(value)));
};

const parseDimensions = (): EitherAsync<unknown, number> =>
  EitherAsync(async ({ throwE }) => {
    const dimensionsRaw = process.env.AWS_JOURNAL_VECTOR_DIMENSION;
    const dimensions = dimensionsRaw ? Number(dimensionsRaw) : NaN;
    if (!Number.isFinite(dimensions)) {
      return throwE("AWS_JOURNAL_VECTOR_DIMENSION must be a valid number");
    }

    return dimensions;
  });

const parseCreatedAtLocalFromVectorKey = (
  key: string,
): CreatedAtLocal | undefined => {
  const createdAtLocal = key.match(
    /^journalEmbedding#(\d{4,}-\d{2}-\d{2})#/,
  )?.[1];

  const decoded = CreatedAtLocal.decode(createdAtLocal)
    .toMaybe()
    .extractNullable();

  return decoded ?? undefined;
};

const parseCreatedAtLocalFromVectorMetadata = (
  metadata?: Record<string, unknown>,
): CreatedAtLocal | undefined => {
  const value = metadata?.createdAtLocal;
  const decoded = CreatedAtLocal.decode(value).toMaybe().extractNullable();

  return decoded ?? undefined;
};

export type JournalSemanticMatch = {
  journal: Journal;
  distance: number | undefined;
};

const buildVectorFilter = ({
  username,
  environment,
}: {
  username: string;
  environment: string;
}): DocumentType => ({
  $and: [
    { username: { $eq: username } },
    { environment: { $eq: environment } },
  ],
});

type SearchDeps = {
  getUserFn: typeof validateUserLoggedIn;
  getAppEnvironmentFn: typeof getAppEnvironment;
  getVectorBucketNameFn: () => EitherAsync<unknown, string>;
  getIndexNameFn: () => EitherAsync<unknown, string>;
  getDimensionsFn: () => EitherAsync<unknown, number>;
  getTopKFn: () => number;
  getMaxVectorDistanceFn: () => number;
  embedQueryFn: (query: string, dimensions: number) => Promise<number[]>;
  queryVectorsFn: (params: {
    vectorBucketName: string;
    indexName: string;
    queryEmbedding: number[];
    topK?: number;
    filter?: DocumentType;
  }) => EitherAsync<unknown, QueriedVector[]>;
  getJournalByKeyFn: (key: string) => EitherAsync<unknown, Journal>;
};

const defaultDeps: SearchDeps = {
  getUserFn: validateUserLoggedIn,
  getAppEnvironmentFn: getAppEnvironment,
  getVectorBucketNameFn: () =>
    EitherAsync.liftEither(AWS_JOURNAL_VECTOR_BUCKET_NAME),
  getIndexNameFn: () => EitherAsync.liftEither(AWS_JOURNAL_VECTOR_INDEX_NAME),
  getDimensionsFn: parseDimensions,
  getTopKFn: parseTopK,
  getMaxVectorDistanceFn: parseMaxVectorDistance,
  embedQueryFn: async (query, dimensions) => {
    const embedded = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: [query],
      providerOptions: { openai: { dimensions } },
    });

    return embedded.embeddings[0] ?? [];
  },
  queryVectorsFn: queryVectors,
  getJournalByKeyFn: (key) =>
    getSingleItem({ key: key as Key, decoder: Journal }),
};

export const searchJournalsSemantic = ({
  query,
  sinceYear,
  deps = {},
}: {
  query: string;
  sinceYear?: string;
  deps?: Partial<SearchDeps>;
}): EitherAsync<unknown, JournalSemanticMatch[]> => {
  const resolvedDeps: SearchDeps = {
    ...defaultDeps,
    ...deps,
  };

  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(resolvedDeps.getUserFn({}));
    const appEnvironment = resolvedDeps.getAppEnvironmentFn();
    const vectorBucketName = await fromPromise(resolvedDeps.getVectorBucketNameFn());
    const indexName = await fromPromise(resolvedDeps.getIndexNameFn());
    const dimensions = await fromPromise(resolvedDeps.getDimensionsFn());

    const queryEmbedding = await resolvedDeps.embedQueryFn(query, dimensions);
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Could not create an embedding for the search query");
    }

    const vectorMatches = await fromPromise(
      resolvedDeps.queryVectorsFn({
        vectorBucketName,
        indexName,
        queryEmbedding,
        topK: resolvedDeps.getTopKFn(),
        filter: buildVectorFilter({
          username: user.username,
          environment: appEnvironment,
        }),
      }),
    );

    const maxVectorDistance = resolvedDeps.getMaxVectorDistanceFn();
    const filteredVectorMatches = vectorMatches.filter((vectorMatch) => {
      return (
        typeof vectorMatch.distance === "number" &&
        vectorMatch.distance <= maxVectorDistance
      );
    });

    const rankedDistances = new Map<CreatedAtLocal, number | undefined>();

    for (const vectorMatch of filteredVectorMatches) {
      const createdAtLocal =
        parseCreatedAtLocalFromVectorMetadata(vectorMatch.metadata) ??
        parseCreatedAtLocalFromVectorKey(vectorMatch.key);
      if (!createdAtLocal) {
        continue;
      }

      if (sinceYear && !createdAtLocal.startsWith(`${sinceYear}-`)) {
        continue;
      }

      const existing = rankedDistances.get(createdAtLocal);
      const next = vectorMatch.distance;
      if (existing === undefined) {
        rankedDistances.set(createdAtLocal, next);
        continue;
      }

      if (typeof next === "number" && next < existing) {
        rankedDistances.set(createdAtLocal, next);
      }
    }

    const rankedCreatedAtLocals = Array.from(rankedDistances.entries())
      .sort((a, b) => {
        const distanceA = a[1] ?? Number.POSITIVE_INFINITY;
        const distanceB = b[1] ?? Number.POSITIVE_INFINITY;
        return distanceA - distanceB;
      })
      .map(([createdAtLocal]) => createdAtLocal);

    const entries = await Promise.all(
      rankedCreatedAtLocals.map(async (createdAtLocal) => {
        const key = getJournalKey({ user, createdAtLocal });
        const maybeJournal = await resolvedDeps.getJournalByKeyFn(key).run();

        if (maybeJournal.isLeft()) {
          logger.warn(`Vector hit has no matching journal key '${key}'`);
          return undefined;
        }

        return {
          journal: maybeJournal.extract(),
          distance: rankedDistances.get(createdAtLocal),
        };
      }),
    );

    return entries.filter(
      (entry): entry is JournalSemanticMatch => Boolean(entry),
    );
  });
};
