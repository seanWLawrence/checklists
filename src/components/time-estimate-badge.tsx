import { sumTimeEstimates } from "@/lib/time-estimate";
import { TimeEstimate } from "@/lib/types";

export const TimeEstimateBadge: React.FC<{
  timeEstimates: (TimeEstimate | undefined)[];
}> = ({ timeEstimates }) => {
  return (
    <span>
      <span className="text-xs bg-zinc-200 text-zinc-900 rounded py-1 px-1.5">
        {sumTimeEstimates(timeEstimates)}
      </span>
    </span>
  );
};
