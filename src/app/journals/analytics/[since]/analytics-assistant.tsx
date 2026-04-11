"use client";

import { useActionState } from "react";

import { Fieldset } from "@/components/fieldset";
import { SubmitButton } from "@/components/submit-button";
import {
  summarizeJournalAnalyticsPeriodAction,
  type SummarizeJournalAnalyticsPeriodActionResult,
} from "./actions";

const initialState: SummarizeJournalAnalyticsPeriodActionResult = {
  ok: false,
  error: "",
};

export const AnalyticsAssistant: React.FC<{ since: string }> = ({ since }) => {
  const [state, formAction] = useActionState(
    summarizeJournalAnalyticsPeriodAction,
    initialState,
  );

  return (
    <Fieldset legend="AI assistant" className="text-left">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="since" value={since} />
        <input type="hidden" name="preset" value="summarize-period" />

        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton variant="primary">Summarize this period</SubmitButton>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Uses only compact analytics slices for this range.
          </p>
        </div>
      </form>

      {state.ok && (
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium">Summary</p>
            <p className="whitespace-pre-wrap">{state.answer.answer}</p>
          </div>

          {state.answer.observations.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium">Observations</p>
              <ul className="list-disc ml-4 space-y-1">
                {state.answer.observations.map((observation) => (
                  <li key={observation}>{observation}</li>
                ))}
              </ul>
            </div>
          )}

          {state.answer.caveats.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium">Caveats</p>
              <ul className="list-disc ml-4 space-y-1 text-zinc-600 dark:text-zinc-300">
                {state.answer.caveats.map((caveat) => (
                  <li key={caveat}>{caveat}</li>
                ))}
              </ul>
            </div>
          )}

          {state.answer.followUps && state.answer.followUps.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium">Follow-ups</p>
              <ul className="list-disc ml-4 space-y-1">
                {state.answer.followUps.map((followUp) => (
                  <li key={followUp}>{followUp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!state.ok && state.error !== "" && (
        <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
      )}
    </Fieldset>
  );
};
