"use client";
import { ChangeEventHandler, useCallback, useId, useState } from "react";
import { cn } from "@/lib/cn";

export const Checkbox: React.FC<
  {
    children: React.ReactNode;
    note?: string;
    onCheckedChange?: (checked: boolean) => void;
  } & Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    "defaultChecked" | "name" | "checked" | "onChange"
  >
> = ({ children, note, onCheckedChange, ...rest }) => {
  const [checked, setChecked] = useState<boolean>(
    !!(rest.defaultChecked ?? rest.checked),
  );
  const id = useId();

  const { onChange, ...inputProps } = rest;

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const next = event.target.checked;
      setChecked(next);
      onCheckedChange?.(next);
      onChange?.(event);
    },
    [onCheckedChange, onChange],
  );

  return (
    <label
      className="flex flex-col space-y-.5 cursor-pointer p-1 rounded-lg"
      htmlFor={id}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={handleChange}
        id={id}
        name={inputProps.name}
      />

      <span
        className={cn("text-sm text-zinc-800 dark:text-zinc-200 text-left w-full", {
          "line-through decoration-2": checked,
        })}
      >
        {children}
      </span>

      {note && (
        <span
          className={cn("text-xs text-zinc-600 dark:text-zinc-400", {
            "line-through decoration-1": checked,
          })}
        >
          {note}
        </span>
      )}
    </label>
  );
};
