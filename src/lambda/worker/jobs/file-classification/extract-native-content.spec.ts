import { describe, expect, it } from "vitest";
import { extractNativeContent } from "./extract-native-content";

describe("extractNativeContent", () => {
  it("extracts UTF-8 text files", () => {
    expect(
      extractNativeContent({
        originalFilename: "note.txt",
        contentType: "text/plain",
        body: new TextEncoder().encode("A useful note"),
      }),
    ).toBe("A useful note");
  });

  it("returns no content for formats without an implemented native extractor", () => {
    expect(
      extractNativeContent({
        originalFilename: "scan.pdf",
        contentType: "application/pdf",
        body: new Uint8Array([1, 2, 3]),
      }),
    ).toBe("");
  });
});
