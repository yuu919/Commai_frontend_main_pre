import type React from "react";

export function FilterChip({ active, pressed, children, onClick, className, style }: { active?: boolean; pressed?: boolean; children: React.ReactNode; onClick?: () => void; className?: string; style?: React.CSSProperties }) {
  const isActive = typeof pressed === "boolean" ? pressed : !!active;
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items中心 h-7 px-2 rounded-full border text-xs",
        isActive
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]"
          : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2-hover)] text-[var(--fg-muted)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
        className || "",
      ].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </button>
  );
}

export default FilterChip;


