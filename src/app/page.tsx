import Link from "next/link";

import { Button } from "@/components/button";

const Home: React.FC = () => {
  return (
    <main className="flex space-x-1">
      <Link href="/checklists-legacy">
        <Button variant="outline" className="mr-2 mb-2">
          Checklists
        </Button>
      </Link>

      <Link href="/journals">
        <Button variant="outline" className="mr-2 mb-2">
          Journals
        </Button>
      </Link>
    </main>
  );
};

export default Home;
