import Link from "next/link";
import { Heading } from "@/components/heading";
import { FileUploadManager } from "./components/file-upload-manager";
import { getFilesForCurrentUser } from "./lib/file-records";
import type { FileRecord } from "./file.types";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const result = await getFilesForCurrentUser().run();
  if (result.isLeft()) return <main><Heading level={1}>Files</Heading><p className="mt-3 text-red-700">Could not load files: {String(result.extract())}</p></main>;
  const files = result.extract() as FileRecord[];
  return <main className="max-w-3xl space-y-6">
    <section className="space-y-3"><Heading level={1}>Files</Heading><p className="text-sm text-zinc-700 dark:text-zinc-300">Upload personal files into your private archive. New uploads will be organized after review or automatic processing.</p><FileUploadManager /></section>
    <section className="space-y-3"><Heading level={2}>Recent uploads</Heading>
      {files.length === 0 ? <p className="text-sm text-zinc-700">No files yet.</p> : <ul className="divide-y divide-zinc-200 rounded-lg border dark:divide-zinc-700">{files.map((file) => <li key={file.id} className="p-3"><Link href={`/files/${file.id}`} className="font-medium underline underline-offset-2">{file.title ?? file.originalFilename}</Link><div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{file.originalFilename} · {file.status}{file.topLevelCategory ? ` · ${file.topLevelCategory}` : ""}</div></li>)}</ul>}
    </section>
  </main>;
}
