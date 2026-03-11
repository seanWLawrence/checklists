"use client";
import React from "react";
import { cn } from "@/lib/cn";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ ...rest }, ref) => {
  return (
    <textarea
      {...rest}
      ref={ref}
      className={cn(
        "rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full max-w-prose bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
        rest.className,
      )}
    />
  );
});

Textarea.displayName = "Textarea";
