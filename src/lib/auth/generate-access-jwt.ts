import { GenerateJwtParams, generateJwt } from "./generate-jwt";

export const generateAccessJwt = async ({
  user,
  authSecret,
}: Omit<GenerateJwtParams, "expirationTime">): Promise<string> =>
  generateJwt({ user, authSecret, expirationTime: "15m" });
