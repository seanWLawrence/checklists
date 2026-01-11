import { TimeEstimate } from "@/app/checklists/checklist-v2.types";
import { sumTimeEstimates } from "@/app/checklists/lib/sum-time-estimates";

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
      <span className="text-xs bg-zinc-200 text-zinc-900 rounded-sm py-1 px-1.5 dark:bg-zinc-800 dark:text-zinc-200">
        {sum}
      </span>
    </span>
  );
};
