import { nanoid } from "nanoid";

export const getAssetPath = ({
  fileName,
  module,
}: {
  fileName: string;
  module: "journals";
}): string => {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop() : undefined;

  if (!ext) {
    throw new Error("File extension is missing");
  }

  return `${module}/${nanoid(12)}.${ext.toLowerCase()}`;
};
