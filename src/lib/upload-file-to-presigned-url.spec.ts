import { describe, expect, it, vi } from "vitest";
import { uploadFileToPresignedUrl } from "./upload-file-to-presigned-url";

describe("uploadFileToPresignedUrl", () => {
  const file = new File(["content"], "example.txt", { type: "text/plain" });

  it("uploads the file with its content type", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    const result = await uploadFileToPresignedUrl({
      file,
      uploadUrl: "https://s3.example.com/upload",
      fetchFn,
    }).run();

    expect(result.isRight()).toBe(true);
    expect(fetchFn).toHaveBeenCalledWith("https://s3.example.com/upload", {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: file,
    });
  });

  it("returns the upload response error", async () => {
    const result = await uploadFileToPresignedUrl({
      file,
      uploadUrl: "https://s3.example.com/upload",
      fetchFn: vi.fn().mockResolvedValue(new Response("not allowed", { status: 403 })),
    }).run();

    expect(result.extract()).toBe("Failed to upload file (403): not allowed");
  });
});
