"use client";
import { cn } from "@/lib/cn";
import React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ ...rest }, ref) => {
  return (
    <input
      {...rest}
      ref={ref}
      className={cn(
        "rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full max-w-prose bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
        rest.className,
      )}
    />
  );
});

Input.displayName = "Input";
