import { type UUID } from "crypto";

export type Creator<T extends object> = Omit<
  T,
  "id" | "createdAtIso" | "updatedAtIso" | "user"
>;

export interface IMetadata {
  id: UUID;
  createdAtIso: string;
  updatedAtIso: string;
  user: { username: string };
}

export interface IChecklistMetadata extends IMetadata {
  name: string;
}

export interface IChecklistSection extends IMetadata {
  name: string;
  checklistId: UUID;
}

export interface IChecklistItem extends IMetadata {
  name: string;
  completed: boolean;
  note?: string;
  checklistId: UUID;
  checklistSectionId: UUID;
}

export interface IUser {
  username: string;
}

export type IKey = `user#${string}#${string}`;
