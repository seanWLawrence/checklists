"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format-relative-time";

export const RelativeTime: React.FC<{ date: Date }> = ({ date }) => {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    setValue(formatRelativeTime(date));
  }, [date]);

  return (
    <span className="text-xs text-zinc-600 italic dark:text-zinc-400">
      {value}
    </span>
  );
};
