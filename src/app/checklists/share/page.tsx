import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { ChecklistV2TaskForm } from "../[id]/checklist-v2-task-form";
import { structureChecklistContent } from "../[id]/structure-checklist-content";
import { getChecklistV2ByShareToken } from "../model/get-checklist-v2-by-share-token.model";

export const dynamic = "force-dynamic";

const SharedChecklistPage: React.FC<{
  searchParams?: Promise<{ token?: string }>;
}> = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";

  const page = await EitherAsync(async ({ fromPromise, throwE }) => {
    if (!token) {
      return throwE("Missing share token");
    }

    const checklist = await fromPromise(getChecklistV2ByShareToken({ token }));
    const structured = structureChecklistContent(checklist.content);

    const structuredChecklist = {
      ...structured,
      id: checklist.id,
      name: checklist.name,
      updatedAtIso: checklist.updatedAtIso,
    };

    return (
      <main>
        <section className="space-y-3">
          <ChecklistV2TaskForm
            structuredChecklist={structuredChecklist}
            shareAccess={{ token }}
          />
        </section>
      </main>
    );
  })
    .mapLeft((error) => {
      return (
        <main>
          <section className="space-y-2">
            <Heading level={1}>Shared checklist</Heading>
            <p className="text-sm text-zinc-700">Unable to load checklist.</p>
            <pre className="text-xs text-red-800">{String(error)}</pre>
          </section>
        </main>
      );
    })
    .run();

  return page.extract();
};

export default SharedChecklistPage;
