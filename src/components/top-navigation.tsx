import Link from "next/link";

import { Button } from "./button";
import { getUser, logout } from "@/lib/auth.model";

export const TopNavigation: React.FC<{}> = async () => {
  const user = getUser();

  return (
    <nav className="py-2 px-5 flex justify-between items-center w-full">
      <Link
        color="foreground"
        href="/checklists"
        className="font-bold text-inherit"
      >
        Checklists
      </Link>

      {user && (
        <div className="flex space-x-2">
          <Link href="/checklists/new">
            <Button variant="ghost" type="button">
              New
            </Button>
          </Link>

          <form action={logout}>
            <Button variant="outline">Sign out</Button>
          </form>
        </div>
      )}
    </nav>
  );
};
