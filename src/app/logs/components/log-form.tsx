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
import { Block, BlockVariant, Log, LogSection } from "../log.types";
import { LogMediaAssetInput } from "./log-media-asset-input";

const BLOCK_BUTTONS: {
  label: string;
  variant: BlockVariant;
}[] = [
  { label: "Short", variant: "shortText" },
  { label: "Long", variant: "longText" },
  { label: "Checkbox", variant: "checkbox" },
  { label: "Number", variant: "number" },
  { label: "Audio", variant: "audio" },
  { label: "Image", variant: "image" },
  { label: "Video", variant: "video" },
];

const isMediaVariant = (
  variant: BlockVariant,
): variant is "audio" | "image" | "video" => {
  return variant === "audio" || variant === "image" || variant === "video";
};

const isMediaBlock = (
  block: Block,
): block is Extract<Block, { variant: "audio" | "image" | "video" }> => {
  return isMediaVariant(block.variant);
};

const createDefaultBlock = ({ variant }: { variant: BlockVariant }): Block => {
  if (variant === "checkbox") {
    return { name: "", variant, value: false };
  }

  if (variant === "number") {
    return { name: "", variant, value: 0 };
  }

  return { name: "", variant, value: "" };
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
  const [openFilePickerSignalByBlockKey, setOpenFilePickerSignalByBlockKey] =
    useState<Record<string, number>>({});

  const sectionsJson = useMemo(() => JSON.stringify(sections), [sections]);

  const updateBlockValue = ({
    sectionIndex,
    blockIndex,
    value,
  }: {
    sectionIndex: number;
    blockIndex: number;
    value: string | number | boolean;
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

            if (block.variant === "checkbox") {
              return { ...block, value: Boolean(value) };
            }

            if (block.variant === "number") {
              return { ...block, value: Number(value) };
            }

            return { ...block, value: String(value) };
          }),
        };
      }),
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
  }: {
    sectionIndex: number;
    variant: BlockVariant;
  }) => {
    const blockName = window.prompt("Block label?");
    const trimmedBlockName = blockName?.trim();

    if (!trimmedBlockName) {
      return;
    }

    let newBlockIndex = -1;

    setSections((previousSections) =>
      previousSections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        newBlockIndex = section.blocks.length;

        return {
          ...section,
          blocks: [
            ...section.blocks,
            { ...createDefaultBlock({ variant }), name: trimmedBlockName },
          ],
        };
      }),
    );

    if (isMediaVariant(variant)) {
      const blockKey = `${sectionIndex}-${newBlockIndex}`;
      setOpenFilePickerSignalByBlockKey((current) => ({
        ...current,
        [blockKey]: (current[blockKey] ?? 0) + 1,
      }));
    }
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
                    const name = Maybe.fromNullable(
                      window.prompt("New name?"),
                    )
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

      <form action={isEdit ? updateLogAction : createLogAction} className="space-y-3">
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
            legend={section.name}
            className="space-y-4"
          >
            <div className="space-y-2">
              {section.blocks.map((block, blockIndex) => (
                <div
                  key={`${sectionIndex}-${blockIndex}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <Label label={block.name} className="w-auto min-w-0" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => removeBlock({ sectionIndex, blockIndex })}
                    >
                      Remove
                    </Button>
                  </div>

                  {block.variant === "checkbox" && (
                    <label className="flex w-full items-center gap-2 rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(block.value)}
                        onChange={(event) =>
                          updateBlockValue({
                            sectionIndex,
                            blockIndex,
                            value: event.target.checked,
                          })
                        }
                        className="accent-blue-500"
                      />
                      <span>Checked</span>
                    </label>
                  )}

                  {block.variant === "number" && (
                    <Input
                      type="number"
                      className="w-full max-w-none"
                      value={String(block.value)}
                      onChange={(event) =>
                        updateBlockValue({
                          sectionIndex,
                          blockIndex,
                          value: Number(event.target.value || "0"),
                        })
                      }
                    />
                  )}

                  {block.variant === "shortText" && (
                    <Input
                      className="w-full max-w-none"
                      value={String(block.value)}
                      onChange={(event) =>
                        updateBlockValue({
                          sectionIndex,
                          blockIndex,
                          value: event.target.value,
                        })
                      }
                    />
                  )}

                  {block.variant === "longText" && (
                    <Textarea
                      className="w-full max-w-none"
                      value={String(block.value)}
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

                  {isMediaBlock(block) && (
                    (() => {
                      const previewUrl =
                        initialMediaPreviewUrlsByBlockKey[
                          `${sectionIndex}-${blockIndex}`
                        ];
                      const initialUploadedAssets: AssetItemWithPreview[] =
                        block.value.trim() !== "" && previewUrl
                          ? [
                              {
                                caption: block.name,
                                filename: block.value,
                                variant: block.variant,
                                previewUrl,
                              },
                            ]
                          : [];

                      return (
                        <LogMediaAssetInput
                          variant={block.variant}
                          initialUploadedAssets={initialUploadedAssets}
                          openFilePickerSignal={
                            openFilePickerSignalByBlockKey[
                              `${sectionIndex}-${blockIndex}`
                            ]
                          }
                          onFilenameChangeAction={(filename) =>
                            updateBlockValue({
                              sectionIndex,
                              blockIndex,
                              value: filename,
                            })
                          }
                        />
                      );
                    })()
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 items-center text-xs">
              <span>Add block:</span>

              {BLOCK_BUTTONS.map(({ label, variant }, index) => (
                <div
                  key={`${sectionIndex}-${variant}`}
                  className="flex items-center space-x-1"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs py-1 px-2"
                    onClick={() => addBlock({ sectionIndex, variant })}
                  >
                    {label}
                  </Button>
                  {index < BLOCK_BUTTONS.length - 1 && <span>|</span>}
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
