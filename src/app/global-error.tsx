"use client";

import { useEffect } from "react";
import { Button } from "@/components/button";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="p-5">
        <div className="space-y-2 max-w-prose">
          <div className="flex flex-col space-y-1 bg-red-100 text-red-800 p-4 rounded">
            <h2>App crashed</h2>
            <p>{error.message}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => reset()} variant="outline">
              Try again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              type="button"
            >
              Reload app
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
