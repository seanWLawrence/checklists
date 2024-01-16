import { Heading } from "@/components/heading";

export default function Loading() {
  return (
    <div className="mt-4 space-y-4 max-w-prose">
      <div className="space-y-7">
        <Heading level={1}>Checklist</Heading>

        <div className="space-y-2 p-5 w-full max-w-prose border-2 border-zinc-900 rounded-lg animate-pulse duration-1000">
          <div className="h-10 w-full max-w-prose bg-zinc-50 border-2 border-zinc-900 rounded-lg animate-pulse duration-1000"></div>
          <div className="h-10 w-full max-w-prose bg-zinc-50 border-2 border-zinc-900 rounded-lg animate-pulse duration-1000"></div>
          <div className="h-10 w-full max-w-prose bg-zinc-50 border-2 border-zinc-900 rounded-lg animate-pulse duration-1000"></div>
        </div>
      </div>
    </div>
  );
}
