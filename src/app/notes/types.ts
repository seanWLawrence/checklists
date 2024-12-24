import { Codec, GetType, intersect, string } from "purify-ts";

import { Metadata } from "@/lib/types";

export const NoteBase = Codec.interface({
  name: string,
  content: string,
});

export type NoteBase = GetType<typeof NoteBase>;

export const Note = intersect(Metadata, NoteBase);

export type Note = GetType<typeof Note>;
