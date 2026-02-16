import { EitherAsync } from "purify-ts/EitherAsync";
import { redirect } from "next/navigation";

import { Heading } from "@/components/heading";
import { CreatedAtLocal } from "./journal.types";
import { SubmitButton } from "@/components/submit-button";
import { LinkButton } from "@/components/link-button";
import { groupCreatedAtLocals } from "./lib/group-created-at-locals.lib";
import { prettyDate } from "./lib/pretty-date.lib";
import { parseSinceYear } from "./lib/parse-since-year.lib";
import { getCreatedAtLocalsForYear } from "./model/get-created-at-locals-for-year.model";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { JournalsYearRedirect } from "./components/journals-year-redirect";
import { JournalSearchResults } from "./components/journal-search-results";
import { searchJournalsSemantic } from "./lib/search-journals-semantic.lib";

export const dynamic = "force-dynamic";

const Journals: React.FC<{
  searchParams?: Promise<{ sinceYear?: string; q?: string }>;
}> = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const rawSinceYear = resolvedSearchParams?.sinceYear;
  const q =
    typeof resolvedSearchParams?.q === "string"
      ? resolvedSearchParams.q.trim()
      : "";

  const page = await EitherAsync(async ({ fromPromise }) => {
    const sinceYear =
      rawSinceYear && rawSinceYear.trim() !== ""
        ? parseSinceYear(rawSinceYear).orDefault(rawSinceYear)
        : undefined;

    const createdAtLocals = sinceYear
      ? await fromPromise(getCreatedAtLocalsForYear({ year: sinceYear }))
      : [];

    const groupedJournals = sinceYear
      ? Object.entries(groupCreatedAtLocals(createdAtLocals))
      : [];

    const matches =
      q.length > 0
        ? await fromPromise(
            searchJournalsSemantic({
              query: q,
              sinceYear,
            }),
          )
        : [];

    return (
      <main className="space-y-4">
        <Heading level={1}>Journals</Heading>

        <form
          className="space-y-2"
          action={async (formData) => {
            "use server";
            const searchText = formData.get("q");
            const trimmedSearchText =
              typeof searchText === "string" ? searchText.trim() : "";
            const sinceYear = formData.get("sinceYear");
            const trimmedSinceYear =
              typeof sinceYear === "string" ? sinceYear.trim() : "";
            const params = new URLSearchParams();

            if (trimmedSinceYear !== "") {
              params.set("sinceYear", trimmedSinceYear);
            }

            if (trimmedSearchText !== "") {
              params.set("q", trimmedSearchText);
            }

            redirect(`/journals${params.size > 0 ? `?${params.toString()}` : ""}`);
          }}
        >
          <Label label="Search text">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by meaning, e.g. stressful week at work"
              autoComplete="off"
            />
          </Label>

          <div className="flex max-w-fit items-end space-x-2">
            <Label label={"Year (YYYY)"}>
              <Input
                name="sinceYear"
                defaultValue={sinceYear ?? ""}
                pattern="\d{4}"
                className="min-w-28"
              />
            </Label>

            <SubmitButton variant="primary">Apply</SubmitButton>
          </div>
        </form>

        <JournalSearchResults q={q} sinceYear={sinceYear} matches={matches} />

        {!sinceYear && <JournalsYearRedirect />}

        {sinceYear && (
          <div className="space-y-1">
            {groupedJournals.map(([year, monthMap]) => {
              const groupedMonths = Object.entries(monthMap);
              const lastMonthIndex = groupedMonths.length - 1;
              const hasMoreThanOneMonth = groupedMonths.length > 1;

              return (
                <section key={year} className="space-y-4">
                  <Heading level={2}>{year}</Heading>

                  <div className="space-y-1">
                    {groupedMonths.map(([month, createdAtLocals], index) => {
                      return (
                        <div key={month}>
                          <div className="flex flex-wrap">
                            {[...(createdAtLocals as CreatedAtLocal[])]
                              .sort(
                                (createdAtLocalA, createdAtLocalB) =>
                                  new Date(createdAtLocalA).getTime() -
                                  new Date(createdAtLocalB).getTime(),
                              )
                              .map((createdAtLocal) => (
                                <LinkButton
                                  href={`/journals/${createdAtLocal}`}
                                  key={createdAtLocal}
                                  variant="outline"
                                  className="mr-2 mb-2"
                                >
                                  {prettyDate(createdAtLocal, {
                                    withYear: false,
                                  })}
                                </LinkButton>
                              ))}
                          </div>

                          {hasMoreThanOneMonth && index < lastMonthIndex && (
                            <hr className="border-t-2 border-t-zinc-300 mt-2 mb-4 max-w-10" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {sinceYear && createdAtLocals.length === 0 && <p>No journals found.</p>}
      </main>
    );
  }).mapLeft((error) => {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-600">No journals found.</p>
        <pre className="text-xs text-red-800">{String(error)}</pre>
      </div>
    );
  });

  return page.extract();
};

export default Journals;
