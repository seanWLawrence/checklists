const stripRandomSuffix = (basename: string): string => {
  const lastDash = basename.lastIndexOf("-");
  if (lastDash === -1) {
    return basename;
  }

  const suffix = basename.slice(lastDash + 1);
  const isRandomSuffix = /^[a-z0-9]{6,}$/i.test(suffix);

  return isRandomSuffix ? basename.slice(0, lastDash) : basename;
};

export const getJournalImageCaption = ({
  pathname,
}: {
  pathname: string;
}): string => {
  const raw = decodeURIComponent(pathname.split("/").pop() ?? "");
  const extIndex = raw.lastIndexOf(".");
  const base = extIndex > 0 ? raw.slice(0, extIndex) : raw;
  const cleaned = stripRandomSuffix(base);

  return cleaned.replace(/[-_]+/g, " ").trim();
};
