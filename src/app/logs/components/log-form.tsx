"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { MenuButton } from "@/components/menu-button";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/textarea";
import { Maybe } from "purify-ts/Maybe";
import { AssetPreview } from "@/components/asset-preview";
import { useAssetUpload } from "@/hooks/use-asset-upload";
import { createLogAction } from "../actions/create-log.action";
import { updateLogAction } from "../actions/update-log.action";
import { Block, BlockVariant, Log } from "../log.types";

const AudioRecorderInput = dynamic(
  () =>
    import("@/components/audio-recorder-input").then(
      (module) => module.AudioRecorderInput,
    ),
  { ssr: false },
);


const MARKDOWN_BLOCK_BUTTONS: { label: string; variant: BlockVariant }[] = [
  { label: "Short", variant: "shortMarkdown" },
  { label: "Long", variant: "longMarkdown" },
];

const BUTTON_CLASS = "text-xs py-1 px-2";

export const LogForm: React.FC<{
  log?: Log;
  initialMediaPreviewUrlsByBlockKey?: Record<string, string>;
}> = ({ log, initialMediaPreviewUrlsByBlockKey = {} }) => {
  const isEdit = Boolean(log);
  const [blocks, setBlocks] = useState<Block[]>(log?.blocks ?? []);
  const [localPreviewsByFilename, setLocalPreviewsByFilename] = useState<
    Record<string, string>
  >({});
  const { upload, isUploading } = useAssetUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blocksJson = useMemo(() => JSON.stringify(blocks), [blocks]);

  const updateBlockValue = ({
    blockIndex,
    value,
  }: {
    blockIndex: number;
    value: string;
  }) => {
    setBlocks((previousBlocks) =>
      previousBlocks.map((block, index) => {
        if (index !== blockIndex) return block;
        return { ...block, value };
      }),
    );
  };

  const addMarkdownBlock = ({ variant }: { variant: BlockVariant }) => {
    setBlocks((previousBlocks) => [
      ...previousBlocks,
      { variant, value: "" } as Block,
    ]);
  };

  const addAssetFromFile = async (file: File) => {
    const uploaded = await upload(file);

    if (uploaded) {
      const { filename, assetVariant, fileSizeBytes, previewUrl } = uploaded;
      setBlocks((previousBlocks) => [
        ...previousBlocks,
        { variant: "asset", filename, assetVariant, fileSizeBytes },
      ]);
      setLocalPreviewsByFilename((prev) => ({ ...prev, [filename]: previewUrl }));
    }
  };

  const onFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    for (const file of files) {
      await addAssetFromFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeBlock = ({ blockIndex }: { blockIndex: number }) => {
    setBlocks((previousBlocks) =>
      previousBlocks.filter((_, index) => index !== blockIndex),
    );
  };

  return (
    <div className="space-y-2 max-w-prose">
      <div className="flex space-x-1 items-center">
        <Heading level={1}>{isEdit ? "Edit" : "New"} log</Heading>

        {isEdit && (
          <MenuButton
            variant="ghost"
            menu={
              <div className="flex flex-col space-y-2">
                <form
                  action={() => {
                    const name = Maybe.fromNullable(window.prompt("New name?"))
                      .map((value) => value.trim())
                      .filter((value) => value.length > 0);

                    const currentBlocks = Maybe.fromNullable(blocksJson);

                    Maybe.sequence([name, currentBlocks]).map(
                      async ([nextName, nextBlocks]) => {
                        const formData = new FormData();

                        formData.set("name", nextName);
                        formData.set("blocks", nextBlocks);
                        formData.set("redirectToEdit", "true");

                        await createLogAction(formData);
                      },
                    );
                  }}
                >
                  <SubmitButton type="submit" variant="ghost">
                    Duplicate
                  </SubmitButton>
                </form>
              </div>
            }
          />
        )}
      </div>

      <form
        action={isEdit ? updateLogAction : createLogAction}
        className="space-y-3"
      >
        <Label label="Name">
          <Input
            type="text"
            name="name"
            required
            defaultValue={log?.name}
            className="w-full max-w-none"
          />
        </Label>

        {log && (
          <input
            name="metadata"
            type="hidden"
            value={JSON.stringify({
              id: log.id,
              createdAtIso: log.createdAtIso,
              updatedAtIso: log.updatedAtIso,
              user: log.user,
            })}
            readOnly
            required
          />
        )}

        {blocks.length > 0 && (
          <div className="space-y-2">
            {blocks.map((block, blockIndex) => (
              <div key={blockIndex} className="space-y-0.5">
                <div className="flex items-center justify-end gap-2 text-xs text-zinc-900 dark:text-zinc-100">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => removeBlock({ blockIndex })}
                  >
                    Remove
                  </Button>
                </div>

                {block.variant === "shortMarkdown" && (
                  <Input
                    className="w-full max-w-none"
                    value={block.value}
                    onChange={(event) =>
                      updateBlockValue({
                        blockIndex,
                        value: event.target.value,
                      })
                    }
                  />
                )}

                {block.variant === "longMarkdown" && (
                  <Textarea
                    className="w-full max-w-none"
                    value={block.value}
                    rows={4}
                    onChange={(event) =>
                      updateBlockValue({
                        blockIndex,
                        value: event.target.value,
                      })
                    }
                  />
                )}

                {block.variant === "asset" && (() => {
                  const previewUrl =
                    initialMediaPreviewUrlsByBlockKey[`${blockIndex}`] ??
                    localPreviewsByFilename[block.filename];

                  if (!previewUrl) {
                    return (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {block.filename}
                      </p>
                    );
                  }

                  return (
                    <AssetPreview
                      assetVariant={block.assetVariant}
                      previewUrl={previewUrl}
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        )}

        <input type="hidden" name="blocks" value={blocksJson} readOnly />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*"
          multiple
          className="sr-only"
          onChange={onFilesSelected}
        />

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {MARKDOWN_BLOCK_BUTTONS.map(({ label, variant }) => (
              <Button
                key={variant}
                type="button"
                variant="outline"
                className={BUTTON_CLASS}
                onClick={() => addMarkdownBlock({ variant })}
              >
                {label}
              </Button>
            ))}

            <AudioRecorderInput
              onChangeAction={async (file) => {
                if (file) await addAssetFromFile(file);
              }}
              shouldShowTranscribeOption={false}
              recordButtonClassName={BUTTON_CLASS}
            />

            <Button
              type="button"
              variant="outline"
              className={BUTTON_CLASS}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? "Uploading..." : "Add files"}
            </Button>
          </div>

          <SubmitButton type="submit" variant="primary">
            Save
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
