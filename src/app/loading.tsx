import { Heading } from "@/components/heading";

const ButtonSkeleton: React.FC = () => {
  return (
    <div className="text-zinc-200 bg-zinc-200 border-2 border-zinc-900 rounded-lg py-1 px-2 text-sm animate-pulse duration-1000 mr-2 mb-2 dark:text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 w-20 h-8"></div>
  );
};

export default function Loading() {
  return (
    <div className="space-y-2">
      <Heading level={1}>Checklists</Heading>

      <div className="flex flex-wrap">
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
}
