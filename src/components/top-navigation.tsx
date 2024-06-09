import Link from "next/link";

import { Button } from "./button";
import { getUser, logout } from "@/app/login/auth.model";
import { MenuButton } from "./menu-button";

export const TopNavigation: React.FC<{}> = async () => {
  const user = getUser();

  const now = new Date();
  const defaultJournalAnalyticsSince = `2020-01-01to${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <nav className="py-2 px-5 flex space-x-1 items-center w-full">
      <Link href="/" className="font-bold text-inherit">
        App
      </Link>

      {user && (
        <MenuButton
          menu={
            <div className="flex flex-col space-y-2">
              <Link href="/checklists">
                <Button variant="ghost" type="button">
                  Checklists
                </Button>
              </Link>

              <Link href="/checklists/new">
                <Button variant="ghost" type="button">
                  New checklist
                </Button>
              </Link>

              <Link href="/journals">
                <Button variant="ghost" type="button">
                  Journals
                </Button>
              </Link>

              <Link href="/journals/new">
                <Button variant="ghost" type="button">
                  New journal
                </Button>
              </Link>

              <Link
                href={`/journals/analytics/${defaultJournalAnalyticsSince}`}
              >
                <Button variant="ghost" type="button">
                  Journal analytics
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
