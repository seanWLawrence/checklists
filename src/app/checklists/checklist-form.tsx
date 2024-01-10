import { useMemo } from "react";

import type {
  IChecklist,
  IChecklistItem,
  IChecklistSection,
} from "@/lib/types";
import { Button } from "@/components/button";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { X } from "@/components/x";
import { createChecklist, deleteChecklistById } from "./checklist.model";

export const ChecklistForm: React.FC<{
  checklist: Omit<IChecklist, "sections">;
  sections: { [checklistId: string]: Omit<IChecklistSection, "items"> };
  items: { [itemId: string]: IChecklistItem };
  onCreateSection: () => void;
  onUpdateSection: (params: { id: string; name: string }) => void;
  onDeleteSection: (params: { id: string }) => void;
  onCreateItem: (params: { sectionId: string }) => void;
  onUpdateItem: (params: { id: string; name: string }) => void;
  onDeleteItem: (params: { id: string }) => void;
  onUpdateChecklist: (params: { name: string }) => void;
}> = ({
  checklist,
  sections,
  items,
  onCreateSection,
  onCreateItem,
  onUpdateSection,
  onUpdateItem,
  onDeleteSection,
  onDeleteItem,
  onUpdateChecklist,
}) => {
  const itemsBySectionId = useMemo(() => {
    const bySectionId: Record<string /* sectionId */, IChecklistItem[]> = {};

    Object.values(items).forEach((item) => {
      const existingItems = bySectionId[item.checklistSectionId];

      bySectionId[item.checklistSectionId] = [...(existingItems || []), item];
    });

    return bySectionId;
  }, [items]);

  const sectionsArray = Object.values(sections);

  return (
    <form
      className="space-y-4"
      action={() => {
        createChecklist({
          ...checklist,
          sections: Object.values(sections).map((section) => {
            return {
              ...section,
              items: Object.values(itemsBySectionId[section.id]),
            };
          }),
        });
      }}
    >
      <div className="flex space-x-1">
        <h1 className="text-3xl">Checklist</h1>

        <Button
          type="button"
          onClick={() => {
            deleteChecklistById(checklist.id);
          }}
        >
          <X />
        </Button>
      </div>

      <Label label="Checklist name">
        <Input
          required
          type="text"
          value={checklist.name}
          onChange={(e) => {
            onUpdateChecklist({ name: e.target.value });
          }}
        />
      </Label>

      {!sectionsArray.length && (
        <p className="text-zinc-700 text-xs">(No sections)</p>
      )}

      {sectionsArray.map((section) => {
        return (
          <fieldset
            key={section.id}
            className="space-y-1 border-2 border-zinc-700 px-5 py-2 rounded-lg w-full min-w-48"
          >
            <legend className="text-2xl">
              Section: {section.name || "(blank)"}{" "}
              <Button
                type="button"
                aria-label="Delete section"
                onClick={() => onDeleteSection({ id: section.id })}
              >
                <X />
              </Button>
            </legend>

            <Label label="Section name">
              <Input
                required
                type="text"
                value={section.name}
                onChange={(e) => {
                  onUpdateSection({
                    id: section.id,
                    name: e.target.value,
                  });
                }}
              />
            </Label>

            <div>
              <div className="space-y-4 ml-4">
                <div className="space-y-2">
                  <h3>Items</h3>

                  {!itemsBySectionId[section.id]?.length && (
                    <p className="text-zinc-700 text-xs">(No items)</p>
                  )}

                  {itemsBySectionId[section.id]?.map((item) => {
                    return (
                      <div
                        className="flex space-x-2 items-end max-w-prose w-full"
                        key={item.id}
                      >
                        <Label label="Name">
                          <Input
                            required
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              onUpdateItem({
                                id: item.id,
                                name: e.target.value,
                              });
                            }}
                          />
                        </Label>

                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              onDeleteItem({ id: item.id });
                            }}
                            aria-label="Delete item"
                          >
                            <X />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end w-full">
                  <Button
                    onClick={() => {
                      onCreateItem({ sectionId: section.id });
                    }}
                    type="button"
                    variant="outline"
                  >
                    Create item
                  </Button>
                </div>
              </div>
            </div>
          </fieldset>
        );
      })}

      <div className="w-full flex justify-between">
        <Button type="button" onClick={onCreateSection}>
          Create section
        </Button>

        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
};
