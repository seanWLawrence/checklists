import { NewJournalRedirectEffect } from "./new-journal-redirect-effect";
import { JournalForm } from "../components/journal-form";

const NewJournal: React.FC = async () => {
  return (
    <>
      <NewJournalRedirectEffect />
      <JournalForm />
    </>
  );
};

export default NewJournal;
