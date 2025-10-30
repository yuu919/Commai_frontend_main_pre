import type React from "react";

export default function Text({ className = "", children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-[var(--fg)]", className].join(" ")} {...rest}>{children}</p>;
}


