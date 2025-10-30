import type React from "react";
import "@/styles/llm.css";

export default function LLMParagraph({ className = "", children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={["llm-fg", "leading-7", "my-2", className].join(" ")} {...rest}>
      {children}
    </p>
  );
}


