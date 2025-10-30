import type React from "react";

export default function LLMHr({ className = "", ...rest }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={["border-t border-[var(--border)] my-3", className].join(" ")} {...rest} />;
}


