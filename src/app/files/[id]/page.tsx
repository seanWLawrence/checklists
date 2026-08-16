import { notFound } from "next/navigation";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { SubmitButton } from "@/components/submit-button";
import { FILE_CATEGORIES } from "../file.types";
import { getFileForCurrentUser } from "../lib/file-records";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { updateFileClassificationAction } from "../actions/update-file-classification.action";
import type { FileRecord } from "../file.types";

export const dynamic = "force-dynamic";

export default async function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileResult = await getFileForCurrentUser(id).run();
  if (fileResult.isLeft()) return <main><p className="text-red-700">Could not load file: {String(fileResult.extract())}</p></main>;
  const file = fileResult.extract() as FileRecord | null;
  if (!file) notFound();
  const urlResult = await getPresignedGetObjectUrl({ filename: file.s3Key, responseContentType: file.contentType }).run();
  const downloadUrl = urlResult.isRight() ? urlResult.extract() : undefined;
  return <main className="max-w-2xl space-y-6"><section className="space-y-2"><Heading level={1}>{file.title ?? file.originalFilename}</Heading><p className="text-sm">Status: {file.status}</p><p className="break-all text-sm text-zinc-600 dark:text-zinc-300">Stored at: {file.s3Key}</p>{downloadUrl && <a className="underline underline-offset-2" href={downloadUrl}>Download file</a>}</section>
    <section className="space-y-3"><Heading level={2}>Organize file</Heading><p className="text-sm text-zinc-700 dark:text-zinc-300">Saving these fields moves the file into its final archive location.</p>
      <form action={updateFileClassificationAction} className="grid gap-3"><input type="hidden" name="id" value={file.id} />
        <Label label="Category"><select name="topLevelCategory" defaultValue={file.topLevelCategory ?? "other"} className="rounded-lg border-2 border-zinc-900 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900">{FILE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></Label>
        <Label label="Kind"><Input name="kind" required defaultValue={file.kind ?? "document"} placeholder="e.g. medical-bill" /></Label>
        <Label label="Title"><Input name="title" required defaultValue={file.title ?? ""} /></Label>
        <Label label="Primary date"><Input name="primaryDate" defaultValue={file.primaryDate ?? ""} placeholder="YYYY or YYYY-MM-DD" /></Label>
        <Label label="Entities"><Input name="entities" defaultValue={file.entities.join(", ")} placeholder="Comma-separated" /></Label>
        <Label label="Tags"><Input name="tags" defaultValue={file.tags.join(", ")} placeholder="Comma-separated" /></Label>
        <div><SubmitButton variant="primary">Save organization</SubmitButton></div></form>
    </section></main>;
}
