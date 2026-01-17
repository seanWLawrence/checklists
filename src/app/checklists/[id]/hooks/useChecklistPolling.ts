import { useEffect, useRef } from "react";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Maybe } from "purify-ts/Maybe";
import { date } from "purify-ts/Codec";

import {
  ChecklistV2,
  ChecklistV2Polled,
  ChecklistV2Structured,
} from "../../checklist-v2.types";
import { logger } from "@/lib/logger";
import { structureChecklistContent } from "../structure-checklist-content";

export const useChecklistPolling = ({
  checklistId,
  shareAccess,
  pollingIntervalMs,
  saveTimeoutRef,
  setCurrentChecklist,
}: {
  checklistId: string;
  shareAccess?: { token: string };
  pollingIntervalMs: number;
  saveTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  setCurrentChecklist: React.Dispatch<
    React.SetStateAction<
      ChecklistV2Structured & Pick<ChecklistV2, "id" | "name" | "updatedAtIso">
    >
  >;
}) => {
  /**
   * The most recent updatedAt we’ve applied.
   * Prevents applying stale server results.
   */
  const lastUpdatedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    if (pollingIntervalMs <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      if (saveTimeoutRef.current) {
        return;
      }

      return EitherAsync(async ({ liftEither }) => {
        const id = await liftEither(
          Maybe.fromNullable(checklistId).toEither("No checklist ID"),
        );

        return shareAccess
          ? `/api/checklists/share?token=${encodeURIComponent(shareAccess.token)}`
          : `/api/checklists/${id}`;
      })
        .chain((url) => {
          return EitherAsync(async ({ throwE }) => {
            const response = await fetch(url, {
              cache: "no-store",
              credentials: "include",
            });

            if (!response.ok) {
              logger.error("Failed to fetch checklist", response.statusText);

              throwE("Failed to fetch checklist");
            }

            return response;
          });
        })
        .chain((response) => {
          return EitherAsync(async ({ liftEither }) => {
            const json = await response.json();

            return liftEither(ChecklistV2Polled.decode(json));
          });
        })
        .ifRight((polledChecklist) => {
          const structured = structureChecklistContent(polledChecklist.content);

          const updatedAtIso = date.decode(polledChecklist.updatedAtIso);

          if (updatedAtIso.isLeft()) {
            logger.error("Invalid updatedAtIso in polled checklist");
            return;
          }

          if (updatedAtIso.isRight()) {
            const nextUpdatedAt = updatedAtIso.extract();

            const polledDataIsStale =
              lastUpdatedAtRef.current &&
              nextUpdatedAt.getTime() <= lastUpdatedAtRef.current.getTime();

            if (polledDataIsStale) {
              return;
            }

            lastUpdatedAtRef.current = nextUpdatedAt;
            setCurrentChecklist((prev) => ({
              ...prev,
              ...structured,
              ...polledChecklist,
              updatedAtIso: nextUpdatedAt,
            }));
          }
        })
        .run();
    }, pollingIntervalMs);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [
    checklistId,
    shareAccess,
    pollingIntervalMs,
    saveTimeoutRef,
    setCurrentChecklist,
  ]);
};
