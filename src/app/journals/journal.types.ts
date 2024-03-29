import { Codec, string, GetType, intersect } from "purify-ts/Codec";
import { Metadata } from "@/lib/types";

export const JournalBase = Codec.interface({
  content: string,
});

export type JournalBase = GetType<typeof JournalBase>;

export const Journal = intersect(Metadata, JournalBase);

export type Journal = GetType<typeof Journal>;
