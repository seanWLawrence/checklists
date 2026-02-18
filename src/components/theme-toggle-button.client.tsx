"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const THEME_COOKIE_KEY = "theme";

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
};

const getInitialTheme = (): Theme => {
  const override = process.env.NEXT_PUBLIC_THEME_OVERRIDE;
  if (override === "light" || override === "dark") {
    return override;
  }

  const htmlTheme = document.documentElement.dataset.theme;
  if (htmlTheme === "light" || htmlTheme === "dark") {
    return htmlTheme;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // no-op
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeToggleButton = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return getInitialTheme();
  });
  const override = process.env.NEXT_PUBLIC_THEME_OVERRIDE;
  const isLocked = override === "light" || override === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const persistTheme = (nextTheme: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // no-op
    }

    document.cookie = `${THEME_COOKIE_KEY}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  };

  const toggleTheme = () => {
    if (isLocked) {
      return;
    }

    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    persistTheme(nextTheme);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      disabled={isLocked}
      title={isLocked ? `Theme is locked to ${override}` : "Toggle theme"}
    >
      <span suppressHydrationWarning>
        Theme: {theme === "dark" ? "Dark" : "Light"}
      </span>
    </Button>
  );
};
