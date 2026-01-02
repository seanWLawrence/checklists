import Link from "next/link";

import { Button } from "@/components/button";
import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

const Home: React.FC = async () => {
  const userMaybe = await getUser({});

  if (userMaybe.isNothing()) {
    redirect("/login");
  }

  return (
    <main className="flex flex-wrap mr-1">
      <Link href="/checklists">
        <Button variant="outline" className="mr-2 mb-2">
          Checklists
        </Button>
      </Link>

      <Link href="/journals">
        <Button variant="outline" className="mr-2 mb-2">
          Journals
        </Button>
      </Link>

      <Link href="/notes">
        <Button variant="outline" className="mr-2 mb-2">
          Notes
        </Button>
      </Link>
    </main>
  );
};

export default Home;
