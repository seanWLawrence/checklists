import { getOptionalEnv } from "@/lib/env.helpers";

export const NEXT_PUBLIC_THEME_OVERRIDE = (() => {
  const value = getOptionalEnv({ key: "NEXT_PUBLIC_THEME_OVERRIDE" });

  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return undefined;
})();
