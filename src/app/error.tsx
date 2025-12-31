"use client"; // Error components must be Client Components

import { Button } from "@/components/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-1 bg-red-100 text-red-800 p-4 rounded">
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
      </div>

      <Button onClick={() => reset()} variant="primary">
        Try again
      </Button>
    </div>
  );
}
