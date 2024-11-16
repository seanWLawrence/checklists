"use client";
import { cn } from "@/lib/cn";
import React from "react";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  ...rest
}) => {
  return (
    <input
      {...rest}
      className={cn(
        "rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full max-w-prose",
        rest.className,
      )}
    />
  );
};
