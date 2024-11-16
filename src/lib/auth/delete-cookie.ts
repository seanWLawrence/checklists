import { cookies } from "next/headers";

export const deleteCookie = async ({
  name,
}: {
  name: string;
}): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.delete(name);
};
