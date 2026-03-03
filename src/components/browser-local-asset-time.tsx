"use client";

import { useSyncExternalStore } from "react";
import { Input } from "./input";
import { Label } from "./label";

const getCreatedAtLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatLocalTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const BrowserLocalAssetTime: React.FC<{
  lastModifiedIso: string;
  inputName?: string;
}> = ({ lastModifiedIso, inputName }) => {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const date = new Date(lastModifiedIso);

  if (!isHydrated || Number.isNaN(date.getTime())) {
    return (
      <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <p>Uploaded: {lastModifiedIso}</p>
        <p>Suggested journal date: unavailable</p>
        {inputName ? (
          <Label label="Attach to journal date">
            <Input type="date" name={inputName} required={true} />
          </Label>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
      <p>Uploaded: {formatLocalTimestamp(date)}</p>
      <p>Suggested journal date: {getCreatedAtLocal(date)}</p>
      {inputName ? (
        <Label label="Attach to journal date">
          <Input
            key="suggested-date"
            type="date"
            name={inputName}
            defaultValue={getCreatedAtLocal(date)}
            required={true}
          />
        </Label>
      ) : null}
    </div>
  );
};
