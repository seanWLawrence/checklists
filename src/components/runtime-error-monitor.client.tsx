"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { logger } from "@/lib/logger";

type RuntimeErrorState = {
  message: string;
};

const toErrorMessage = (value: unknown): string => {
  if (value instanceof Error && value.message) {
    return value.message;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  return "An unexpected runtime error occurred.";
};

export const RuntimeErrorMonitor = () => {
  const [runtimeError, setRuntimeError] = useState<RuntimeErrorState | null>(
    null,
  );

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logger.error(event.error ?? event.message ?? "Unknown runtime error");
      setRuntimeError({
        message: toErrorMessage(event.error ?? event.message),
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(event.reason ?? "Unhandled promise rejection");
      setRuntimeError({
        message: toErrorMessage(event.reason),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  if (!runtimeError) {
    return null;
  }

  return (
    <div className="fixed left-3 right-3 bottom-3 z-50 rounded-lg border-2 border-red-300 bg-red-50 p-3 text-red-900 shadow-lg dark:border-red-800 dark:bg-red-950/90 dark:text-red-100">
      <p className="text-sm font-semibold">Something went wrong in the app.</p>
      <p className="mt-1 text-xs break-words">{runtimeError.message}</p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => setRuntimeError(null)}
        >
          Dismiss
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    </div>
  );
};
