"use client";
import { useEffect, useId, useRef, useState } from "react";
import { XIcon } from "@/components/icons/x-icon";
import { cn } from "@/lib/utils";

export const Checkbox: React.FC<
  { children: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>
> = ({ children, ...rest }) => {
  const [checked, setChecked] = useState<boolean>(
    !!(rest.defaultChecked ?? rest.checked),
  );

  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const onClick = () => {
    setChecked((prev) => !prev);
  };

  useEffect(() => {
    if (inputRef.current && inputRef.current?.checked !== checked) {
      inputRef.current.checked = checked;
    }
  }, [checked]);

  return (
    <button
      className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg"
      type="button"
      onClick={onClick}
    >
      <input
        type="checkbox"
        className="hidden"
        onChange={onClick}
        {...rest}
        id={id}
        ref={inputRef}
      />

      <div className="border-2 border-zinc-900 rounded h-6 w-6 text-[1rem] flex justify-center items-center">
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
        className={cn("text-sm text-zinc-800", {
          "line-through": checked,
        })}
      >
        {children}
      </span>
    </button>
  );
};
