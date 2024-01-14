"use client";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import { useEffect, useState } from "react";

export const Button: React.FC<
  {
    children: React.ReactNode;
    variant?: "outline" | "primary" | "ghost";
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, variant = "outline", ...rest }) => {
  const { pending } = useFormStatus();
  const [clickedRecently, setClickedRecently] = useState<boolean>(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClickedRecently(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [clickedRecently]);

  return (
    <div>
      <button
        {...rest}
        className={cn(
          "rounded-lg py-1 px-2 text-sm space-x-2 flex items-center text-nowrap whitespace-nowrap",
          {
            "border-2 border-zinc-900 hover:border-r-4 hover:border-b-4 transition-all duration-100":
              variant === "outline",
            "border-2 border-transparent hover:border-r-4 hover:border-b-4 hover:border-zinc-200 transition-all duration-100":
              variant === "ghost",
            "border-2 border-zinc-900 bg-zinc-900 text-zinc-50 hover:border-r-4 hover:border-b-4 hover:border-b-zinc-600 hover:border-r-zinc-600 transition-all duration-100":
              variant === "primary",
          },
          rest.className,
        )}
        onClick={(e) => {
          rest.onClick?.(e);

          setClickedRecently(true);
        }}
      >
        <span className="text-nowrap whitespace-nowrap">{children}</span>

        <div
          className={cn("animate-in fade-in duration-1000", {
            hidden: !(pending && clickedRecently),
          })}
        >
          <Spinner
            className={cn({
              "text-zinc-900": variant === "outline",
              "text-zinc-200": variant === "ghost",
              "text-zinc-50": variant === "primary",
            })}
          />
        </div>
      </button>
    </div>
  );
};
