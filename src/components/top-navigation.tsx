import Link from "next/link";

import { Button } from "./button";
import { MenuButton } from "./menu-button";
import { getUser } from "@/lib/auth/get-user";
import { logoutAction } from "./actions/logout.action";
import { CreatedAtLocal } from "@/app/journals/journal.types";

const TopNavigation: React.FC<{ getUserFn?: typeof getUser }> = async ({
  getUserFn = getUser,
}) => {
  const userMaybe = await getUserFn({});

  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(now.getMonth() - 1);

  /**
   * Using unsafeDecode since the inputs are fully controlled
   */
  const defaultJournalAnalyticsSince = `${CreatedAtLocal.unsafeDecode(oneMonthAgo)}to${CreatedAtLocal.unsafeDecode(now)}`;

  return (
    <nav className="py-2 px-5 flex space-x-1 items-center w-full">
      <Link href="/" className="font-bold text-inherit">
        App
      </Link>

      {userMaybe.isJust() && (
        <MenuButton
          menu={
            <div
              className="flex flex-col space-y-2"
              data-testid="top-navigation-links"
            >
              <div className="flex space-x-1 items-center">
                <Link href="/checklists">
                  <Button variant="ghost" type="button">
                    Checklists
                  </Button>
                </Link>

                <span>/</span>

                <Link href="/checklists/new">
                  <Button variant="ghost" type="button">
                    New checklist
                  </Button>
                </Link>
              </div>

              <div className="flex space-x-1 items-center">
                <Link href="/journals">
                  <Button variant="ghost" type="button">
                    Journals
                  </Button>
                </Link>

                <span>/</span>

                <Link href="/journals/new">
                  <Button variant="ghost" type="button">
                    New journal
                  </Button>
                </Link>

                <span>/</span>

                <Link
                  href={`/journals/analytics/${defaultJournalAnalyticsSince}`}
                >
                  <Button variant="ghost" type="button">
                    Analytics
                  </Button>
                </Link>
              </div>

              <div className="flex space-x-1 items-center">
                <Link href="/notes">
                  <Button variant="ghost" type="button">
                    Notes
                  </Button>
                </Link>

                <span>/</span>

                <Link href="/notes/new">
                  <Button variant="ghost" type="button">
                    New note
                  </Button>
                </Link>
              </div>

              <Link href="/user-credential-generator">
                <Button variant="ghost" type="button">
                  Generate credentials
                </Button>
              </Link>

              <form action={logoutAction}>
                <Button variant="ghost">Sign out</Button>
              </form>
            </div>
          }
        ></MenuButton>
      )}
    </nav>
  );
};

export default TopNavigation;
