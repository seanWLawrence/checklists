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
    <button
      {...rest}
      className={cn(
        "rounded-lg py-1 px-2 text-sm space-x-2 flex items-center",
        {
          "border-2 border-zinc-900": variant === "outline",
          "border-2 border-transparent hover:border-zinc-200 transition-colors duration-100":
            variant === "ghost",
          "border-2 border-zinc-900 bg-zinc-900 text-zinc-50":
            variant === "primary",
        },
        rest.className,
      )}
      onClick={(e) => {
        rest.onClick?.(e);

        setClickedRecently(true);
      }}
    >
      <span>{children}</span>

      {pending && clickedRecently && (
        <Spinner
          className={cn({
            "text-zinc-900": variant === "outline",
            "text-zinc-200": variant === "ghost",
            "text-zinc-50": variant === "primary",
          })}
        />
      )}
    </button>
  );
};
