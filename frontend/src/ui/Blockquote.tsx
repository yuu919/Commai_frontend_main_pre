import type React from "react";

export default function Blockquote({ className = "", children, ...rest }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote className={["border-l-2 border-[var(--border)] pl-3 my-3", className].join(" ")} {...rest}>
      {children}
    </blockquote>
  );
}


