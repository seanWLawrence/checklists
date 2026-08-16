"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Button } from "@/components/button";
import { uploadFileToPresignedUrl } from "@/lib/upload-file-to-presigned-url";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const SUPPORTED_EXTENSION_PATTERN = /\.(pdf|jpe?g|png|gif|webp|heic|mp3|wav|m4a|aac|ogg|flac|docx|epub|txt)$/i;

type UploadState = { localId: string; name: string; status: "uploading" | "uploaded" | "failed"; error?: string };

export const FileUploadManager = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [keepContentOutOfAi, setKeepContentOutOfAi] = useState(false);

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      const localId = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
      const error = file.size > MAX_FILE_SIZE_BYTES || file.size === 0
        ? "Files must be between 1 byte and 100 MB"
        : !SUPPORTED_EXTENSION_PATTERN.test(file.name)
          ? "Supported types: PDF, images, audio, DOCX, EPUB, and TXT"
          : undefined;
      if (error) {
        setUploads((current) => [...current, { localId, name: file.name, status: "failed", error }]);
        continue;
      }
      setUploads((current) => [...current, { localId, name: file.name, status: "uploading" }]);
      try {
        const presignResponse = await fetch("/api/files/presign/put", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, fileSizeBytes: file.size, contentType: file.type || undefined }),
        });
        if (!presignResponse.ok) throw new Error(await presignResponse.text());
        const { fileId, uploadUrl } = await presignResponse.json() as { fileId: string; uploadUrl: string };
        const uploadResult = await uploadFileToPresignedUrl({ file, uploadUrl }).run();
        if (uploadResult.isLeft()) throw new Error(String(uploadResult.extract()));
        const createResponse = await fetch("/api/files", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, filename: file.name, fileSizeBytes: file.size, contentType: file.type || undefined, keepContentOutOfAi }),
        });
        if (!createResponse.ok) throw new Error(await createResponse.text());
        setUploads((current) => current.map((upload) => upload.localId === localId ? { ...upload, status: "uploaded" } : upload));
      } catch (error) {
        setUploads((current) => current.map((upload) => upload.localId === localId ? { ...upload, status: "failed", error: error instanceof Error ? error.message : "Upload failed" } : upload));
      }
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  return <section className="space-y-2">
    <div className="w-full rounded-lg border-2 border-dashed border-zinc-400 px-8 py-12 text-center dark:border-zinc-600" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <p className="text-sm">Drop files here, or choose files to upload. Maximum 100 MB each.</p>
      <label className="mt-3 flex items-center justify-center gap-2 text-sm"><input type="checkbox" checked={keepContentOutOfAi} onChange={(event) => setKeepContentOutOfAi(event.target.checked)} /> Keep content out of AI processing</label>
      <div className="mt-3 flex justify-center"><Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>Choose files</Button></div>
      <input ref={inputRef} className="hidden" type="file" multiple onChange={onChange} />
    </div>
    {uploads.length > 0 && <ul className="space-y-1 text-sm" aria-live="polite">{uploads.map((upload) => <li key={upload.localId} className={upload.status === "failed" ? "text-red-700" : ""}>{upload.name}: {upload.status}{upload.error ? ` — ${upload.error}` : ""}</li>)}</ul>}
  </section>;
};
