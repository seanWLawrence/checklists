"use client";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";
import { buttonClassName } from "./button-classes";

export const Button: React.FC<
  {
    children: React.ReactNode;
    variant?: "outline" | "primary" | "ghost";
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, variant = "outline", ...rest }) => {
  const { pending } = useFormStatus();

  return (
    <div>
      <button
        {...rest}
        className={buttonClassName({ variant, className: rest.className })}
        onClick={(e) => {
          rest.onClick?.(e);
        }}
      >
        <span className="text-nowrap whitespace-nowrap">{children}</span>

        {pending && (
          <div className={cn("animate-in fade-in duration-1000")}>
            <Spinner
              className={cn({
                "text-zinc-900 dark:text-zinc-300": variant === "outline",
                "text-zinc-200 dark:text-zinc-400": variant === "ghost",
                "text-zinc-50 dark:text-zinc-900": variant === "primary",
              })}
            />
          </div>
        )}
      </button>
    </div>
  );
};
