import { LinkButton } from "@/components/link-button";
import { normalizeJournalContent } from "../lib/get-journal-embedding-input.lib";
import { JournalSemanticMatch } from "../lib/search-journals-semantic.lib";

const getPreview = (content: string): string => {
  const normalized = normalizeJournalContent(content).replace(/\s+/g, " ");
  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 180).trim()}...`;
};

const getMatchPercentFromDistance = (distance?: number): number | undefined => {
  if (typeof distance !== "number" || !Number.isFinite(distance)) {
    return undefined;
  }

  const confidence = Math.max(0, Math.min(1, 1 - distance / 2));
  return Math.round(confidence * 100);
};

const getConfidenceInfo = (
  distance?: number,
): { label: string; className: string; title: string } => {
  const percent = getMatchPercentFromDistance(distance);
  if (typeof percent !== "number") {
    return {
      label: "Unknown",
      className: "text-zinc-500",
      title: "Confidence is unavailable for this result.",
    };
  }

  if (percent >= 70) {
    return {
      label: "Strong",
      className: "text-emerald-700 dark:text-emerald-400",
      title: `Strong match: ${percent}% confidence (distance ${distance?.toFixed(4)})`,
    };
  }

  if (percent >= 45) {
    return {
      label: "Fair",
      className: "text-amber-600 dark:text-amber-400",
      title: `Fair match: ${percent}% confidence (distance ${distance?.toFixed(4)})`,
    };
  }

  return {
    label: "Weak",
    className: "text-rose-700 dark:text-rose-400",
    title: `Weak match: ${percent}% confidence (distance ${distance?.toFixed(4)})`,
  };
};

export const JournalSearchResults: React.FC<{
  q: string;
  sinceYear?: string;
  matches: JournalSemanticMatch[];
}> = ({ q, sinceYear, matches }) => {
  if (q.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Enter a phrase and run semantic search across your journal entries.
      </p>
    );
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        No semantic matches found for &quot;{q}&quot;.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        Found {matches.length} semantic match
        {matches.length === 1 ? "" : "es"} for &quot;{q}&quot;
        {sinceYear ? ` in ${sinceYear}` : ""}.
      </p>

      <ul className="space-y-3">
        {matches.map((match) => (
          <li
            key={match.journal.id}
            className="rounded-xl border-2 border-zinc-300 p-3 space-y-2 max-w-prose"
          >
            <div className="flex justify-between w-full">
              <p className="text-sm text-zinc-700 w-full flex-1">
                {getPreview(match.journal.content ?? "")}
              </p>

              <div className="flex items-center justify-between">
                {(() => {
                  const confidence = getConfidenceInfo(match.distance);
                  return (
                    <span
                      className={`text-xs font-medium ${confidence.className}`}
                      title={confidence.title}
                    >
                      {confidence.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <LinkButton
              href={`/journals/${match.journal.createdAtLocal}`}
              variant="outline"
              className="max-w-fit"
            >
              Read more
            </LinkButton>
          </li>
        ))}
      </ul>
    </div>
  );
};
