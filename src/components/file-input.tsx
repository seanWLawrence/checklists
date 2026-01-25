"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { AudioRecorderInput } from "./audio-recorder-input";
import { Label } from "./label";
import { Input } from "./input";
import { nanoid } from "nanoid";
import { MAX_AUDIO_SIZE_MB, MAX_IMAGE_SIZE_MB } from "@/lib/upload.constants";
import { Audio } from "./audio";
import { Image } from "./image";

type Variant = "image" | "audio";

const formatFileSize = (fileSize: number): string => {
  const sizeMb = fileSize / (1024 * 1024);

  return sizeMb.toFixed(1);
};

interface FileInputFile {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

export const FileInput: React.FC<{
  name: string;
  variant: Variant;
  empty: React.ReactNode;
}> = ({ name, variant, empty }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileInputFile[]>([]);

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, [files]);

  const onRemoveClick = (fileId: string): void => {
    const updatedFiles: FileInputFile[] = [];
    const dataTransfer = new DataTransfer();

    for (const file of files) {
      if (file.id === fileId) {
        URL.revokeObjectURL(file.previewUrl);
        continue;
      }

      updatedFiles.push(file);
      dataTransfer.items.add(file.file);
    }

    setFiles(updatedFiles);

    if (!inputRef.current) {
      return;
    }

    inputRef.current.files = dataTransfer.files;
  };

  const onChange = (
    target:
      | Pick<React.ChangeEvent<HTMLInputElement>["target"], "files">
      | { files: File[] },
  ) => {
    setFiles((files) => [
      ...files,
      ...Array.from(target.files ?? []).map((file) => {
        return {
          id: nanoid(12),
          file,
          previewUrl: URL.createObjectURL(file),
          caption: "",
        };
      }),
    ]);
  };

  const onAddFilesClick = () => {
    inputRef.current?.click();
  };

  const accept = variant === "image" ? "image/*" : "audio/*";

  const maxFileSizeMb =
    variant === "image" ? MAX_IMAGE_SIZE_MB : MAX_AUDIO_SIZE_MB;

  const lastIndex = files.length - 1;

  return (
    <div className="space-y-4">
      {!files.length && empty}

      {files.map(({ id, file, previewUrl, caption }, index) => {
        return (
          <div className="space-y-1.5" key={id}>
            <div className="flex space-x-1 items-center justify-between w-full">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {file.name} ({formatFileSize(file.size)}/{maxFileSizeMb}mb)
              </div>

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onRemoveClick(id)}
                  className="text-xs text-zinc-500 dark:text-zinc-300"
                >
                  Remove
                </Button>
              </div>
            </div>

            {variant === "image" && (
              <Image src={previewUrl} alt={file?.name ?? "file preview"} />
            )}

            {variant === "audio" && <Audio src={previewUrl} />}

            <Label label={"Caption"}>
              <Input
                type="text"
                name={`${name}_caption_${index}`}
                defaultValue={caption}
                className="w-full max-w-full"
              />
            </Label>

            {variant === "audio" && (
              <Label
                label="Transcribe"
                className="w-min flex flex-row-reverse items-center"
              >
                <input
                  className="mr-1 transform-[translateY(-2px)] h-4 w-4 not-checked:appearance-none border-2 border-zinc-700 rounded-sm accent-blue-500"
                  type="checkbox"
                  name={`${name}_shouldTranscribe_${index}`}
                />
              </Label>
            )}

            {index !== lastIndex && (
              <div className="mt-6">
                <hr className="dark:border-zinc-700" />
              </div>
            )}
          </div>
        );
      })}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target)}
        multiple
      />

      <div className="flex justify-end space-x-2 items-center">
        <Button type="button" variant="outline" onClick={onAddFilesClick}>
          Add files
        </Button>

        {variant === "audio" && (
          <div className="flex items-center space-x-2">
            <span>or</span>

            <AudioRecorderInput
              onChange={(file) => {
                if (file) {
                  if (inputRef.current) {
                    const dataTransfer = new DataTransfer();

                    for (const file of files) {
                      dataTransfer.items.add(file.file);
                    }

                    dataTransfer.items.add(file);
                    inputRef.current.files = dataTransfer.files;

                    onChange({ files: [file] });
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
