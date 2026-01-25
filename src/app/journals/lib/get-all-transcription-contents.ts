import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { getBooleanFromFormData } from "@/lib/form-data/get-boolean-from-form-data";
import { transcribeJournalAudioIntoContent } from "./transcribe-audio-into-content.lib";

export const getAllTranscriptionContents = ({
  formData,
  audioFiles,
}: {
  formData: FormData;
  audioFiles: File[];
}) => {
  return EitherAsync(async ({ fromPromise }) => {
    let result = "";

    const transcrptionEitherAsyncs: EitherAsync<unknown, string>[] = [];

    for (const [index, file] of audioFiles.entries()) {
      const shouldTranscribe = getBooleanFromFormData({
        formData,
        name: `audios_shouldTranscribe_${index}`,
      });

      if (!shouldTranscribe) {
        continue;
      }

      transcrptionEitherAsyncs.push(
        transcribeJournalAudioIntoContent({ audio: file }),
      );
    }

    const transcribedContents = await fromPromise(
      EitherAsync.all(transcrptionEitherAsyncs),
    );

    if (transcribedContents.length > 0) {
      result += transcribedContents.join("\n\n");
    }

    return result;
  });
};
