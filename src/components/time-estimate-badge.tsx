import { sumTimeEstimates } from "@/app/checklists/lib/sum-time-estimates";
import { TimeEstimate } from "@/lib/types";

const NO_TIME_ESTIMATE = "0m";

export const TimeEstimateBadge: React.FC<{
  timeEstimates: (TimeEstimate | undefined)[];
}> = ({ timeEstimates }) => {
  const sum = sumTimeEstimates(timeEstimates);

  if (sum === NO_TIME_ESTIMATE) {
    return null;
  }

  return (
    <span>
      <span className="text-xs bg-zinc-200 text-zinc-900 rounded py-1 px-1.5">
        {sum}
      </span>
    </span>
  );
};
