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
        <h1 {...rest} className={cn("font-bold text-2xl", rest.className)}>
          {children}
        </h1>
      );
    case 2:
      return (
        <h2 {...rest} className={cn("font-bold text-xl", rest.className)}>
          {children}
        </h2>
      );
    case 3:
      return (
        <h3 {...rest} className={cn("font-semibold text-sm", rest.className)}>
          {children}
        </h3>
      );
    case "legend":
      return (
        <legend
          {...rest}
          className={cn("font-semibold text-md", rest.className)}
        >
          {children}
        </legend>
      );
  }
};
