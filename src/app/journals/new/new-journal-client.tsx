"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JournalForm } from "../components/journal-form";
import { journalExistsAction } from "../actions/journal-exists.action";
import { CreatedAtLocal } from "../journal.types";

export const NewJournalClient: React.FC = () => {
  const router = useRouter();
  /**
   * Using unsafeDecode since the inputs are fully controlled
   */
  const todayLocal = CreatedAtLocal.unsafeDecode(new Date());

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
