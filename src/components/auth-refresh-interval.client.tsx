"use client";

import { logger } from "@/lib/logger";
import { useEffect, useRef } from "react";

const REFRESH_ENDPOINT = "/api/auth/refresh?redirect=false";
const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;

const shouldRefresh = () => {
  if (typeof document === "undefined") return false;
  if (document.visibilityState !== "visible") return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  return true;
};

export const AuthRefreshInterval = () => {
  const inFlight = useRef(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refresh = async () => {
      if (inFlight.current || !shouldRefresh()) return;
      inFlight.current = true;

      try {
        logger.debug("Refreshing auth token in background...");

        await fetch(REFRESH_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: {
            "cache-control": "no-store",
          },
        });
      } catch {
        // no-op
      } finally {
        inFlight.current = false;
      }
    };

    const start = () => {
      void refresh();
      intervalId = setInterval(refresh, ONE_MINUTE_IN_MILLISECONDS);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    const handleOnline = () => {
      if (navigator.onLine && document.visibilityState === "visible") {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
};
