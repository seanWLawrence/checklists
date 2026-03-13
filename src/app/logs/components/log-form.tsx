"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { AssetItemWithPreview } from "@/components/assets/asset.types";
import { AssetManager } from "@/components/asset-manager";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { MenuButton } from "@/components/menu-button";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/textarea";
import { Maybe } from "purify-ts/Maybe";
import { createLogAction } from "../actions/create-log.action";
import { updateLogAction } from "../actions/update-log.action";
import { Block, BlockVariant, Log } from "../log.types";

const BLOCK_BUTTONS: { label: string; variant: BlockVariant }[] = [
  { label: "Short", variant: "shortMarkdown" },
  { label: "Long", variant: "longMarkdown" },
  { label: "Asset", variant: "asset" },
];

const createDefaultBlock = ({ variant }: { variant: BlockVariant }): Block => {
  if (variant === "asset") {
    return { variant, assetVariant: "image", filename: "" };
  }

  return { variant, value: "" };
};

export const LogForm: React.FC<{
  log?: Log;
  initialMediaPreviewUrlsByBlockKey?: Record<string, string>;
}> = ({ log, initialMediaPreviewUrlsByBlockKey = {} }) => {
  const isEdit = Boolean(log);
  const [blocks, setBlocks] = useState<Block[]>(log?.blocks ?? []);

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

  const updateAssetBlock = ({
    blockIndex,
    assets,
  }: {
    blockIndex: number;
    assets: AssetItemWithPreview[];
  }) => {
    const asset = assets[0];

    setBlocks((previousBlocks) =>
      previousBlocks.map((block, index) => {
        if (index !== blockIndex || block.variant !== "asset") return block;

        return {
          ...block,
          filename: asset?.filename ?? "",
          assetVariant: asset?.variant ?? block.assetVariant,
          fileSizeBytes: asset?.fileSizeBytes,
        };
      }),
    );
  };

  const addBlock = ({ variant }: { variant: BlockVariant }) => {
    setBlocks((previousBlocks) => [
      ...previousBlocks,
      createDefaultBlock({ variant }),
    ]);
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

                {block.variant === "asset" && (
                  <AssetManager
                    initialUploadedAssets={
                      block.filename.trim() !== "" &&
                      initialMediaPreviewUrlsByBlockKey[`${blockIndex}`]
                        ? [
                            {
                              caption: "",
                              filename: block.filename,
                              variant: block.assetVariant,
                              previewUrl:
                                initialMediaPreviewUrlsByBlockKey[
                                  `${blockIndex}`
                                ],
                              fileSizeBytes: block.fileSizeBytes,
                            },
                          ]
                        : []
                    }
                    allowedVariants={["audio", "image", "video"]}
                    multiple={false}
                    shouldShowRecorder={true}
                    shouldShowCaptionField={false}
                    shouldHideAddFilesWhenHasAssets={true}
                    shouldEnableTranscription={false}
                    shouldShowRecorderTranscribeOption={false}
                    onAssetsChangeAction={(assets) =>
                      updateAssetBlock({ blockIndex, assets })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <input type="hidden" name="blocks" value={blocksJson} readOnly />

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {BLOCK_BUTTONS.map(({ label, variant }) => (
              <Button
                key={variant}
                type="button"
                variant="outline"
                className="text-xs py-1 px-2"
                onClick={() => addBlock({ variant })}
              >
                {label}
              </Button>
            ))}
          </div>

          <SubmitButton type="submit" variant="primary">
            Save
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
