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
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return undefined;
  }
};
