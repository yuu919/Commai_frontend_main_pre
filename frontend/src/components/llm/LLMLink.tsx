import type React from "react";

export default function LLMLink({ href, children, className = "", ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={["text-[var(--accent)] hover:underline underline-offset-2", className].join(" ")}
      target={isExternal ? "_blank" : rest.target}
      rel={isExternal ? "noopener noreferrer" : rest.rel}
      {...rest}
    >
      {children}
    </a>
  );
}


