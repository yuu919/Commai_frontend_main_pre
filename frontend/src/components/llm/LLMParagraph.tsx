import type React from "react";

export default function LLMParagraph({ className = "", children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={["text-[var(--fg)]", "leading-7", "my-2", className].join(" ")} {...rest}>
      {children}
    </p>
  );
}


