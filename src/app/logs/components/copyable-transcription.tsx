"use client";

import { useState } from "react";

import { Button } from "@/components/button";

export const CopyableTranscription: React.FC<{ transcription: string }> = ({
  transcription,
}) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const copyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => void copyTranscription()}
        >
          {copyState === "copied" ? "Copied!" : "Copy transcription"}
        </Button>
      </div>

      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-200">
        {transcription}
      </p>

      {copyState === "error" && (
        <p className="text-xs text-rose-600" role="status">
          Couldn&apos;t copy. Please select the text and copy it manually.
        </p>
      )}
    </div>
  );
};
