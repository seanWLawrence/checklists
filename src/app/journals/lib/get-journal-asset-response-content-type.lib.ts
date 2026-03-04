export const getJournalAssetResponseContentType = ({
  filename,
}: {
  filename: string;
}): string | undefined => {
  const extension = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase()
    : undefined;

  switch (extension) {
    case "m4a":
    case "aac":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
    case "opus":
      return "audio/ogg";
    case "webm":
      return "audio/webm";
    case "flac":
      return "audio/flac";
    default:
      return undefined;
  }
};
