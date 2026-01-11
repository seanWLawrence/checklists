import { Heading } from "@/components/heading";

export default function Loading() {
  return (
    <div className="space-y-2">
      <Heading level={1}>Journals</Heading>

      <p className="text-zinc-600 dark:text-zinc-300">Loading journals...</p>
    </div>
  );
}
