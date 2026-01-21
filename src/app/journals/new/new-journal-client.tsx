"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JournalForm } from "../components/journal-form";
import { journalExistsAction } from "../actions/journal-exists.action";
import { CreatedAtLocal } from "../journal.types";
import { Maybe } from "purify-ts/Maybe";

export const NewJournalClient: React.FC = () => {
  const router = useRouter();
  const todayLocal = CreatedAtLocal.decode(new Date());

  useEffect(() => {
    let isMounted = false;

    if (todayLocal.isRight()) {
      isMounted = true;

      journalExistsAction(todayLocal.extract()).then((exists) => {
        if (isMounted && exists) {
          Maybe.fromFalsy(
            window.confirm("Journal exists for today. Want to edit it?"),
          ).ifJust(() => {
            router.replace(`/journals/${todayLocal.extract()}/edit`);
          });
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [router, todayLocal]);

  return <JournalForm />;
};
