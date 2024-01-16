import Link from "next/link";

import { Button } from "./button";
import { getUser, logout } from "@/lib/auth.model";
import { MenuButton } from "./menu-button";

export const TopNavigation: React.FC<{}> = async () => {
  const user = getUser();

  return (
    <nav className="py-2 px-5 flex space-x-1 items-center w-full">
      <Link
        color="foreground"
        href="/checklists"
        className="font-bold text-inherit"
      >
        Checklists
      </Link>

      {user && (
        <MenuButton
          menu={
            <div className="flex flex-col space-y-2">
              <Link href="/checklists/new">
                <Button variant="ghost" type="button">
                  New
                </Button>
              </Link>

              <form action={logout}>
                <Button variant="ghost">Sign out</Button>
              </form>
            </div>
          }
        ></MenuButton>
      )}
    </nav>
  );
};
