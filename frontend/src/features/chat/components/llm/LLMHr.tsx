import type React from "react";
import "@/styles/llm.css";

export default function LLMHr({ className = "", ...rest }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={["border-t", "llm-border", "my-3", className].join(" ")} {...rest} />;
}


