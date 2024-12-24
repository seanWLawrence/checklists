import { test, vi } from "vitest";
import { prettifyNoteContent } from "./prettify-note-content";

test("formats markdown content", async ({ expect }) => {
  const render = vi.fn();

  const markdownItFn = vi
    .fn()
    .mockReturnValue({ render, use: vi.fn().mockReturnThis() });

  const content = "hello world";

  prettifyNoteContent({
    markdownItFn,
    content,
  });

  expect(render).toHaveBeenCalledWith(content);
});
