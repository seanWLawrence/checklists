"use client";
import { useCallback, useId, useRef, useState } from "react";
import { XIcon } from "@/components/icons/x-icon";
import { cn } from "@/lib/utils";

export const Checkbox: React.FC<
  { children: React.ReactNode } & Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    "defaultChecked" | "name" | "checked"
  >
> = ({ children, ...rest }) => {
  const [checked, setChecked] = useState<boolean>(
    !!(rest.defaultChecked ?? rest.checked),
  );

  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const onClick = useCallback(() => {
    setChecked((prev) => !prev);
  }, []);

  return (
    <button
      className="flex items-center cursor-pointer p-1 rounded-lg"
      type="button"
      onClick={onClick}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        id={id}
        readOnly
        ref={inputRef}
        name={rest.name}
      />

      <div className="border-2 border-zinc-900 rounded h-6 w-6 min-w-6 min-h-6 text-[1rem] flex justify-center items-center mr-3">
        <span>
          <XIcon
            className={cn("w-6 h-6 transition-opacity duration-100", {
              "opacity-0": !checked,
              "opacity-100": checked,
            })}
          />
        </span>
      </div>

      <span
        className={cn("text-sm text-zinc-800 text-left w-full", {
          "line-through": checked,
        })}
      >
        {children}
      </span>
    </button>
  );
};
