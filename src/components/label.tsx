"use client";
import { cn } from "@/lib/cn";

export const Label: React.FC<
  {
    children?: React.ReactNode;
    label: React.ReactNode;
  } & React.LabelHTMLAttributes<HTMLLabelElement>
> = ({ children, label, ...rest }) => {
  return (
    <label
      {...rest}
      className={cn("flex flex-col space-y-1 w-full", rest.className)}
    >
      <span className="text-xs text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
};
