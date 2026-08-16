import React from "react";
import { cn } from "@/lib/cn";

export const ChevronDownIcon: React.FC<
  {} & React.HTMLAttributes<SVGElement>
> = ({ ...rest }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      {...rest}
      className={cn("w-4 h-4 shrink-0", rest.className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
};
