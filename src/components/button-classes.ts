import { cn } from "@/lib/cn";

const baseClasses =
  "rounded-lg py-1 px-2 text-sm space-x-2 flex items-center text-nowrap whitespace-nowrap";

export const buttonClassName = ({
  variant = "outline",
  className,
}: {
  variant: "outline" | "primary" | "ghost";
  className?: string;
}) =>
  cn(
    baseClasses,
    {
      "border-2 border-zinc-900 shadow-[rgb(0,0,0)_2px_2px_0px] active:shadow-none transition-all duration-100 dark:border-zinc-400 dark:text-zinc-200 dark:shadow-[rgba(255,255,255,0.08)_2px_2px_0px]":
        variant === "outline",
      "border-2 border-transparent hover:bg-zinc-100 active:bg-zinc-200 transition-all duration-100 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700":
        variant === "ghost",
      "border-2 border-zinc-900 bg-zinc-900 text-zinc-50 shadow-[rgba(0,0,0,.25)_3px_3px_0px] active:shadow-none transition-all duration-100 dark:border-zinc-300 dark:bg-zinc-200 dark:text-zinc-950":
        variant === "primary",
    },
    className,
  );
