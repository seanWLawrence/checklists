"use client";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const [, startTransition] = useTransition();
  const [visible, setVisible] = useState<boolean>(false);

  const ref = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const outsideClickListener = (event: MouseEvent) => {
      if (event?.target && !ref.current?.contains(event.target as Node)) {
        setVisible(false);
      }
    };

    document.addEventListener("click", outsideClickListener);

    return () => {
      document.removeEventListener("click", outsideClickListener);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
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
        <span className="flex space-x-1">
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
        </span>
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
