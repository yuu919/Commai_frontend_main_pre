import type React from "react";
import CodeBlock from "@ui/CodeBlock";

export default function LLMCodeBlock({ language, text, children, showHeader = true }: { language?: string; text: string; children?: React.ReactNode; showHeader?: boolean }) {
  return <CodeBlock language={language} text={text} showHeader={showHeader}>{children}</CodeBlock>;
}


