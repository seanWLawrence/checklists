"use client";
import { buttonClassName } from "./button-classes";

export const Button: React.FC<
  {
    children: React.ReactNode;
    variant?: "outline" | "primary" | "ghost";
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, variant = "outline", ...rest }) => {
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
      </button>
    </div>
  );
};
