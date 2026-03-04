"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { CreatedAtLocal } from "@/app/journals/journal.types";
import { journalExistsAction } from "@/app/journals/actions/journal-exists.action";
import { LinkButton } from "./link-button";

type TodayJournalLinkState = {
  exists: boolean;
  href: string;
};

const DEFAULT_STATE: TodayJournalLinkState = {
  exists: false,
  href: "/journals/new",
};

export const TodayJournalLink: React.FC = () => {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [linkState, setLinkState] =
    useState<TodayJournalLinkState>(DEFAULT_STATE);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const todayLocal = CreatedAtLocal.decode(new Date());

    if (todayLocal.isLeft()) {
      return;
    }

    let isActive = true;
    const createdAtLocal = todayLocal.extract();

    journalExistsAction(createdAtLocal).then((exists) => {
      if (!isActive) {
        return;
      }

      setLinkState(
        exists
          ? { exists, href: `/journals/${createdAtLocal}/edit` }
          : DEFAULT_STATE,
      );
    });

    return () => {
      isActive = false;
    };
  }, [isHydrated]);

  return (
    <LinkButton href={linkState.href} variant="ghost" prefetch={true}>
      Today
    </LinkButton>
  );
};
