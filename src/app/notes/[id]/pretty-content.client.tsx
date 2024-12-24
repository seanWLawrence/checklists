import { prettifyNoteContent } from "./prettify-note-content";

export const PrettyContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div
      className="prose prose-sm prose-h1:font-bold prose-h1:text-xl prose-h2:font-bold prose-h2:text-xl prose-h3:font-semibold prose-h3:text-sm prose-h4:font-semibold prose-h4:text-sm prose-p:text-sm prose-p:text-zinc-700 prose-pre:bg-transparent prose-pre:p-0 prose-code:bg-transparent prose-code:p-0 prose-code:rounded-md"
      dangerouslySetInnerHTML={{
        __html: prettifyNoteContent({ content }),
      }}
    ></div>
  );
};
