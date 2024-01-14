"use client";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import { useEffect, useState } from "react";
import { MenuButtonIcon } from "./icons/menu-button-icon";

export const MenuButton: React.FC<
  {
    menu: React.ReactNode;
    children?: React.ReactNode;
    variant?: "outline" | "primary" | "ghost";
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, variant = "outline", menu, ...rest }) => {
  const { pending } = useFormStatus();
  const [clickedRecently, setClickedRecently] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClickedRecently(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [clickedRecently]);

  return (
    <div className="relative">
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
        onClick={() => {
          setVisible((prev) => !prev);
        }}
        type="button"
      >
        <MenuButtonIcon />

        {children && <span>{children}</span>}

        {pending && clickedRecently && (
          <Spinner
            className={cn("animate-in fade-in duration-1000", {
              "text-zinc-900": variant === "outline",
              "text-zinc-200": variant === "ghost",
              "text-zinc-50": variant === "primary",
            })}
          />
        )}
      </button>

      <div
        className={cn(
          "border-2 border-zinc-900 rounded-lg p-2 -mt-[.125rem] absolute bg-white animate-in fade-in duration-200",
          {
            hidden: !visible,
          },
        )}
      >
        {menu}
      </div>
    </div>
  );
};
