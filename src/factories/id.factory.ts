import { type UUID } from "crypto";

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

export const id = (): UUID => {
  if (isNode) {
    return require("crypto").randomUUID();
  }

  return window.crypto.randomUUID() as UUID;
};
