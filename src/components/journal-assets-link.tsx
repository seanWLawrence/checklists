"use client";

import { useSyncExternalStore } from "react";
import { LinkButton } from "./link-button";

const formatCreatedAtLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultSinceRange = (): string => {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  return `${formatCreatedAtLocal(oneMonthAgo)}to${formatCreatedAtLocal(now)}`;
};

export const JournalAssetsLink: React.FC<{ className?: string }> = ({
  className,
}) => {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isClient) {
    return (
      <span className={className} aria-hidden="true">
        Assets
      </span>
    );
  }

  const since = getDefaultSinceRange();

  return (
    <LinkButton
      href={`/journals/assets/${since}`}
      variant="ghost"
      className={className}
      prefetch={true}
    >
      Assets
    </LinkButton>
  );
};
