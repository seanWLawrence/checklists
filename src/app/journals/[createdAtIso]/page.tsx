import React from "react";
import { EitherAsync } from "purify-ts/EitherAsync";
import { NonEmptyList } from "purify-ts/NonEmptyList";
import { Either } from "purify-ts/Either";
import Link from "next/link";

import { Heading } from "@/components/heading";
import { getJournal, prettyDate, yyyyMmDdDate } from "../journal.model";

const prettyContent = (content: string): React.ReactNode => {
  return NonEmptyList.fromArray(content.split("\n"))
    .map((list) => {
      const sections: {
        heading: string;
        children: string[];
      }[] = [];

      for (let i = 0; i < list.length; i++) {
        const row = list[i].trim();

        const isEmpty = row.length === 0;
        if (isEmpty) {
          continue;
        }

        const isHeading = row.startsWith("## ");
        if (isHeading) {
          const heading = NonEmptyList.fromArray(row.split("## "))
            .map((list) => list[1])
            .orDefault(list[0]);

          sections.push({ heading, children: [] });
          continue;
        }

        const lastSectionsIndex = sections.length - 1;
        if (lastSectionsIndex < 0) {
          continue;
        }

        sections[lastSectionsIndex].children.push(row);
      }

      return (
        <div key={JSON.stringify(list)} className="space-y-3">
          {sections.map((section, index) => {
            return (
              <div key={`${section.heading}-${index}`} className="space-y-1">
                <Heading level={2}>{section.heading}</Heading>

                {section.children.map((row, index) => (
                  <p key={`${row}-${index}`}>{row}</p>
                ))}
              </div>
            );
          })}
        </div>
      );
    })
    .extract();
};

const Journal: React.FC<{ params: { createdAtIso: string } }> = async ({
  params,
}) => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtIso = await liftEither(
      Either.encase(() => new Date(params.createdAtIso)),
    );

    const journal = await fromPromise(getJournal(createdAtIso));

    return (
      <main className="space-y-2">
        <div className="flex space-x-2 items-center">
          <Heading level={1}>{prettyDate(journal.createdAtIso)}</Heading>

          <Link
            className="underline underline-offset-2 text-xs"
            href={`/journals/${yyyyMmDdDate(journal.createdAtIso)}/edit`}
          >
            Edit
          </Link>
        </div>

        <div className="space-y-1">{prettyContent(journal.content)}</div>
      </main>
    );
  })
    .mapLeft((e) => {
      return <p>{String(e)}</p>;
    })
    .run();

  return response.toJSON();
};

export default Journal;
