import type React from "react";
import "@/styles/llm.css";

export default function LLMBlockquote({ className = "", children, ...rest }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className={["border-l-2", "llm-border", "pl-3 my-3", "llm-fg-muted-40", className].join(" ")}
      {...rest}
    >
      {children}
    </blockquote>
  );
}


