export type AppEnvironment = "dev" | "prod";

export const getAppEnvironment = (): AppEnvironment => {
  return process.env.NODE_ENV === "production" ? "prod" : "dev";
};

export const isProduction = () => getAppEnvironment() === "prod";

// Back-compat alias; prefer isProduction.
export const isAppProduction = isProduction;
