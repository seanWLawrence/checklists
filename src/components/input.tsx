"use client";
import { cn } from "@/lib/utils";

export const Input: React.FC<
  {} & React.InputHTMLAttributes<HTMLInputElement>
> = ({ children, ...rest }) => {
  return (
    <input
      {...rest}
      className={cn(
        "rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 min-w-48 w-full max-w-prose",
        rest.className,
      )}
    />
  );
};
