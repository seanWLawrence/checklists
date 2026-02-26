export const NEXT_PUBLIC_THEME_OVERRIDE = (() => {
  const value = process.env.NEXT_PUBLIC_THEME_OVERRIDE;

  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return undefined;
})();
