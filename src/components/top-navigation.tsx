import Link from "next/link";

import { LinkButton } from "./link-button";
import { MenuButton } from "./menu-button";
import { SubmitButton } from "./submit-button";
import { getUser } from "@/lib/auth/get-user";
import { logoutAction } from "./actions/logout.action";
import { JournalAnalyticsLink } from "./journal-analytics-link";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { ThemeToggleButton } from "./theme-toggle-button.client";

const TopNavigation: React.FC<{ getUserFn?: typeof getUser }> = async ({
  getUserFn = getUser,
}) => {
  const userMaybe = await getUserFn({});
  const canAccessAdmin = userMaybe
    .map((user) => isAdminUsername(user.username))
    .orDefault(false);

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
                <LinkButton href="/checklists" variant="ghost">
                  Checklists
                </LinkButton>

                <span>/</span>

                <LinkButton href="/checklists/new" variant="ghost">
                  New checklist
                </LinkButton>
              </div>

              <div className="flex space-x-1 items-center">
                <LinkButton href="/journals" variant="ghost">
                  Journals
                </LinkButton>

                <span>/</span>

                <LinkButton href="/journals/new" variant="ghost">
                  New journal
                </LinkButton>

                <span>/</span>

                <JournalAnalyticsLink />
              </div>

              <div className="flex space-x-1 items-center">
                <LinkButton href="/notes" variant="ghost">
                  Notes
                </LinkButton>

                <span>/</span>

                <LinkButton href="/notes/new" variant="ghost">
                  New note
                </LinkButton>
              </div>

              <div className="flex space-x-1 items-center">
                <LinkButton href="/user-credential-generator" variant="ghost">
                  Generate credentials
                </LinkButton>

                {canAccessAdmin && (
                  <>
                    <span>/</span>
                    <LinkButton href="/admin/debug" variant="ghost">
                      Debug
                    </LinkButton>
                  </>
                )}
              </div>

              <ThemeToggleButton />

              <form action={logoutAction}>
                <SubmitButton variant="ghost">Sign out</SubmitButton>
              </form>
            </div>
          }
        ></MenuButton>
      )}
    </nav>
  );
};

export default TopNavigation;
