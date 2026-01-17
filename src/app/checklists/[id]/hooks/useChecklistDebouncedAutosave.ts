import { useCallback, useEffect, useRef } from "react";
import { updateChecklistV2Action } from "../../actions/update-checklist-v2.action";
import { updateChecklistV2SharedAction } from "../../actions/update-checklist-v2-shared.action";
import { Maybe } from "purify-ts/Maybe";
import { EitherAsync } from "purify-ts/EitherAsync";

export const useChecklistDebouncedAutosave = ({
  formRef,
  shareAccess,
  delayMs,
  saveTimeoutRef,
}: {
  formRef: React.RefObject<HTMLFormElement | null>;
  shareAccess?: { token: string };
  delayMs: number;
  saveTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
}) => {
  /**
   * True while a save request is running. Prevents overlapping saves.
   */
  const inFlightRef = useRef(false);
  /**
   * Set to true if a save was requested while inFlightRef is true.
   * Ensures we run another save after the current one finishes.
   */
  const queuedRef = useRef(false);

  const debouncedAutosave = useCallback(
    function debouncedAutosave() {
      Maybe.fromNullable(saveTimeoutRef.current).ifJust((timeout) => {
        clearTimeout(timeout);
      });

      saveTimeoutRef.current = setTimeout(() => {
        if (inFlightRef.current) {
          // Queue this newer save to run after the current one finishes
          queuedRef.current = true;
          return;
        }

        inFlightRef.current = true;

        return EitherAsync(async ({ liftEither }) => {
          const formData = await liftEither(
            Maybe.fromNullable(formRef.current)
              .toEither("Missing form ref")
              .map((formRef) => {
                return new FormData(formRef);
              }),
          );

          if (!shareAccess) {
            formData.set("skipRedirect", "true");

            await updateChecklistV2Action(formData);

            return;
          }

          await updateChecklistV2SharedAction(formData);
        })
          .finally(() => {
            inFlightRef.current = false;
            saveTimeoutRef.current = null;

            if (queuedRef.current) {
              queuedRef.current = false;
              debouncedAutosave();
            }
          })
          .run();
      }, delayMs);
    },
    [delayMs, formRef, shareAccess, saveTimeoutRef],
  );

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [saveTimeoutRef]);

  return {
    debouncedAutosave,
  };
};
