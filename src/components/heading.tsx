import { cn } from "@/lib/cn";

export const Heading: React.FC<
  {
    children: React.ReactNode;
    level: 1 | 2 | 3 | "legend";
  } & React.HTMLAttributes<HTMLHeadingElement>
> = ({ children, level, ...rest }) => {
  switch (level) {
    case 1:
      return (
        <h1
          {...rest}
          className={cn(
            "font-bold text-2xl text-zinc-900 dark:text-zinc-200",
            rest.className,
          )}
        >
          {children}
        </h1>
      );
    case 2:
      return (
        <h2
          {...rest}
          className={cn(
            "font-bold text-xl text-zinc-900 dark:text-zinc-200",
            rest.className,
          )}
        >
          {children}
        </h2>
      );
    case 3:
      return (
        <h3
          {...rest}
          className={cn(
            "font-semibold text-sm text-zinc-800 dark:text-zinc-300",
            rest.className,
          )}
        >
          {children}
        </h3>
      );
    case "legend":
      return (
        <legend
          {...rest}
          className={cn(
            "font-semibold text-md text-zinc-800 dark:text-zinc-300",
            rest.className,
          )}
        >
          {children}
        </legend>
      );
  }
};
