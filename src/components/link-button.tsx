import Link, { LinkProps } from "next/link";
import { buttonClassName } from "./button-classes";

type LinkButtonProps = LinkProps & {
  children: React.ReactNode;
  variant?: "outline" | "primary" | "ghost";
  className?: string;
};

export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  variant = "outline",
  className,
  ...rest
}) => {
  return (
    <Link {...rest} className={buttonClassName({ variant, className })}>
      <span className="text-nowrap whitespace-nowrap">{children}</span>
    </Link>
  );
};
