import "server-only";
import { logger } from "../logger";
import { GenerateJwtParams, generateJwt } from "./generate-jwt";

export const generateAccessJwt = async ({
  user,
  authSecret,
}: Omit<GenerateJwtParams, "expirationTime">): Promise<string> => {
  logger.debug("Generating access jwt");

  return generateJwt({ user, authSecret, expirationTime: "15m" });
};
