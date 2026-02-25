"use client";

import { useEffect } from "react";

export const ServiceWorkerDevReset = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    void (async () => {
      if (!("serviceWorker" in navigator)) {
        return;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.includes("serwist") || key.includes("precache"))
            .map((key) => caches.delete(key)),
        );
      }
    })();
  }, []);

  return null;
};
