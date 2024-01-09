import { useCallback } from "react";

export function useLocalStorage<T>(key: string, fallbackValue: T) {
  const valueString = localStorage.getItem(key);

  const value: T | null = valueString
    ? JSON.parse(valueString)
    : fallbackValue ?? null;

  const setValue = useCallback(
    (value: T) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    [key],
  );

  return [value, setValue] as const;
}
