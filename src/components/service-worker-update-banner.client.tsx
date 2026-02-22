"use client";

import { useEffect, useState } from "react";

import { useSerwist } from "@serwist/turbopack/react";
import { Button } from "./button";

export const ServiceWorkerUpdateBanner = () => {
  const { serwist } = useSerwist();
  const [updateReady, setUpdateReady] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    if (!serwist) {
      return;
    }

    const onWaiting = () => {
      setUpdateReady(true);
      setIsApplyingUpdate(false);
    };

    const onControlling = () => {
      if (isApplyingUpdate) {
        window.location.reload();
      }
    };

    serwist.addEventListener("waiting", onWaiting);
    serwist.addEventListener("controlling", onControlling);

    return () => {
      serwist.removeEventListener("waiting", onWaiting);
      serwist.removeEventListener("controlling", onControlling);
    };
  }, [serwist, isApplyingUpdate]);

  if (!updateReady) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-zinc-300 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-900 dark:text-zinc-100">
          A new version is available.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setUpdateReady(false)}
            disabled={isApplyingUpdate}
          >
            Later
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setIsApplyingUpdate(true);
              serwist?.messageSkipWaiting();
            }}
            disabled={isApplyingUpdate}
          >
            {isApplyingUpdate ? "Updating..." : "Refresh"}
          </Button>
        </div>
      </div>
    </div>
  );
};
