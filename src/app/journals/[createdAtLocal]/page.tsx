import React from "react";
import { EitherAsync } from "purify-ts/EitherAsync";
import Link from "next/link";

import { Heading } from "@/components/heading";
import { getJournal } from "../journal.model";
import { prettyDate } from "../journal.lib";
import { CreatedAtLocal } from "../journal.types";
import { Label } from "@/components/label";
import { groupJournalContentSections } from "./group-journal-content-sections";

const prettyContent = (content: string): React.ReactNode => {
  return groupJournalContentSections(content)
    .map((sections) => {
      return (
        // Not actually an iterator, "map" in this context is different
        // eslint-disable-next-line react/jsx-key
        <div className="space-y-3">
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
      <main className="space-y-2 max-w-prose">
        <div className="flex space-x-2 items-center">
          <Heading level={1}>{prettyDate(journal.createdAtLocal)}</Heading>

          <Link
            className="underline underline-offset-2 text-xs"
            href={`/journals/${journal.createdAtLocal}/edit`}
          >
            Edit
          </Link>
        </div>

        <Label label="Energy level (low to high)">
          <input
            type="range"
            readOnly
            value={journal?.energyLevel}
            min="1"
            max="5"
          />
        </Label>

        <Label label="Mood (low to high)">
          <input
            type="range"
            value={journal?.moodLevel}
            readOnly
            min="1"
            max="5"
          />
        </Label>

        <Label label="Health (low to high)">
          <input
            type="range"
            value={journal?.healthLevel}
            readOnly
            min="1"
            max="5"
          />
        </Label>

        <Label label="Creativity (low to high)">
          <input
            type="range"
            value={journal?.creativityLevel}
            readOnly
            min="1"
            max="5"
          />
        </Label>

        <Label label="Relationships (low to high)">
          <input
            type="range"
            value={journal?.relationshipsLevel}
            readOnly
            min="1"
            max="5"
          />
        </Label>

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
