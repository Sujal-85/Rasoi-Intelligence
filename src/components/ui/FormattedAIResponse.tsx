import React from "react";

interface FormattedAIResponseProps {
  text: string;
}

export function FormattedAIResponse({ text }: FormattedAIResponseProps) {
  if (!text) return null;

  // Split text by lines
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: "bullet" | "number" | null = null;
  let listKey = 0;

  // Helper to parse inline bolding
  const parseInlineStyles = (content: string) => {
    // Regex for bold text: **text**
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const innerText = part.slice(2, -2);
        return (
          <strong key={idx} className="text-gold font-bold font-sans">
            {innerText}
          </strong>
        );
      }
      return part;
    });
  };

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === "bullet") {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc pl-5 my-2.5 space-y-1.5 text-muted-foreground">
            {currentList}
          </ul>
        );
      } else if (listType === "number") {
        elements.push(
          <ol key={`list-${listKey++}`} className="list-decimal pl-5 my-2.5 space-y-1.5 text-muted-foreground">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Horizontal Rule
    if (trimmed === "---") {
      flushList();
      elements.push(<div key={`hr-${index}`} className="my-4 border-t border-border/40" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("#")) {
      flushList();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];
        const parsed = parseInlineStyles(headingText);

        if (level === 1) {
          elements.push(
            <h1 key={`h-${index}`} className="text-2xl font-bold font-display text-foreground mt-4 mb-2 tracking-tight">
              {parsed}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h-${index}`} className="text-xl font-bold font-display text-foreground mt-4 mb-2 tracking-tight border-b border-border/20 pb-1">
              {parsed}
            </h2>
          );
        } else {
          elements.push(
            <h3 key={`h-${index}`} className="text-base font-bold font-display text-gold mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0 animate-pulse" />
              {parsed}
            </h3>
          );
        }
        return;
      }
    }

    // Bullet Items (* or -)
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (listType !== "bullet") {
        flushList();
        listType = "bullet";
      }
      const content = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed pl-1 text-sm text-foreground/90">
          {parseInlineStyles(content)}
        </li>
      );
      return;
    }

    // Numbered Items (e.g. 1.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (listType !== "number") {
        flushList();
        listType = "number";
      }
      const content = numMatch[2];
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed pl-1 text-sm text-foreground/90">
          {parseInlineStyles(content)}
        </li>
      );
      return;
    }

    // Blank lines
    if (!trimmed) {
      flushList();
      return;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className="text-sm leading-relaxed text-foreground/90 my-2 text-justify md:text-left">
        {parseInlineStyles(line)}
      </p>
    );
  });

  // Flush any remaining list
  flushList();

  return <div className="space-y-1 font-sans">{elements}</div>;
}
