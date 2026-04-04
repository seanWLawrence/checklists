/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { Redis } = require("@upstash/redis");

const log = (...args) => console.log("[journal-v2]", ...args);
const warn = (...args) => console.warn("[journal-v2]", ...args);
const error = (...args) => console.error("[journal-v2]", ...args);

const stripWrappingQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const loadEnvLocal = () => {
  const envLocalPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envLocalPath)) {
    return;
  }

  const content = fs.readFileSync(envLocalPath, "utf8");

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();

    if (!key || process.env[key] != null) {
      continue;
    }

    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    process.env[key] = stripWrappingQuotes(rawValue);
  }
};

loadEnvLocal();

const getRedisClient = () => {
  if (process.env.NODE_ENV === "production") {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
    }

    return new Redis({ url, token });
  }

  return new Redis({
    url: process.env.KV_REST_API_URL ?? "http://localhost:8079",
    token: process.env.KV_REST_API_TOKEN ?? "example_token",
  });
};

const getJournalV2Key = ({ username, createdAtLocal }) =>
  `user#${username}#journal-v2#${createdAtLocal}`;

const scanJournalKeys = async ({
  client,
  cursor = "0",
  previousKeys = [],
}) => {
  const [nextCursor, ...foundGroups] = await client.scan(cursor, {
    match: "user#*#journal#*",
    type: "hash",
    count: 1000,
  });

  const nextKeys = previousKeys.concat(foundGroups.flat());

  if (nextCursor === "0") {
    return nextKeys;
  }

  return scanJournalKeys({
    client,
    cursor: nextCursor,
    previousKeys: nextKeys,
  });
};

const hmsetObject = async ({ client, key, item }) => {
  const entries = Object.entries(item).filter(([, value]) => value != null);

  if (entries.length === 0) {
    return;
  }

  await client.hmset(key, Object.fromEntries(entries));
};

const isRecord = (value) => typeof value === "object" && value !== null;

const parseMaybeJson = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
};

const asRecord = (value, label) => {
  const parsed = parseMaybeJson(value);

  if (!isRecord(parsed)) {
    throw new Error(`Invalid ${label}`);
  }

  return parsed;
};

const asOptionalRecord = (value) => {
  if (value == null) {
    return undefined;
  }

  return asRecord(value, "object");
};

const asString = (value, label) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
};

const asOptionalString = (value) => {
  if (value == null || value === "") {
    return undefined;
  }

  return typeof value === "string" ? value : String(value);
};

const asNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const asBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return undefined;
};

const asIsoString = (value, label) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const candidate = asString(value, label);
  const parsed = new Date(candidate);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label}`);
  }

  return parsed.toISOString();
};

const omitEmpty = (value) => {
  const entries = Object.entries(value).filter(([, entryValue]) => {
    return entryValue !== undefined;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const toALot = (value) => (value === true ? "aLot" : undefined);

const alreadyV2Shape = (raw) => {
  return raw?.schemaVersion === 2 || raw?.schemaVersion === "2";
};

const migrateLegacyJournal = ({ raw }) => {
  const user = asRecord(raw.user, "user");
  const habits = asOptionalRecord(raw.habits);
  const hobbies = asOptionalRecord(raw.hobbies);
  const sentiment = asOptionalRecord(raw.sentiment);
  const assets = parseMaybeJson(raw.assets);

  return {
    id: asString(raw.id, "id"),
    createdAtIso: asIsoString(raw.createdAtIso, "createdAtIso"),
    updatedAtIso: asIsoString(raw.updatedAtIso, "updatedAtIso"),
    user: {
      username: asString(user.username, "user.username"),
    },
    schemaVersion: 2,
    createdAtLocal: asString(raw.createdAtLocal, "createdAtLocal"),
    entry: {
      content: asOptionalString(raw.content),
      transcriptionRaw: asOptionalString(raw.transcriptionRaw),
      assets: Array.isArray(assets) ? assets : undefined,
    },
    checkIn: {
      ratings: omitEmpty({
        mood: asNumber(raw.moodLevel),
        energy: asNumber(raw.energyLevel),
      }),
      body: omitEmpty({
        cardio: toALot(asBoolean(habits?.cardio)),
        strengthTraining: toALot(asBoolean(habits?.strengthTraining)),
        coldExposure: toALot(asBoolean(habits?.coldExposure)),
        stretching: toALot(asBoolean(habits?.stretch)),
        followSleepSchedule: toALot(asBoolean(habits?.followSleepSchedule)),
      }),
      relationships: undefined,
      mind: omitEmpty({
        mindfulness: toALot(asBoolean(habits?.mindfulness)),
        breathwork: toALot(asBoolean(habits?.breathwork)),
      }),
      interests: omitEmpty({
        writing: toALot(asBoolean(hobbies?.writing ?? habits?.writing)),
        reading: toALot(asBoolean(hobbies?.reading ?? habits?.reading)),
        programming: toALot(asBoolean(hobbies?.programming)),
        music: toALot(asBoolean(hobbies?.music ?? habits?.music)),
        woodworking: toALot(
          asBoolean(hobbies?.woodworking ?? habits?.woodworking),
        ),
        martialArts: toALot(
          asBoolean(hobbies?.martialArts ?? habits?.martialArts),
        ),
        learning: toALot(asBoolean(hobbies?.learning ?? habits?.learning)),
        filmmaking: toALot(asBoolean(hobbies?.filming ?? habits?.filming)),
      }),
      vices: undefined,
    },
    analysis: omitEmpty({
      dailySummary: asOptionalString(raw.dailySummary),
      sentiment: sentiment
        ? omitEmpty({
            valence: asNumber(sentiment.valence),
            label: asOptionalString(sentiment.label),
            confidence: asNumber(sentiment.confidence),
          })
        : undefined,
      updatedAt: asOptionalString(raw.analysisUpdatedAt),
      version: asNumber(raw.analysisVersion),
    }),
  };
};

const migrateJournalsV2 = async ({ dryRun = true, limit } = {}) => {
  const client = getRedisClient();
  const keys = await scanJournalKeys({ client });
  const selectedKeys = typeof limit === "number" ? keys.slice(0, limit) : keys;

  log(
    `found ${keys.length} legacy journal keys${typeof limit === "number" ? `, processing ${selectedKeys.length}` : ""}`,
  );

  let migrated = 0;
  let skippedV2 = 0;
  let failed = 0;

  for (const key of selectedKeys) {
    try {
      const raw = await client.hgetall(key);

      if (raw == null) {
        throw new Error(`Journal key missing: ${key}`);
      }

      const migratedJournal = alreadyV2Shape(raw)
        ? raw
        : migrateLegacyJournal({ raw });

      const nextKey = getJournalV2Key({
        username: migratedJournal.user.username,
        createdAtLocal: migratedJournal.createdAtLocal,
      });
      const existingV2 = await client.hgetall(nextKey);

      if (existingV2 != null) {
        skippedV2 += 1;
        log(`skipping ${key} because v2 key already exists at ${nextKey}`);
        continue;
      }

      log(
        `${dryRun ? "would migrate" : "migrating"} ${key} -> ${nextKey} (schemaVersion ${migratedJournal.schemaVersion})`,
      );

      if (!dryRun) {
        await hmsetObject({ client, key: nextKey, item: migratedJournal });
      }

      migrated += 1;
    } catch (err) {
      failed += 1;
      error(`failed for ${key}`);
      error(err);
    }
  }

  log("summary", {
    totalFound: keys.length,
    processed: selectedKeys.length,
    migrated,
    skippedV2,
    failed,
    dryRun,
  });

  if (dryRun) {
    warn("Dry run only. Re-run with --write to persist migrated records.");
  }
};

const dryRun = process.argv.includes("--write") ? false : true;
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

migrateJournalsV2({
  dryRun,
  limit: Number.isFinite(limit) ? limit : undefined,
}).catch((err) => {
  error("migration failed");
  error(err);
  process.exitCode = 1;
});
