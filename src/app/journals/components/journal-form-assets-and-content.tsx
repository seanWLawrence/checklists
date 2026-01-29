"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/label";
import { AssetManager } from "@/components/asset-manager";
import { Fieldset } from "@/components/fieldset";
import { JournalAsset } from "../journal.types";

interface AssetItem extends JournalAsset {
  previewUrl: string;
}

export const JournalFormAssetsAndContent: React.FC<{
  initialContent: string;
  initialAssets: AssetItem[];
  contentName?: string;
  assetsName?: string;
}> = ({
  initialContent,
  initialAssets,
  contentName = "content",
  assetsName = "assets",
}) => {
  const [content, setContent] = useState(initialContent);

  const onTranscribeChange = (asset: AssetItem, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const timestamp = Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

    const heading = `## From audio - ${asset.caption || asset.filename}`;
    const formatted =
      `${heading} ${timestamp}\n` + trimmed.split(".").join("\n");

    setContent((current) =>
      current ? `${current}\n\n${formatted}` : formatted,
    );
  };

  const contentValue = useMemo(() => content, [content]);

  return (
    <>
      <Fieldset legend="Content">
        <Label label="Content">
          <textarea
            name={contentName}
            value={contentValue}
            onChange={(event) => setContent(event.target.value)}
            className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={20}
            required
          />
        </Label>
      </Fieldset>

      <Fieldset legend="Assets" className="max-w-prose w-full space-y-4">
        <AssetManager
          name={assetsName}
          initialAssets={initialAssets}
          onTranscribeChange={onTranscribeChange}
        />
      </Fieldset>
    </>
  );
};
