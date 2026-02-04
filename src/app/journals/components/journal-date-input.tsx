"use client";

import { useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/input";

const getTodayLocal = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const JournalDateInput: React.FC<{
  name: string;
  required?: boolean;
  defaultValue?: string;
}> = ({ name, required, defaultValue }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldDefaultToToday = useMemo(
    () => !defaultValue || defaultValue.trim() === "",
    [defaultValue],
  );

  useEffect(() => {
    if (shouldDefaultToToday) {
      if (inputRef.current && inputRef.current.value === "") {
        inputRef.current.value = getTodayLocal();
      }
    }
  }, [shouldDefaultToToday]);

  return (
    <Input
      type="date"
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      ref={inputRef}
    />
  );
};
