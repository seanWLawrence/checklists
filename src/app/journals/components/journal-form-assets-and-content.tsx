"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/label";
import { AssetManager } from "@/components/asset-manager";
import { Fieldset } from "@/components/fieldset";
import { JournalAsset } from "../journal.types";
import { mergeJournalContentByHeading } from "../lib/merge-journal-content-by-heading.lib";

interface AssetItem extends JournalAsset {
  previewUrl: string;
}

export const JournalFormAssetsAndContent: React.FC<{
  initialContent: string;
  initialWrittenContent?: string;
  initialTranscriptionRaw?: string;
  initialAssets: AssetItem[];
  contentName?: string;
  writtenContentName?: string;
  transcriptionRawName?: string;
  assetsName?: string;
  contentPlaceholder?: string;
}> = ({
  initialContent,
  initialWrittenContent,
  initialTranscriptionRaw = "",
  initialAssets,
  contentName = "content",
  writtenContentName = "writtenContent",
  transcriptionRawName = "transcriptionRaw",
  assetsName = "assets",
  contentPlaceholder,
}) => {
  const [content, setContent] = useState(initialContent);
  const [writtenContent, setWrittenContent] = useState(
    initialWrittenContent ?? initialContent,
  );
  const [transcriptionRaw, setTranscriptionRaw] = useState(
    initialTranscriptionRaw,
  );

  const onTranscribeChange = (
    asset: AssetItem,
    transcription: {
      transcriptionStructured: string;
      transcriptionRaw: string;
    },
  ) => {
    const structured = transcription.transcriptionStructured.trim();
    const raw = transcription.transcriptionRaw.trim();

    if (structured) {
      setContent((current) =>
        mergeJournalContentByHeading({
          current,
          incoming: structured,
        }),
      );
    }

    if (raw) {
      setTranscriptionRaw((current) => {
        const prefix = current.trim() ? `${current.trim()}\n\n` : "";
        return `${prefix}[${asset.filename}]\n${raw}`;
      });
    }
  };

  const contentValue = useMemo(() => content, [content]);
  const writtenContentValue = useMemo(() => writtenContent, [writtenContent]);

  return (
    <>
      <Fieldset legend="Content">
        <Label label="Content">
          <textarea
            name={contentName}
            value={contentValue}
            onChange={(event) => {
              setContent(event.target.value);
              setWrittenContent(event.target.value);
            }}
            placeholder={contentPlaceholder}
            className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={20}
          />
        </Label>
        <input
          type="hidden"
          name={writtenContentName}
          value={writtenContentValue}
          readOnly
        />
        <input
          type="hidden"
          name={transcriptionRawName}
          value={transcriptionRaw}
          readOnly
        />
      </Fieldset>

      <Fieldset legend="Assets" className="max-w-prose w-full">
        <AssetManager
          name={assetsName}
          initialUploadedAssets={initialAssets}
          onTranscribeChangeAction={onTranscribeChange}
        />
      </Fieldset>
    </>
  );
};
