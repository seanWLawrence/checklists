import { LinkButton } from "@/components/link-button";
import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

const Home: React.FC = async () => {
  const userMaybe = await getUser({});

  if (userMaybe.isNothing()) {
    redirect("/login");
  }

  return (
    <main className="flex flex-wrap mr-1">
      <LinkButton href="/checklists" variant="outline" className="mr-2 mb-2">
        Checklists
      </LinkButton>

      <LinkButton href="/journals" variant="outline" className="mr-2 mb-2">
        Journals
      </LinkButton>

      <LinkButton href="/notes" variant="outline" className="mr-2 mb-2">
        Notes
      </LinkButton>
    </main>
  );
};

export default Home;
