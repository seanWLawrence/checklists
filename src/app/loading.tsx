import { Heading } from "@/components/heading";

const ButtonSkeleton: React.FC<{}> = () => {
  return (
    <div className="text-zinc-200 bg-zinc-200 border-2 border-zinc-900 rounded-lg py-1 px-2 text-sm animate-pulse duration-1000">
      Checklist
    </div>
  );
};

export default function Loading() {
  return (
    <div className="space-y-2">
      <Heading level={1}>Checklists</Heading>

      <div className="flex flex-wrap space-x-2">
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
