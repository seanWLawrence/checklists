"use client";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import { useCallback, useEffect, useState, useTransition } from "react";
import { MenuButtonIcon } from "./icons/menu-button-icon";
import { Button } from "./button";

export const MenuButton: React.FC<
  {
    menu: React.ReactNode;
    children?: React.ReactNode;
    variant?: "outline" | "primary" | "ghost";
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, variant = "outline", menu, ...rest }) => {
  const { pending } = useFormStatus();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState<boolean>(false);

  const onClickChildren = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <div className="relative">
      <Button
        {...rest}
        variant="ghost"
        className={cn("p-.5", rest.className)}
        onClick={() => {
          startTransition(() => {
            setVisible((prev) => !prev);
          });
        }}
        type="button"
      >
        <MenuButtonIcon />

        {children && <span>{children}</span>}

        {pending && (
          <Spinner
            className={cn("animate-in fade-in duration-1000", {
              "text-zinc-900": variant === "outline",
              "text-zinc-200": variant === "ghost",
              "text-zinc-50": variant === "primary",
            })}
          />
        )}
      </Button>

      <div
        className={cn(
          "z-10 border-2 border-zinc-900 rounded-lg p-2 -mt-[.125rem] absolute bg-white animate-in fade-in duration-200",
          {
            hidden: !visible,
          },
        )}
        onClick={() => {
          startTransition(() => {
            setVisible(false);
          });
        }}
      >
        {menu}
      </div>
    </div>
  );
};
