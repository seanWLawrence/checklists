import { test } from "vitest";
import { Left, Right } from "purify-ts/Either";
import { EitherAsync } from "purify-ts/EitherAsync";

import { searchJournalsSemantic } from "./search-journals-semantic.lib";
import { AppEnvironment } from "@/lib/env.server";

const user = { username: "sean" };

const makeJournal = (createdAtLocal: string) =>
  ({
    id: `${createdAtLocal.replaceAll("-", "")}-1111-2222-3333-444444444444`,
    createdAtIso: new Date("2026-01-01T00:00:00.000Z"),
    updatedAtIso: new Date("2026-01-01T00:00:00.000Z"),
    user,
    content: `Entry for ${createdAtLocal}`,
    createdAtLocal,
    assets: undefined,
    energyLevel: undefined,
    moodLevel: undefined,
    healthLevel: undefined,
    creativityLevel: undefined,
    relationshipsLevel: undefined,
  }) as never;

const makeDeps = ({
  queryVectorsOutput,
}: {
  queryVectorsOutput: Array<{
    key: string;
    distance?: number;
    metadata?: Record<string, unknown>;
  }>;
}) => {
  return {
    getUserFn: () => EitherAsync.liftEither(Right(user)),
    getAppEnvironmentFn: () => "dev" as AppEnvironment,
    embedQueryFn: async () => [0.1, 0.2, 0.3],
    queryVectorsFn: () => EitherAsync.liftEither(Right(queryVectorsOutput)),
    getJournalByKeyFn: (key: string) => {
      if (key.includes("2026-01-01")) {
        return EitherAsync.liftEither(Right(makeJournal("2026-01-01")));
      }
      if (key.includes("2026-01-02")) {
        return EitherAsync.liftEither(Right(makeJournal("2026-01-02")));
      }
      if (key.includes("2025-03-01")) {
        return EitherAsync.liftEither(Right(makeJournal("2025-03-01")));
      }
      return EitherAsync.liftEither(Left("missing"));
    },
  } as const;
};

test("searchJournalsSemantic dedupes by date, keeps best distance, and sorts ascending", async ({
  expect,
}) => {
  const deps = makeDeps({
    queryVectorsOutput: [
      {
        key: "journalEmbedding#old",
        distance: 0.7,
        metadata: { createdAtLocal: "2026-01-02" },
      },
      {
        key: "journalEmbedding#other",
        distance: 0.4,
        metadata: { createdAtLocal: "2026-01-01" },
      },
      {
        key: "journalEmbedding#better",
        distance: 0.3,
        metadata: { createdAtLocal: "2026-01-02" },
      },
    ],
  });

  const result = await searchJournalsSemantic({
    query: "hello",
    deps,
  }).run();

  expect(result.isRight()).toBe(true);
  const value = result.caseOf({
    Left: () => [],
    Right: (matches) => matches,
  });

  expect(value).toHaveLength(2);
  expect(value[0].journal.createdAtLocal).toBe("2026-01-02");
  expect(value[0].distance).toBe(0.3);
  expect(value[1].journal.createdAtLocal).toBe("2026-01-01");
  expect(value[1].distance).toBe(0.4);
});

test("searchJournalsSemantic applies year and distance filters", async ({
  expect,
}) => {
  const deps = makeDeps({
    queryVectorsOutput: [
      {
        key: "k1",
        distance: 0.2,
        metadata: { createdAtLocal: "2025-03-01" },
      },
      {
        key: "k2",
        distance: 0.95,
        metadata: { createdAtLocal: "2025-05-01" },
      },
      {
        key: "k3",
        distance: 0.2,
        metadata: { createdAtLocal: "2024-01-01" },
      },
    ],
  });

  const result = await searchJournalsSemantic({
    query: "learning",
    sinceYear: "2025",
    deps,
  }).run();

  expect(result.isRight()).toBe(true);
  const value = result.caseOf({
    Left: () => [],
    Right: (matches) => matches,
  });

  expect(value).toHaveLength(1);
  expect(value[0].journal.createdAtLocal).toBe("2025-03-01");
});

test("searchJournalsSemantic sends an explicit metadata filter for username and environment", async ({
  expect,
}) => {
  let receivedFilter: unknown;

  const deps = {
    ...makeDeps({ queryVectorsOutput: [] }),
    queryVectorsFn: ({
      filter,
    }: {
      filter?: unknown;
      vectorBucketName: string;
      indexName: string;
      queryEmbedding: number[];
      topK?: number;
    }) => {
      receivedFilter = filter;
      return EitherAsync.liftEither(Right([]));
    },
  };

  const result = await searchJournalsSemantic({
    query: "test",
    deps,
  }).run();

  expect(result.isRight()).toBe(true);
  expect(receivedFilter).toEqual({
    $and: [
      { username: { $eq: "sean" } },
      { environment: { $eq: "dev" } },
    ],
  });
});
