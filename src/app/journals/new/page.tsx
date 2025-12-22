import { JournalForm } from "../components/journal-form";
import { redirect } from "next/navigation";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getSingleItem } from "@/lib/db/get-single-item";
import { getJournalKey } from "../model/get-journal.model";
import { Journal } from "../journal.types";
import { getTodayLocal } from "../lib/get-today-local";
import { EitherAsync } from "purify-ts/EitherAsync";

const NewJournal: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const createdAtLocal = getTodayLocal();

    const user = await fromPromise(validateUserLoggedIn({}));

    await fromPromise(
      getSingleItem({
        key: getJournalKey({ user, createdAtLocal }),
        decoder: Journal,
      }),
    );

    return createdAtLocal;
  }).run();

  if (page.isRight()) {
    return redirect(`/journals/${page.extract()}/edit`);
  }

  return <JournalForm />;
};

export default NewJournal;
