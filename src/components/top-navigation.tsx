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
        <Button variant="ghost" type="button">
          <Link href="/checklists/new">New</Link>
        </Button>
      </div>
    </nav>
  );
};
