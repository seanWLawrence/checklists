import { Key } from "../types";

export const getRefreshTokenKey = ({ token }: { token: string }): Key =>
  `refreshToken#${token}`;
