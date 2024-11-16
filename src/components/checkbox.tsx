"use client";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useId,
  useState,
} from "react";
import { cn } from "@/lib/cn";

const keysToTriggerChecked = new Set<string>(["Enter", " ", "Return"]);

export const Checkbox: React.FC<
  { children: React.ReactNode; note?: string } & Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    "defaultChecked" | "name" | "checked"
  >
> = ({ children, note, ...rest }) => {
  const [checked, setChecked] = useState<boolean>(
    !!(rest.defaultChecked ?? rest.checked),
  );
  const id = useId();

  const toggleCheckedKeyDown: KeyboardEventHandler<HTMLLabelElement> =
    useCallback((e) => {
      const key = e.key;

      if (keysToTriggerChecked.has(key)) {
        setChecked((prev) => !prev);
      }
    }, []);

  const toggleCheckedClick: MouseEventHandler<HTMLLabelElement> = useCallback(
    (e) => {
      e.preventDefault();
      setChecked((prev) => !prev);
    },
    [],
  );

  return (
    <label
      className="flex flex-col space-y-.5 cursor-pointer p-1 rounded-lg"
      htmlFor={id}
      onKeyDown={toggleCheckedKeyDown}
      onClick={toggleCheckedClick}
      tabIndex={1}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        id={id}
        readOnly
        name={rest.name}
      />

      <span
        className={cn("text-sm text-zinc-800 text-left w-full", {
          "line-through decoration-2": checked,
        })}
      >
        {children}
      </span>

      {note && (
        <span
          className={cn("text-xs text-zinc-600", {
            "line-through decoration-1": checked,
          })}
        >
          {note}
        </span>
      )}
    </label>
  );
};
