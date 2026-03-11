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
    sections: [
      {
        name: "Morning",
        blocks: [
          { name: "Workout", variant: "checkbox", value: true },
          { name: "Focus", variant: "shortText", value: "Deep work" },
          { name: "Reflection", variant: "longText", value: "Good momentum." },
          { name: "Energy", variant: "number", value: 4 },
          { name: "Voice note", variant: "audio", value: "audio/test.m4a" },
          { name: "Desk setup", variant: "image", value: "image/test.jpg" },
          { name: "Demo clip", variant: "video", value: "video/test.mp4" },
        ],
      },
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
    sections: [
      {
        name: "Morning",
        blocks: [{ name: "Mystery", variant: "toggle", value: true }],
      },
    ],
  });

  expect(decoded.isLeft()).toBe(true);
});

test("Log decode fails when block value type is invalid for its variant", ({
  expect,
}) => {
  const nowIso = "2026-03-10T12:00:00.000Z";

  const decoded = Log.decode({
    id: id(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    user: user(),
    name: "Daily Capture",
    sections: [
      {
        name: "Morning",
        blocks: [{ name: "Workout", variant: "checkbox", value: "yes" }],
      },
    ],
  });

  expect(decoded.isLeft()).toBe(true);
});
