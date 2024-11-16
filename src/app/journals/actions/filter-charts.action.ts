"use server";

import { redirect } from "next/navigation";

export const filterChartsAction = async (formData: FormData) => {
  const since = formData.get("since");

  redirect(`/journals/analytics/${since}`);
};
