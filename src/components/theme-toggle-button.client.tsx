"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
};

const getInitialTheme = (): Theme => {
  const override = process.env.NEXT_PUBLIC_THEME_OVERRIDE;
  if (override === "light" || override === "dark") {
    return override;
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
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const override = process.env.NEXT_PUBLIC_THEME_OVERRIDE;
  const isLocked = override === "light" || override === "dark";

  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (isLocked) {
      return;
    }

    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // no-op
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      disabled={!mounted || isLocked}
      title={isLocked ? `Theme is locked to ${override}` : "Toggle theme"}
    >
      Theme: {mounted ? (theme === "dark" ? "Dark" : "Light") : "..."}
    </Button>
  );
};
