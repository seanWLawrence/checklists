"use client";

import { useId, useMemo, useState } from "react";
import { Label } from "@/components/label";
import { Fieldset } from "@/components/fieldset";
import { JournalAsset } from "../journal.types";
import { mergeJournalContentByHeading } from "../lib/merge-journal-content-by-heading.lib";
import { JournalAssetManager } from "./journal-asset-manager";

interface AssetItem extends JournalAsset {
  previewUrl: string;
}

export const JournalFormAssetsAndContent: React.FC<{
  initialContent: string;
  initialTranscriptionRaw?: string;
  initialAssets: AssetItem[];
  contentName?: string;
  transcriptionRawName?: string;
  assetsName?: string;
  contentPlaceholder?: string;
  onTranscribingChangeAction?: (isTranscribing: boolean) => void;
  onUploadingChangeAction?: (isUploading: boolean) => void;
}> = ({
  initialContent,
  initialTranscriptionRaw = "",
  initialAssets,
  contentName = "content",
  transcriptionRawName = "transcriptionRaw",
  assetsName = "assets",
  contentPlaceholder,
  onTranscribingChangeAction,
  onUploadingChangeAction,
}) => {
  const [content, setContent] = useState(initialContent);
  const [transcriptionRaw, setTranscriptionRaw] = useState(
    initialTranscriptionRaw,
  );
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const contentTextareaId = useId();

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

  return (
    <>
      <Fieldset
        legend={
          <div className="flex items-center gap-2">
            <span>Content</span>

            <button
              type="button"
              className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              aria-expanded={isContentExpanded}
              aria-controls={contentTextareaId}
              onClick={() => setIsContentExpanded((current) => !current)}
            >
              {isContentExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        }
      >
        <div hidden={!isContentExpanded}>
          <Label label="Content">
            <textarea
              id={contentTextareaId}
              name={contentName}
              value={contentValue}
              onChange={(event) => setContent(event.target.value)}
              placeholder={contentPlaceholder}
              className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              rows={20}
            />
          </Label>
        </div>
        <input
          type="hidden"
          name={transcriptionRawName}
          value={transcriptionRaw}
          readOnly
        />
      </Fieldset>

      <Fieldset legend="Assets" className="max-w-prose w-full">
        <JournalAssetManager
          name={assetsName}
          initialUploadedAssets={initialAssets}
          onTranscribeChangeAction={onTranscribeChange}
          onTranscribingChangeAction={onTranscribingChangeAction}
          onUploadingChangeAction={onUploadingChangeAction}
        />
      </Fieldset>
    </>
  );
};
