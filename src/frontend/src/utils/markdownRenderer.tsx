import React from "react";

interface MarkdownProps {
  content: string;
  className?: string;
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-vault-bg border border-vault-border rounded-t-lg px-4 py-2">
        <span className="text-xs text-muted-foreground font-mono">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="code-block rounded-t-none rounded-b-lg p-4 overflow-x-auto scrollbar-thin">
        <code className="text-sm">{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="bg-vault-bg border border-vault-border px-1.5 py-0.5 rounded text-xs font-mono text-vault-cyan"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    // Link
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-vault-cyan hover:underline"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }
    // Regular char
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }
  return parts;
}

export function MarkdownContent({ content, className }: MarkdownProps) {
  const nodes: React.ReactNode[] = [];
  let key = 0;

  // Split by triple-backtick code blocks first
  const segments = content.split(/(```(?:[a-z]*)\n?[\s\S]*?```)/g);

  for (const segment of segments) {
    if (segment.startsWith("```")) {
      const langMatch = segment.match(/^```([a-z]*)\n?/);
      const lang = langMatch ? langMatch[1] : "";
      const code = segment
        .replace(/^```[a-z]*\n?/, "")
        .replace(/```$/, "")
        .trim();
      nodes.push(
        <CodeBlock key={key++} code={code} lang={lang || undefined} />,
      );
      continue;
    }

    // Process lines
    const lines = segment.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Heading
      const h3 = line.match(/^### (.+)/);
      if (h3) {
        nodes.push(
          <h3
            key={key++}
            className="text-sm font-semibold text-foreground mt-3 mb-1"
          >
            {renderInline(h3[1])}
          </h3>,
        );
        i++;
        continue;
      }
      const h2 = line.match(/^## (.+)/);
      if (h2) {
        nodes.push(
          <h2
            key={key++}
            className="text-base font-semibold text-foreground mt-4 mb-1"
          >
            {renderInline(h2[1])}
          </h2>,
        );
        i++;
        continue;
      }
      const h1 = line.match(/^# (.+)/);
      if (h1) {
        nodes.push(
          <h1
            key={key++}
            className="text-lg font-bold text-foreground mt-4 mb-2"
          >
            {renderInline(h1[1])}
          </h1>,
        );
        i++;
        continue;
      }

      // List item
      const li = line.match(/^[-*] (.+)/) || line.match(/^\d+\. (.+)/);
      if (li) {
        const listItems: React.ReactNode[] = [];
        while (
          i < lines.length &&
          (lines[i].match(/^[-*] (.+)/) || lines[i].match(/^\d+\. (.+)/))
        ) {
          const m =
            lines[i].match(/^[-*] (.+)/) || lines[i].match(/^\d+\. (.+)/);
          if (m)
            listItems.push(
              <li key={i} className="ml-4 my-0.5">
                {renderInline(m[1])}
              </li>,
            );
          i++;
        }
        nodes.push(
          <ul key={key++} className="list-disc list-inside my-2 space-y-0.5">
            {listItems}
          </ul>,
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Regular paragraph
      nodes.push(
        <p key={key++} className="my-1 leading-relaxed">
          {renderInline(line)}
        </p>,
      );
      i++;
    }
  }

  return <div className={className}>{nodes}</div>;
}
