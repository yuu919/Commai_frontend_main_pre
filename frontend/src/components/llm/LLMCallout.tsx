import type React from "react";

export default function LLMCallout({ variant = "info", className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { variant?: "info"|"success"|"warning"|"error" }) {
  const base = "rounded-[var(--ui-radius-sm)] px-3 py-2 text-sm";
  const vc = variant === "success"
    ? "bg-[var(--surface-success-soft)] text-[var(--fg-success-strong)]"
    : variant === "warning"
      ? "bg-[var(--surface-warn-soft)] text-[var(--fg-warn-strong)]"
      : variant === "error"
        ? "bg-[var(--surface-error-soft)] text-[var(--fg-error-strong)]"
        : "bg-[var(--accent-soft)]";
  return <div className={[base, vc, className].join(" ")} {...rest}>{children}</div>;
}


