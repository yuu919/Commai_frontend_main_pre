import React, { useMemo, useState } from "react";
import { CodeBlock } from "@ui";
import LLMHeading from "./llm/LLMHeading";
import LLMParagraph from "./llm/LLMParagraph";
import LLMBlockquote from "./llm/LLMBlockquote";
import LLMList from "./llm/LLMList";
import LLMHr from "./llm/LLMHr";
import LLMInlineCode from "./llm/LLMInlineCode";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import LLMLink from "./llm/LLMLink";
import LLMImage from "./llm/LLMImage";
import LLMTable from "./llm/LLMTable";

export default function MarkdownRenderer({ content, showCodeHeader = true }: { content: string; showCodeHeader?: boolean }) {
  const [copied, setCopied] = useState(false);

  function extractText(node: any): string {
    if (node == null) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (React.isValidElement(node)) return extractText((node as any).props?.children);
    return String(node ?? "");
  }

  const components = useMemo(() => ({
    h1({ children }: any) { return <LLMHeading level={1}>{children}</LLMHeading>; },
    h2({ children }: any) { return <LLMHeading level={2}>{children}</LLMHeading>; },
    h3({ children }: any) { return <LLMHeading level={3}>{children}</LLMHeading>; },
    h4({ children }: any) { return <LLMHeading level={4}>{children}</LLMHeading>; },
    h5({ children }: any) { return <LLMHeading level={5}>{children}</LLMHeading>; },
    h6({ children }: any) { return <LLMHeading level={6}>{children}</LLMHeading>; },
    p({ children }: any) { return <LLMParagraph>{children}</LLMParagraph>; },
    blockquote({ children }: any) { return <LLMBlockquote>{children}</LLMBlockquote>; },
    ul({ children }: any) { return <LLMList>{children}</LLMList>; },
    ol({ children }: any) { return <LLMList ordered>{children}</LLMList>; },
    hr() { return <LLMHr />; },
    // Inline codeは<p>内にも出現するため、<code>のみを返す
    code({ inline, className, children, ...props }: any) {
      if (inline) return <LLMInlineCode {...props}>{children}</LLMInlineCode>;
      return <code className={className}>{children}</code>;
    },
    a({ href, children, ...rest }: any) { return <LLMLink href={href} {...rest}>{children}</LLMLink>; },
    img() { return <LLMImage />; },
    // ブロックコード用のpreラッパ（ヘッダ＋コピー）
    pre({ children }: any) {
      const child = Array.isArray(children) ? children[0] : children;
      const className = child?.props?.className || "";
      const m = /language-(\w+)/.exec(className);
      const lang = m?.[1];
      const text = extractText(child?.props?.children ?? "");
      // 言語が markdown/md の場合は、コード扱いせず再度Markdownとして解釈
      if (typeof lang === "string" && ["markdown", "md"].includes(lang.toLowerCase())) {
        return (
          <div className="my-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight as any]}>
              {text}
            </ReactMarkdown>
          </div>
        );
      }
      return <CodeBlock language={lang} text={text} showHeader={showCodeHeader}>{child?.props?.children}</CodeBlock>;
    },
    table({ children, node }: any) {
      function textFromHast(h: any): string {
        if (!h) return "";
        if (typeof h === "string") return h;
        if (Array.isArray(h)) return h.map(textFromHast).join("");
        if (h.type === "text") return String(h.value ?? "");
        if (h.children) return textFromHast(h.children);
        return "";
      }
      function extractRowsFromHast(tableNode: any): string[][] {
        const rows: string[][] = [];
        const sections = (tableNode.children || []).filter((c: any) => c.type === "element" && ["thead", "tbody", "tfoot"].includes(c.tagName));
        sections.forEach((sec: any) => {
          (sec.children || []).forEach((tr: any) => {
            if (!(tr.type === "element" && tr.tagName === "tr")) return;
            const cells = (tr.children || []).filter((c: any) => c.type === "element" && (c.tagName === "th" || c.tagName === "td"));
            const row = cells.map((cell: any) => textFromHast(cell.children || []));
            if (row.length > 0) rows.push(row);
          });
        });
        return rows;
      }
      function buildMarkdown(rows: string[][]): string {
        if (rows.length === 0) return "";
        const header = rows[0];
        const separator = header.map(() => "---");
        const body = rows.slice(1);
        const line = (cols: string[]) => `| ${cols.join(" | ")} |`;
        const lines = [line(header), line(separator), ...body.map(line)];
        return lines.join("\n");
      }
      const rows = extractRowsFromHast(node);
      const md = buildMarkdown(rows);
      return <LLMTable copyMarkdown={md}><table>{children}</table></LLMTable>;
    },
  }), [copied, showCodeHeader]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight as any]} components={components as any}>
      {String(content ?? "")}
    </ReactMarkdown>
  );
}


