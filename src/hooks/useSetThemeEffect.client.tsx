"use client";

import { useLayoutEffect } from "react";

export const useSetThemeEffect = () => {
  useLayoutEffect(() => {
    try {
      const override = process.env.NEXT_PUBLIC_THEME_OVERRIDE;
      if (override === "light" || override === "dark") {
        document.documentElement.classList.toggle("dark", override === "dark");
        document.documentElement.dataset.theme = override;
        return;
      }

      const hour = new Date().getHours();
      const isLightHours = hour >= 10 && hour < 18;
      const theme = isLightHours ? "light" : "dark";
      const shouldBeDark = theme === "dark";
      document.documentElement.classList.toggle("dark", shouldBeDark);
      document.documentElement.dataset.theme = theme;
    } catch {
      // no-op
    }
  }, []);
};
