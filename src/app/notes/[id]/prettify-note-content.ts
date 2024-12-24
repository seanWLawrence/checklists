import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import { markdownItTable } from "markdown-it-table";
import markdownItHighlightJs from "markdown-it-highlightjs";
// @ts-expect-error no type definitions
import markdownItTaskLists from "markdown-it-task-lists";
// @ts-expect-error no type definitions
import markdownItTableOfContents from "markdown-it-table-of-contents";

export const prettifyNoteContent = ({
  content,
  markdownItFn = markdownIt,
}: {
  content: string;
  markdownItFn?: typeof markdownIt;
}): string => {
  const md = markdownItFn({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  })
    .use(markdownItAnchor)
    .use(markdownItTaskLists)
    .use(markdownItTable)
    .use(markdownItTableOfContents)
    .use(markdownItHighlightJs);

  return md.render(content);
};
