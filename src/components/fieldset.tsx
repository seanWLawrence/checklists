import { Heading } from "@/components/heading";
import { cn } from "@/lib/cn";

export const Fieldset: React.FC<
  React.PropsWithChildren<{
    legend: React.ReactNode;
    className?: string;
    legendClassName?: string;
  }>
> = ({ legend, className, legendClassName, children }) => {
  return (
    <fieldset
      className={cn(
        "space-y-1 border-2 border-zinc-700 dark:border-zinc-500 px-3 pt-2 pb-3 rounded-lg w-full min-w-48",
        className,
      )}
    >
      <Heading
        level="legend"
        className={cn("flex items-center space-x-2", legendClassName)}
      >
        {legend}
      </Heading>
      {children}
    </fieldset>
  );
};
