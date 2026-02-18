type Section = {
  heading: string;
  lines: string[];
};

type ParsedContent = {
  leadingLines: string[];
  sections: Section[];
};

const parseContent = (content: string): ParsedContent => {
  const leadingLines: string[] = [];
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  const rows = content.split(/\r?\n/);

  for (const row of rows) {
    const line = row.trim();
    if (line.length === 0) {
      continue;
    }

    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      if (heading.length === 0) {
        continue;
      }

      const existingSection = sections.find((section) => section.heading === heading);
      if (existingSection) {
        currentSection = existingSection;
      } else {
        currentSection = { heading, lines: [] };
        sections.push(currentSection);
      }

      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
      continue;
    }

    leadingLines.push(line);
  }

  return { leadingLines, sections };
};

const formatContent = ({ leadingLines, sections }: ParsedContent): string => {
  const lines: string[] = [];

  if (leadingLines.length > 0) {
    lines.push(...leadingLines);
  }

  for (const section of sections) {
    if (lines.length > 0) {
      lines.push("");
    }

    lines.push(`## ${section.heading}`);
    lines.push(...section.lines);
  }

  return lines.join("\n").trim();
};

export const mergeJournalContentByHeading = ({
  current,
  incoming,
}: {
  current: string;
  incoming: string;
}): string => {
  const incomingTrimmed = incoming.trim();
  if (!incomingTrimmed) {
    return current;
  }

  const parsedIncoming = parseContent(incomingTrimmed);
  const hasIncomingHeadings = parsedIncoming.sections.length > 0;

  if (!hasIncomingHeadings) {
    return current.trim() ? `${current.trim()}\n\n${incomingTrimmed}` : incomingTrimmed;
  }

  const parsedCurrent = parseContent(current.trim());

  if (parsedIncoming.leadingLines.length > 0) {
    parsedCurrent.leadingLines.push(...parsedIncoming.leadingLines);
  }

  for (const incomingSection of parsedIncoming.sections) {
    const existing = parsedCurrent.sections.find(
      (section) => section.heading === incomingSection.heading,
    );

    if (existing) {
      existing.lines.push(...incomingSection.lines);
      continue;
    }

    parsedCurrent.sections.push({
      heading: incomingSection.heading,
      lines: [...incomingSection.lines],
    });
  }

  return formatContent(parsedCurrent);
};
