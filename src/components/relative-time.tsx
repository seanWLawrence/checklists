import { formatRelativeTime } from "@/lib/format-relative-time";

export const RelativeTime: React.FC<{ date: Date }> = ({ date }) => {
  return (
    <span className="text-xs text-zinc-600 italic">
      {formatRelativeTime(date)}
    </span>
  );
};
