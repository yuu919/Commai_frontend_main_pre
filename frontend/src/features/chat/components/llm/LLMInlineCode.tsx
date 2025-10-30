import type React from "react";
import "@/styles/llm.css";

export default function LLMInlineCode({ className = "", children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={["px-1 py-0.5", "rounded-ui-xs", "bg-surface-2-active", "llm-fg", className].join(" ")}
      {...rest}
    >
      {children}
    </code>
  );
}


