"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { AssetList } from "@/components/asset-list";
import { AudioRecorderInput } from "@/components/audio-recorder-input";
import {
  JournalAsset,
  JournalAssetVariant,
} from "@/app/journals/journal.types";
import { logger } from "@/lib/logger";
import {
  AssetsPresignPutObjectBody,
  AssetsPresignPutObjectResponse,
} from "@/app/api/assets/presign/put/types";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Maybe } from "purify-ts/Maybe";

interface AssetItem extends JournalAsset {
  previewUrl: string;
}

const getVariant = (file: File): JournalAssetVariant | null => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return null;
};

export const AssetManager: React.FC<{
  name: string;
  initialAssets: AssetItem[];
  onTranscribeChange?: (asset: AssetItem, text: string) => void;
}> = ({ name, initialAssets, onTranscribeChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [transcribeStatusByFilename, setTranscribeStatusByFilename] =
    useState<Record<string, "idle" | "loading" | "done" | "error">>({});

  useEffect(() => {
    return () => {
      assets.forEach((asset) => {
        URL.revokeObjectURL(asset.previewUrl);
      });
    };
  }, [assets]);

  const serializedAssets = useMemo(() => {
    return JSON.stringify(
      assets.map((asset) => ({
        caption: asset.caption,
        filename: asset.filename,
        variant: asset.variant,
      })),
    );
  }, [assets]);

  const onAddFilesClick = () => {
    inputRef.current?.click();
  };

  const onRecordAudio = async (file: File | null) => {
    if (!file) {
      return;
    }

    const response = await uploadFile(file).run();
    if (response.isLeft()) {
      logger.error("Failed to upload recorded audio", response.extract());
    }
  };

  const uploadFile = (file: File): EitherAsync<unknown, void> => {
    return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
      const variant = await liftEither(
        Maybe.fromNullable(getVariant(file)).toEither(
          "Missing or invalid file type.",
        ),
      );

      const previewUrl = URL.createObjectURL(file);

      try {
        const body = await liftEither(
          AssetsPresignPutObjectBody.decode({
            filename: file.name,
            contentType: file.type,
            variant,
          }).map((body) => JSON.stringify(body)),
        );

        const presignPutResponse = await fetch("/api/assets/presign/put", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        });

        if (!presignPutResponse.ok) {
          logger.error(presignPutResponse);
          return throwE("Failed to fetch presigned URL");
        }

        const { uploadUrl, filename } = await fromPromise(
          EitherAsync(async ({ liftEither }) => {
            const json = await presignPutResponse.json();

            return liftEither(AssetsPresignPutObjectResponse.decode(json));
          }),
        );

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: file.type ? { "Content-Type": file.type } : undefined,
          body: file,
        });

        if (!uploadResponse.ok) {
          logger.error(uploadResponse);

          return throwE("Failed to upload asset.");
        }

        setAssets((current) => [
          ...current,
          {
            filename,
            variant,
            caption: file.name,
            previewUrl,
          },
        ]);
      } catch (error) {
        URL.revokeObjectURL(previewUrl);
        logger.error("Failed to upload assets", error);

        return throwE(error);
      }
    });
  };

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    const response = await EitherAsync.all(
      files.map((file) => uploadFile(file)),
    );

    if (response.isLeft()) {
      throw new Error(String(response.extract()));
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onRemoveClick = async (
    asset: Pick<AssetItem, "filename" | "previewUrl">,
  ) => {
    const response = await fetch(
      `/api/assets/${encodeURIComponent(asset.filename)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      logger.error("Failed to delete asset");
      return;
    }

    URL.revokeObjectURL(asset.previewUrl);
    setAssets((current) =>
      current.filter((item) => item.filename !== asset.filename),
    );
  };

  const onTranscribeClick = async (asset: AssetItem) => {
    setTranscribeStatusByFilename((current) => ({
      ...current,
      [asset.filename]: "loading",
    }));

    const response = await fetch(
      `/api/assets/${encodeURIComponent(asset.filename)}/transcriptions`,
      { method: "POST" },
    );

    if (!response.ok) {
      logger.error("Failed to transcribe asset", response);
      setTranscribeStatusByFilename((current) => ({
        ...current,
        [asset.filename]: "error",
      }));
      return;
    }

    const json = await response.json();
    if (typeof json?.text === "string") {
      onTranscribeChange?.(asset, json.text);
      setTranscribeStatusByFilename((current) => ({
        ...current,
        [asset.filename]: "done",
      }));
      return;
    }

    setTranscribeStatusByFilename((current) => ({
      ...current,
      [asset.filename]: "error",
    }));
  };

  const onCaptionChange = (asset: AssetItem, caption: string) => {
    setAssets((current) =>
      current.map((item) =>
        item.filename === asset.filename ? { ...item, caption } : item,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,audio/*"
        className="sr-only"
        onChange={onChange}
        multiple
      />

      <input type="hidden" name={name} value={serializedAssets} readOnly />

      <AssetList
        assets={assets}
        onRemoveClick={onRemoveClick}
        onCaptionChange={onCaptionChange}
        onTranscribeClick={onTranscribeClick}
        transcribeStatusByFilename={transcribeStatusByFilename}
      />

      <div className="flex justify-end items-center space-x-2">
        <Button type="button" variant="outline" onClick={onAddFilesClick}>
          Add files
        </Button>

        <AudioRecorderInput onChange={onRecordAudio} />
      </div>
    </div>
  );
};
