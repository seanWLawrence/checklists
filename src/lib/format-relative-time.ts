export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  const units: { [key: string]: number } = {
    year: 60 * 60 * 24 * 365,
    month: 60 * 60 * 24 * 30,
    week: 60 * 60 * 24 * 7,
    day: 60 * 60 * 24,
    hour: 60 * 60,
    minute: 60,
    second: 1,
  };

  for (const unit in units) {
    if (Math.abs(diffInSeconds) >= units[unit] || unit === "second") {
      const value = Math.floor(diffInSeconds / units[unit]);

      return relativeTimeFormat.format(
        -value,
        unit as Intl.RelativeTimeFormatUnit,
      );
    }
  }

  return "";
};
