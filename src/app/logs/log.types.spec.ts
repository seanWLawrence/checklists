import { test } from "vitest";
import { id } from "@/factories/id.factory";
import { user } from "@/factories/user.factory";
import { Log } from "./log.types";

test("Log decodes with all block variants", ({ expect }) => {
  const nowIso = "2026-03-10T12:00:00.000Z";

  const decoded = Log.decode({
    id: id(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    user: user(),
    name: "Daily Capture",
    blocks: [
      { variant: "shortMarkdown", value: "# Heading" },
      { variant: "longMarkdown", value: "Some longer notes here." },
      { variant: "asset", assetVariant: "audio", filename: "audio/test.m4a" },
      {
        variant: "asset",
        assetVariant: "image",
        filename: "image/test.jpg",
        fileSizeBytes: 1024,
      },
      { variant: "asset", assetVariant: "video", filename: "video/test.mp4" },
    ],
  });

  expect(decoded.isRight()).toBe(true);
});

test("Log decode fails for unknown block variant", ({ expect }) => {
  const nowIso = "2026-03-10T12:00:00.000Z";

  const decoded = Log.decode({
    id: id(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    user: user(),
    name: "Daily Capture",
    blocks: [{ variant: "toggle", value: true }],
  });

  expect(decoded.isLeft()).toBe(true);
});

test("Log decode fails when asset block has invalid assetVariant", ({
  expect,
}) => {
  const nowIso = "2026-03-10T12:00:00.000Z";

  const decoded = Log.decode({
    id: id(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    user: user(),
    name: "Daily Capture",
    blocks: [{ variant: "asset", assetVariant: "pdf", filename: "doc.pdf" }],
  });

  expect(decoded.isLeft()).toBe(true);
});
