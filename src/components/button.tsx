"use client";
import { cn } from "@/lib/utils";

export const Button: React.FC<
  {
    children: React.ReactNode;
    variant?: "outline" | "primary" | "ghost";
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, variant = "outline", ...rest }) => {
  return (
    <button
      {...rest}
      className={cn(
        "rounded-lg py-1 px-2 text-sm",
        {
          "border-2 border-zinc-900": variant === "outline",
          "border-2 border-transparent hover:border-zinc-200 transition-colors duration-100":
            variant === "ghost",
          "border-2 border-zinc-900 bg-zinc-900 text-zinc-50":
            variant === "primary",
        },
        rest.className,
      )}
    >
      {children}
    </button>
  );
};
