import type React from "react";

export default function LLMBlockquote({ className = "", children, ...rest }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className={[
        "border-l-2 border-[var(--border)]",
        "pl-3 my-3",
        "text-[color-mix(in_oklab,var(--fg),transparent_20%)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </blockquote>
  );
}


