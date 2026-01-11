"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JournalForm } from "../components/journal-form";
import { journalExistsAction } from "../actions/journal-exists.action";
import { CreatedAtLocal } from "../journal.types";

export const NewJournalClient: React.FC = () => {
  const router = useRouter();
  const todayLocal = CreatedAtLocal.decode(new Date());

  useEffect(() => {
    let isMounted = false;

    if (todayLocal.isRight()) {
      isMounted = true;

      journalExistsAction(todayLocal.extract()).then((exists) => {
        if (isMounted && exists) {
          router.replace(`/journals/${todayLocal.extract()}/edit`);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [router, todayLocal]);

  return <JournalForm />;
};
