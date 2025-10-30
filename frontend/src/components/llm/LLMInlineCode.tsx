import type React from "react";

export default function LLMInlineCode({ className = "", children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={[
        "px-1 py-0.5 rounded-[var(--ui-radius-xs)]",
        "bg-[var(--surface-2-active)]",
        "text-[var(--fg)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </code>
  );
}


