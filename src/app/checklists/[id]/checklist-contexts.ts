import type {
  ChecklistContext,
  ChecklistV2StructuredItem,
} from "../checklist-v2.types";

/**
 * Matches one `@context` token at the start of a name or after whitespace.
 * The token must begin with an alphanumeric character and can then contain
 * alphanumerics, underscores, or hyphens. Requiring the leading boundary
 * avoids treating the `@` in an email address as a checklist context.
 */
const contextRegex = /(^|\s)@([a-z0-9][a-z0-9_-]*)\b/i;

export const getContextFromItemName = ({
  name,
}: {
  name: string;
}): ChecklistContext | undefined => {
  const context = name.match(contextRegex)?.[2];

  return context ? (`@${context.toLowerCase()}` as ChecklistContext) : undefined;
};

export const getItemNameWithoutContext = ({
  name,
}: {
  name: string;
}): string => {
  return name.replace(contextRegex, "$1").replace(/\s{2,}/g, " ").trim();
};

type ContextChecklistItem = ChecklistV2StructuredItem & {
  sectionName: string;
};

type ContextChecklistSection = {
  name: string;
  items: ContextChecklistItem[];
};

export const groupItemsByContext = ({
  sections,
}: {
  sections: { name: string; items: ChecklistV2StructuredItem[] }[];
}): ContextChecklistSection[] => {
  const groupedItems = new Map<string, ContextChecklistItem[]>();
  const noContextItems: ContextChecklistItem[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      const context = item.context;
      const contextItem = { ...item, sectionName: section.name };

      if (context) {
        groupedItems.set(context, [...(groupedItems.get(context) ?? []), contextItem]);
      } else {
        noContextItems.push(contextItem);
      }
    }
  }

  const contextSections = Array.from(groupedItems.entries()).map(([name, items]) => ({
    name,
    items,
  }));

  return noContextItems.length > 0
    ? [...contextSections, { name: "@none", items: noContextItems }]
    : contextSections;
};

export const groupNextActionsByContext = ({
  sections,
}: {
  sections: { name: string; items: ChecklistV2StructuredItem[] }[];
}): ContextChecklistSection[] => {
  const nextActionsByContext = new Map<string, ContextChecklistItem[]>();
  const noContextNextActions: ContextChecklistItem[] = [];

  for (const section of sections) {
    const contextsWithNextActions = new Set<string>();

    for (const item of section.items) {
      if (item.completed) {
        continue;
      }

      const contextName = item.context ?? "@none";
      if (contextsWithNextActions.has(contextName)) {
        continue;
      }

      contextsWithNextActions.add(contextName);
      const contextItem = { ...item, sectionName: section.name };

      if (item.context) {
        nextActionsByContext.set(item.context, [
          ...(nextActionsByContext.get(item.context) ?? []),
          contextItem,
        ]);
      } else {
        noContextNextActions.push(contextItem);
      }
    }
  }

  const contextSections = Array.from(nextActionsByContext.entries()).map(
    ([name, items]) => ({ name, items }),
  );

  return noContextNextActions.length > 0
    ? [...contextSections, { name: "@none", items: noContextNextActions }]
    : contextSections;
};
