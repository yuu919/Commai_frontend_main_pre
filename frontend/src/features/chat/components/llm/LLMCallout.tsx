import type React from "react";
import "@/styles/llm.css";

export default function LLMCallout({ variant = "info", className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { variant?: "info"|"success"|"warning"|"error" }) {
  const base = "rounded-ui-sm px-3 py-2 text-sm";
  const vc = variant === "success"
    ? "bg-surface-success-soft text-fg-success-strong"
    : variant === "warning"
      ? "bg-surface-warn-soft text-fg-warn-strong"
      : variant === "error"
        ? "bg-surface-error-soft text-fg-error-strong"
        : "bg-accent-soft";
  return <div className={[base, vc, className].join(" ")} {...rest}>{children}</div>;
}


