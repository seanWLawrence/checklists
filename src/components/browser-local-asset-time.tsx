"use client";

import { useSyncExternalStore } from "react";

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
}> = ({ lastModifiedIso }) => {
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
      </div>
    );
  }

  return (
    <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
      <p>Uploaded: {formatLocalTimestamp(date)}</p>
      <p>Suggested journal date: {getCreatedAtLocal(date)}</p>
    </div>
  );
};
