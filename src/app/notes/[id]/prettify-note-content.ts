import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItTaskLists from "markdown-it-task-lists";
import { markdownItTable } from "markdown-it-table";
import markdownItTableOfContents from "markdown-it-table-of-contents";
import markdownItHighlightJs from "markdown-it-highlightjs";

export const prettifyNoteContent = ({
  content,
  markdownItFn = markdownIt,
}: {
  content: string;
  markdownItFn?: typeof markdownIt;
}): string => {
  try {
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
  } catch (error) {
    console.log(error.toString());
    return "";
  }
};
