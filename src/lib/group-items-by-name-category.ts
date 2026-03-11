export const groupItemsByNameCategory = <T extends { name: string }>({
  items,
}: {
  items: T[];
}): { category: string; items: T[] }[] => {
  const uncategorized: T[] = [];
  const categorizedItems: Record<string, T[]> = {};

  for (const item of items) {
    const nameSplit = item.name.trim().split("/");

    if (nameSplit.length === 1) {
      uncategorized.push(item);
      continue;
    }

    const [category, ...nameParts] = nameSplit;
    const name = nameParts.join("/").trim();

    if (!categorizedItems[category]) {
      categorizedItems[category] = [];
    }

    categorizedItems[category].push({
      ...item,
      name,
    });
  }

  if (uncategorized.length > 0) {
    categorizedItems.Other = [...uncategorized].sort((itemA, itemB) =>
      itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase()),
    );
  }

  return Object.entries(categorizedItems)
    .map(([category, groupedItems]) => ({
      category,
      items: [...groupedItems].sort((itemA, itemB) =>
        itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase()),
      ),
    }))
    .sort((groupA, groupB) =>
      groupA.category.toLowerCase().localeCompare(groupB.category.toLowerCase()),
    );
};
