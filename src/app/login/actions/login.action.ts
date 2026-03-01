"use server";

import "@nobush/server-only";
import { login } from "@/lib/auth/login";

export const loginAction = async (formData: FormData): Promise<void> => {
  await login({ formData });
};
