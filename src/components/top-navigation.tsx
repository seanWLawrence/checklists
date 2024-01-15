import Link from "next/link";
import { Button } from "./button";

export const TopNavigation: React.FC<{}> = () => {
  return (
    <nav className="py-2 px-5 flex justify-between items-center w-full">
      <Link
        color="foreground"
        href="/checklists"
        className="font-bold text-inherit"
      >
        Checklists
      </Link>

      <div>
        <Link href="/checklists/new">
          <Button variant="ghost" type="button">
            New
          </Button>
        </Link>
      </div>
    </nav>
  );
};
