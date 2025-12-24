"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JournalForm } from "../components/journal-form";
import { getTodayLocal } from "../lib/get-today-local.lib";
import { journalExistsAction } from "../actions/journal-exists.action";

export const NewJournalClient: React.FC = () => {
  const router = useRouter();
  const todayLocal = getTodayLocal();

  useEffect(() => {
    let isMounted = true;

    journalExistsAction(todayLocal).then((exists) => {
      if (isMounted && exists) {
        router.replace(`/journals/${todayLocal}/edit`);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router, todayLocal]);

  return <JournalForm />;
};
