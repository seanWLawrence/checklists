export const isProduction = () => process.env.NODE_ENV === "production";

export type AppEnvironment = "dev" | "prod";

export const getAppEnvironment = (): AppEnvironment => {
  return process.env.APP_ENV === "prod" ? "prod" : "dev";
};

export const isAppProduction = () => getAppEnvironment() === "prod";
