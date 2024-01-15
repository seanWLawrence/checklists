import { ChecklistList } from "./checklist-list";

export const revalidate = 0;

const Checklists: React.FC<{}> = () => {
  return (
    <main>
      <ChecklistList />
    </main>
  );
};

export default Checklists;
