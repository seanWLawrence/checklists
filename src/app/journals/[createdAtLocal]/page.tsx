import React from "react";
import { EitherAsync } from "purify-ts/EitherAsync";
import { NonEmptyList } from "purify-ts/NonEmptyList";
import Link from "next/link";

import { Heading } from "@/components/heading";
import { getJournal } from "../journal.model";
import { prettyDate } from "../journal.lib";
import { CreatedAtLocal } from "../journal.types";

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

                <ul>
                  {section.children.map((row, index) => (
                    <li className="list-disc ml-4" key={`${row}-${index}`}>
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );
    })
    .extract();
};

const Journal: React.FC<{ params: { createdAtLocal: string } }> = async ({
  params,
}) => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtLocal = await liftEither(
      CreatedAtLocal.decode(params.createdAtLocal),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));

    return (
      <main className="space-y-2">
        <div className="flex space-x-2 items-center">
          <Heading level={1}>{prettyDate(journal.createdAtLocal)}</Heading>

          <Link
            className="underline underline-offset-2 text-xs"
            href={`/journals/${journal.createdAtLocal}/edit`}
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
