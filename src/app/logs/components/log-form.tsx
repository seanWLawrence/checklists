"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/button";
import { Audio } from "@/components/audio";
import { Image } from "@/components/image";
import { Video } from "@/components/video";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { MenuButton } from "@/components/menu-button";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/textarea";
import { Maybe } from "purify-ts/Maybe";
import { EitherAsync } from "purify-ts/EitherAsync";
import { logger } from "@/lib/logger";
import {
  AssetsPresignPutObjectBody,
  AssetsPresignPutObjectResponse,
} from "@/app/api/assets/presign/put/types";
import { AssetVariant } from "@/components/assets/asset.types";
import { createLogAction } from "../actions/create-log.action";
import { updateLogAction } from "../actions/update-log.action";
import { AssetBlock, Block, BlockVariant, Log } from "../log.types";

const AudioRecorderInput = dynamic(
  () =>
    import("@/components/audio-recorder-input").then(
      (module) => module.AudioRecorderInput,
    ),
  { ssr: false },
);

const getAssetVariant = (file: File): AssetVariant | null => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return null;
};

const uploadFile = (
  file: File,
): EitherAsync<
  unknown,
  Pick<AssetBlock, "filename" | "assetVariant" | "fileSizeBytes">
> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const assetVariant = getAssetVariant(file);

    if (!assetVariant) {
      return throwE(`Unsupported file type: ${file.type}`);
    }

    const body = await liftEither(
      AssetsPresignPutObjectBody.decode({
        filename: file.name,
        contentType: file.type,
        variant: assetVariant,
      }).map((decoded) => JSON.stringify(decoded)),
    );

    const presignResponse = await fetch("/api/assets/presign/put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!presignResponse.ok) {
      return throwE("Failed to get upload URL");
    }

    const { uploadUrl, filename } = await liftEither(
      AssetsPresignPutObjectResponse.decode(await presignResponse.json()),
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: file.type ? { "Content-Type": file.type } : undefined,
      body: file,
    });

    if (!uploadResponse.ok) {
      return throwE("Failed to upload file");
    }

    return { filename, assetVariant, fileSizeBytes: file.size };
  });
};

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
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    const blobUrl = URL.createObjectURL(file);

    const result = await uploadFile(file).run();

    result.caseOf({
      Right: ({ filename, assetVariant, fileSizeBytes }) => {
        setBlocks((previousBlocks) => [
          ...previousBlocks,
          { variant: "asset", filename, assetVariant, fileSizeBytes },
        ]);
        setLocalPreviewsByFilename((prev) => ({ ...prev, [filename]: blobUrl }));
      },
      Left: (error) => {
        URL.revokeObjectURL(blobUrl);
        logger.error("Failed to upload asset", error);
      },
    });

    setIsUploading(false);
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
                    <div>
                      {block.assetVariant === "image" && (
                        <Image src={previewUrl} alt="" />
                      )}
                      {block.assetVariant === "audio" && (
                        <Audio src={previewUrl} />
                      )}
                      {block.assetVariant === "video" && (
                        <Video src={previewUrl} />
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
