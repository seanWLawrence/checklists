import { Block } from "../log.types";

export const moveBlock = ({
  blocks,
  fromIndex,
  toIndex,
}: {
  blocks: Block[];
  fromIndex: number;
  toIndex: number;
}): Block[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= blocks.length ||
    toIndex >= blocks.length
  ) {
    return blocks;
  }

  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);

  if (!movedBlock) return blocks;

  nextBlocks.splice(toIndex, 0, movedBlock);

  return nextBlocks;
};
