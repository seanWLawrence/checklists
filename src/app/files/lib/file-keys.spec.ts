import { describe, expect, it } from "vitest";
import { getIncomingFileKey, getOrganizedFileKey, isSupportedFileName } from "./file-keys";

describe("file keys", () => {
  it("scopes incoming files to their owner and stable file ID", () => {
    expect(getIncomingFileKey({ ownerId: "Sam Example", fileId: "f_123", originalFilename: "My taxes.pdf" })).toBe(
      "files/sam-example/_incoming/f_123/my-taxes.pdf",
    );
  });

  it("builds organized keys from validated metadata without sensitive source names", () => {
    expect(getOrganizedFileKey({
      ownerId: "Sam Example", fileId: "f_123", category: "taxes", kind: "W-2", primaryDate: "2018", entity: "ACME, Inc.", originalFilename: "ssn-123-45-6789.pdf",
    })).toBe("files/sam-example/documents/taxes/2018/w-2/2018--w-2--acme-inc--f_123.pdf");
  });

  it("accepts only the first-release file formats", () => {
    expect(isSupportedFileName("invoice.PDF")).toBe(true);
    expect(isSupportedFileName("archive.zip")).toBe(false);
  });
});
