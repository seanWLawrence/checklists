"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { AssetItemWithPreview } from "@/components/assets/asset.types";
import { Fieldset } from "@/components/fieldset";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { MenuButton } from "@/components/menu-button";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/textarea";
import { Maybe } from "purify-ts/Maybe";
import { createLogAction } from "../actions/create-log.action";
import { updateLogAction } from "../actions/update-log.action";
import {
  AssetVariant,
  Block,
  BlockVariant,
  Log,
  LogSection,
} from "../log.types";
import { LogMediaAssetInput } from "./log-media-asset-input";

const BLOCK_BUTTONS: {
  label: string;
  variant: BlockVariant;
  assetVariant?: AssetVariant;
}[] = [
  { label: "Short", variant: "shortMarkdown" },
  { label: "Long", variant: "longMarkdown" },
  { label: "Audio", variant: "asset", assetVariant: "audio" },
  { label: "Image", variant: "asset", assetVariant: "image" },
  { label: "Video", variant: "asset", assetVariant: "video" },
];

const createDefaultBlock = ({
  variant,
  assetVariant,
}: {
  variant: BlockVariant;
  assetVariant?: AssetVariant;
}): Block => {
  if (variant === "asset") {
    return { variant, assetVariant: assetVariant ?? "image", filename: "" };
  }

  return { variant, value: "" };
};

const createEmptySection = ({ index }: { index: number }): LogSection => {
  return {
    name: `Section ${index + 1}`,
    blocks: [],
  };
};

export const LogForm: React.FC<{
  log?: Log;
  initialMediaPreviewUrlsByBlockKey?: Record<string, string>;
}> = ({ log, initialMediaPreviewUrlsByBlockKey = {} }) => {
  const isEdit = Boolean(log);
  const [sections, setSections] = useState<LogSection[]>(log?.sections ?? []);

  const sectionsJson = useMemo(() => JSON.stringify(sections), [sections]);

  const updateBlockValue = ({
    sectionIndex,
    blockIndex,
    value,
  }: {
    sectionIndex: number;
    blockIndex: number;
    value: string;
  }) => {
    setSections((previousSections) =>
      previousSections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          blocks: section.blocks.map((block, currentBlockIndex) => {
            if (currentBlockIndex !== blockIndex) {
              return block;
            }

            return { ...block, value };
          }),
        };
      }),
    );
  };

  const updateAssetBlockFilename = ({
    sectionIndex,
    blockIndex,
    filename,
  }: {
    sectionIndex: number;
    blockIndex: number;
    filename: string;
  }) => {
    setSections((previousSections) =>
      previousSections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          blocks: section.blocks.map((block, currentBlockIndex) => {
            if (
              currentBlockIndex !== blockIndex ||
              block.variant !== "asset"
            ) {
              return block;
            }

            return { ...block, filename };
          }),
        };
      }),
    );
  };

  const removeSection = ({ sectionIndex }: { sectionIndex: number }) => {
    setSections((previousSections) =>
      previousSections.filter((_, index) => index !== sectionIndex),
    );
  };

  const addSection = () => {
    const sectionName = window.prompt("Section name?");
    const trimmedSectionName = sectionName?.trim();

    if (!trimmedSectionName) {
      return;
    }

    setSections((previousSections) => [
      ...previousSections,
      {
        ...createEmptySection({ index: previousSections.length }),
        name: trimmedSectionName,
      },
    ]);
  };

  const addBlock = ({
    sectionIndex,
    variant,
    assetVariant,
  }: {
    sectionIndex: number;
    variant: BlockVariant;
    assetVariant?: AssetVariant;
  }) => {
    setSections((previousSections) =>
      previousSections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          blocks: [
            ...section.blocks,
            createDefaultBlock({ variant, assetVariant }),
          ],
        };
      }),
    );
  };

  const removeBlock = ({
    sectionIndex,
    blockIndex,
  }: {
    sectionIndex: number;
    blockIndex: number;
  }) => {
    setSections((previousSections) =>
      previousSections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          blocks: section.blocks.filter(
            (_, currentBlockIndex) => currentBlockIndex !== blockIndex,
          ),
        };
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

                    const sections = Maybe.fromNullable(sectionsJson);

                    Maybe.sequence([name, sections]).map(
                      async ([nextName, nextSections]) => {
                        const formData = new FormData();

                        formData.set("name", nextName);
                        formData.set("sections", nextSections);
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

        {sections.map((section, sectionIndex) => (
          <Fieldset
            key={sectionIndex}
            legend={
              <span className="flex items-center justify-between gap-.5 w-full">
                <span>{section.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs font-normal underline"
                  onClick={() => removeSection({ sectionIndex })}
                >
                  Remove
                </Button>
              </span>
            }
            className="space-y-4"
          >
            {section.blocks.length > 0 ? (
              <div className="space-y-2">
                {section.blocks.map((block, blockIndex) => (
                  <div
                    key={`${sectionIndex}-${blockIndex}`}
                    className="space-y-0.5"
                  >
                    <div className="flex items-center justify-end gap-2 text-xs text-zinc-900 dark:text-zinc-100">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs"
                        onClick={() =>
                          removeBlock({ sectionIndex, blockIndex })
                        }
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
                            sectionIndex,
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
                            sectionIndex,
                            blockIndex,
                            value: event.target.value,
                          })
                        }
                      />
                    )}

                    {block.variant === "asset" &&
                      (() => {
                        const previewUrl =
                          initialMediaPreviewUrlsByBlockKey[
                            `${sectionIndex}-${blockIndex}`
                          ];
                        const initialUploadedAssets: AssetItemWithPreview[] =
                          block.filename.trim() !== "" && previewUrl
                            ? [
                                {
                                  caption: "",
                                  filename: block.filename,
                                  variant: block.assetVariant,
                                  previewUrl,
                                },
                              ]
                            : [];

                        return (
                          <LogMediaAssetInput
                            variant={block.assetVariant}
                            initialUploadedAssets={initialUploadedAssets}
                            label=""
                            onFilenameChangeAction={(filename) =>
                              updateAssetBlockFilename({
                                sectionIndex,
                                blockIndex,
                                filename,
                              })
                            }
                          />
                        );
                      })()}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 items-center text-xs">
              {BLOCK_BUTTONS.map(({ label, variant, assetVariant }) => (
                <div
                  key={`${sectionIndex}-${variant}-${assetVariant ?? ""}`}
                  className="flex items-center space-x-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs py-1 px-2"
                    onClick={() =>
                      addBlock({ sectionIndex, variant, assetVariant })
                    }
                  >
                    {label}
                  </Button>
                </div>
              ))}
            </div>
          </Fieldset>
        ))}

        {sections.length === 0 && (
          <p className="text-sm text-zinc-600">
            No sections yet. Add one below.
          </p>
        )}

        <input type="hidden" name="sections" value={sectionsJson} readOnly />

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={addSection}>
            Add section
          </Button>

          <SubmitButton type="submit" variant="primary">
            Save
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
