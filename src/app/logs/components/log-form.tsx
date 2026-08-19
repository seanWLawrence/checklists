"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Maybe } from "purify-ts/Maybe";

import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { MenuButton } from "@/components/menu-button";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/textarea";
import { AssetPreview } from "@/components/asset-preview";
import { useAssetUpload } from "@/hooks/use-asset-upload";
import { useTranscription } from "@/hooks/use-transcription";
import { createLogAction } from "../actions/create-log.action";
import { updateLogAction } from "../actions/update-log.action";
import { moveBlock } from "../lib/move-block";
import { Block, BlockVariant, Log } from "../log.types";
import { useUnsavedChangesConfirmation } from "@/hooks/use-unsaved-changes-confirmation";

const AudioRecorderInput = dynamic(
  () =>
    import("@/components/audio-recorder-input").then(
      (module) => module.AudioRecorderInput,
    ),
  { ssr: false },
);

type RecordingTranscriptionMode = "auto" | "skip";

const MARKDOWN_BLOCK_BUTTONS: { label: string; variant: BlockVariant }[] = [
  { label: "Short", variant: "shortMarkdown" },
  { label: "Long", variant: "longMarkdown" },
];

const BUTTON_CLASS = "text-xs py-1 px-2";

export const LogForm: React.FC<{
  log?: Log;
  initialMediaPreviewUrlsByFilename?: Record<string, string>;
}> = ({ log, initialMediaPreviewUrlsByFilename = {} }) => {
  const isEdit = Boolean(log);
  const [blocks, setBlocks] = useState<Block[]>(log?.blocks ?? []);
  const [localPreviewsByFilename, setLocalPreviewsByFilename] = useState<
    Record<string, string>
  >({});
  const { upload, isUploading } = useAssetUpload();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptionInputRef = useRef<HTMLInputElement>(null);
  const discardAfterTranscriptionFilenamesRef = useRef(new Set<string>());
  const nameRef = useRef<HTMLInputElement>(null);

  const blocksJson = useMemo(() => JSON.stringify(blocks), [blocks]);
  const initialBlocksJson = useMemo(
    () => JSON.stringify(log?.blocks ?? []),
    [log?.blocks],
  );

  const getIsDirty = useCallback(() => {
    return (
      nameRef.current?.value !== (log?.name ?? "") ||
      blocksJson !== initialBlocksJson
    );
  }, [blocksJson, initialBlocksJson, log?.name]);

  useUnsavedChangesConfirmation({ formRef, getIsDirty });

  const {
    startTranscription,
    setTranscribeStatus,
    clearTranscriptionState,
    statusByFilename: transcribeStatusByFilename,
    errorByFilename: transcribeErrorByFilename,
    isTranscribing,
  } = useTranscription({
    onCompleted: ({
      filename,
      transcriptionStructured,
      transcriptionRaw,
    }) => {
      const transcription =
        transcriptionRaw.trim() || transcriptionStructured.trim();
      const shouldDiscardAsset =
        discardAfterTranscriptionFilenamesRef.current.has(filename);

      discardAfterTranscriptionFilenamesRef.current.delete(filename);

      setBlocks((previousBlocks) =>
        previousBlocks.flatMap((block) => {
          if (
            block.variant !== "asset" ||
            block.assetVariant === "image" ||
            block.filename !== filename
          ) {
            return [block];
          }

          if (block.assetVariant === "video" || shouldDiscardAsset) {
            return [{ variant: "longMarkdown", value: transcription }];
          }

          return [{ ...block, transcription }];
        }),
      );
    },
  });

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

  const updateAssetBlockTranscription = ({
    blockIndex,
    transcription,
  }: {
    blockIndex: number;
    transcription: string;
  }) => {
    setBlocks((previousBlocks) =>
      previousBlocks.map((block, index) => {
        if (
          index !== blockIndex ||
          block.variant !== "asset" ||
          block.assetVariant === "image"
        ) {
          return block;
        }

        return {
          ...block,
          transcription,
        };
      }),
    );
  };

  const addMarkdownBlock = ({ variant }: { variant: BlockVariant }) => {
    setBlocks((previousBlocks) => [
      ...previousBlocks,
      { variant, value: "" } as Block,
    ]);
  };

  const addAssetFromFile = async ({
    file,
    transcriptionMode = "auto",
    shouldTranscribeVideo = false,
    discardSourceAfterTranscription = false,
  }: {
    file: File;
    transcriptionMode?: RecordingTranscriptionMode;
    shouldTranscribeVideo?: boolean;
    discardSourceAfterTranscription?: boolean;
  }) => {
    const uploaded = await upload(file);

    if (!uploaded) {
      return;
    }

    const { filename, assetVariant, fileSizeBytes, previewUrl } = uploaded;

    setBlocks((previousBlocks) => [
      ...previousBlocks,
      {
        variant: "asset",
        filename,
        assetVariant,
        fileSizeBytes,
        transcription: undefined,
      },
    ]);
    setLocalPreviewsByFilename((previous) => ({
      ...previous,
      [filename]: previewUrl,
    }));

    const shouldTranscribe =
      transcriptionMode === "auto" &&
      (assetVariant === "audio" ||
        (assetVariant === "video" && shouldTranscribeVideo));

    if (shouldTranscribe) {
      if (discardSourceAfterTranscription) {
        discardAfterTranscriptionFilenamesRef.current.add(filename);
      }

      setTranscribeStatus({ filename, status: "idle" });
      void startTranscription({
        filename,
        discardSourceAfterTranscription,
      });
    }
  };

  const onFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    for (const file of files) {
      await addAssetFromFile({ file });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onTranscriptionFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file?.type.startsWith("audio/") || file?.type === "video/mp4") {
      await addAssetFromFile({
        file,
        transcriptionMode: "auto",
        shouldTranscribeVideo: true,
        discardSourceAfterTranscription: true,
      });
    }

    if (transcriptionInputRef.current) {
      transcriptionInputRef.current.value = "";
    }
  };

  const removeBlock = ({ blockIndex }: { blockIndex: number }) => {
    const removedBlock = blocks[blockIndex];

    if (removedBlock?.variant === "asset") {
      const { filename } = removedBlock;

      setLocalPreviewsByFilename((current) => {
        const next = { ...current };
        delete next[filename];
        return next;
      });
      clearTranscriptionState({ filename });
    }

    setBlocks((previousBlocks) =>
      previousBlocks.filter((_, index) => index !== blockIndex),
    );
  };

  const reorderBlock = ({
    blockIndex,
    direction,
  }: {
    blockIndex: number;
    direction: "up" | "down";
  }) => {
    setBlocks((previousBlocks) =>
      moveBlock({
        blocks: previousBlocks,
        fromIndex: blockIndex,
        toIndex: direction === "up" ? blockIndex - 1 : blockIndex + 1,
      }),
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
        ref={formRef}
        action={isEdit ? updateLogAction : createLogAction}
        className="space-y-3"
      >
        <Label label="Name">
          <Input
            ref={nameRef}
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
          <div className="space-y-1.5">
            {blocks.map((block, blockIndex) => (
              <div key={blockIndex} className="space-y-0.5">
                <div className="flex items-center justify-end gap-2 text-xs text-zinc-900 dark:text-zinc-100">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      disabled={blockIndex === 0}
                      onClick={() =>
                        reorderBlock({ blockIndex, direction: "up" })
                      }
                    >
                      Up
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      disabled={blockIndex === blocks.length - 1}
                      onClick={() =>
                        reorderBlock({ blockIndex, direction: "down" })
                      }
                    >
                      Down
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => removeBlock({ blockIndex })}
                    >
                      Remove
                    </Button>
                  </div>
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
                    initialMediaPreviewUrlsByFilename[block.filename] ??
                    localPreviewsByFilename[block.filename];
                  const transcribeStatus = transcribeStatusByFilename[block.filename];
                  const transcribeError = transcribeErrorByFilename[block.filename];

                  return (
                    <div className="space-y-2">
                      {previewUrl ? (
                        <AssetPreview
                          assetVariant={block.assetVariant}
                          previewUrl={previewUrl}
                        />
                      ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {block.filename}
                        </p>
                      )}

                      {block.assetVariant !== "image" && (
                        <div className="space-y-2">
                          <Textarea
                            className="w-full max-w-none"
                            value={block.transcription ?? ""}
                            rows={4}
                            placeholder="Transcription"
                            onChange={(event) =>
                              updateAssetBlockTranscription({
                                blockIndex,
                                transcription: event.target.value,
                              })
                            }
                          />

                          {transcribeStatus === "error" && transcribeError && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-rose-600">
                                Transcription failed: {transcribeError}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

        <input
          ref={transcriptionInputRef}
          type="file"
          accept="audio/*,video/mp4"
          className="sr-only"
          onChange={onTranscriptionFileSelected}
        />

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center justify-end">
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
              onChangeAction={async (file, options) => {
                if (!file) {
                  return;
                }

                await addAssetFromFile({
                  file,
                  transcriptionMode: options?.transcriptionMode,
                });
              }}
              shouldShowTranscribeOption
              shouldShowRecordOnlyOption={false}
              buttonClassName={BUTTON_CLASS}
            />

            <Button
              type="button"
              variant="outline"
              className={BUTTON_CLASS}
              disabled={isUploading}
              onClick={() => transcriptionInputRef.current?.click()}
            >
              {isUploading ? "Uploading..." : "Transcribe audio/video"}
            </Button>

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

          <div className="flex items-center justify-end gap-2">
            <SubmitButton
              type="submit"
              variant="primary"
              className={BUTTON_CLASS}
              disabled={isUploading || isTranscribing}
            >
              {isTranscribing ? "Transcribing..." : "Save"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
};
