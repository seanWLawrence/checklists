import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Either } from "purify-ts/Either";

const execFile = promisify(execFileCallback);
const CONVERSION_TIMEOUT_MS = 8 * 60 * 1000;

export const getAudioExtractionArgs = ({
  inputPath,
  outputPath,
}: {
  inputPath: string;
  outputPath: string;
}) => [
  "-y",
  "-i",
  inputPath,
  "-vn",
  "-map",
  "0:a:0",
  "-ac",
  "1",
  "-c:a",
  "aac",
  "-b:a",
  "32k",
  outputPath,
];

export const prepareTranscriptionAudio = ({
  media,
  ffmpegPath = process.env.FFMPEG_PATH ?? "/opt/ffmpeg",
}: {
  media: File;
  ffmpegPath?: string;
}): EitherAsync<unknown, File> => {
  if (media.type !== "video/mp4") {
    return EitherAsync.liftEither(Either.of(media));
  }

  return EitherAsync(async ({ throwE }) => {
    let workingDirectory: string | undefined;

    try {
      workingDirectory = await mkdtemp(path.join(tmpdir(), "transcription-"));
      const inputPath = path.join(workingDirectory, "input.mp4");
      const outputPath = path.join(workingDirectory, "audio.m4a");

      await writeFile(inputPath, new Uint8Array(await media.arrayBuffer()));
      await execFile(
        ffmpegPath,
        getAudioExtractionArgs({ inputPath, outputPath }),
        { timeout: CONVERSION_TIMEOUT_MS },
      );

      const audio = await readFile(outputPath);

      return new File([audio], "audio.m4a", { type: "audio/mp4" });
    } catch (error) {
      return throwE(error);
    } finally {
      if (workingDirectory) {
        await rm(workingDirectory, { force: true, recursive: true });
      }
    }
  });
};
