import React from "react";

type Level = 30 | 40 | 50; // 30=--fg-muted, 40=--fg-muted-40, 50=--fg-muted-50
type Variant = "default" | "error" | "success" | "warn";

export const MutedText: React.FC<React.HTMLAttributes<HTMLSpanElement> & { level?: Level; variant?: Variant }> = ({ className = "", level = 30, variant = "default", ...props }) => {
  const levelClass = level === 50 ? "text-[var(--fg-muted-50)]" : level === 40 ? "text-[var(--fg-muted-40)]" : "text-[var(--fg-muted)]";
  const variantClass = variant === "error" ? "text-[var(--fg-error-soft)]" : variant === "success" ? "text-[var(--fg-success-strong)]" : variant === "warn" ? "text-[var(--fg-warn-strong)]" : "";
  return <span className={[levelClass, variantClass, className].filter(Boolean).join(" ")} {...props} />;
};

export default MutedText;


