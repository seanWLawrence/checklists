import { EitherAsync } from "purify-ts/EitherAsync";

import { JournalForm } from "../../components/journal-form";
import { CreatedAtLocal } from "../../journal.types";
import { getJournal } from "../../model/get-journal.model";
import { getJournalImageUrl } from "../../lib/get-journal-image-url.lib";

type Params = Promise<{ createdAtLocal: string }>;

const EditJournal: React.FC<{ params: Params }> = async (props) => {
  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const params = await props.params;

    const createdAtLocal = await liftEither(
      CreatedAtLocal.decode(params.createdAtLocal),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));
    const imageUrlMaybe = await getJournalImageUrl({ createdAtLocal });

    return <JournalForm journal={journal} imageUrl={imageUrlMaybe.extract()} />;
  })
    .mapLeft((e) => {
      return <p>{String(e)}</p>;
    })
    .run();

  return page.extract();
};

export default EditJournal;
