import type React from "react";

export function Select({ value, onChange, children, className }: { value?: string; onChange?: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <select
      className={[
        "h-[var(--ui-control-h-md)] px-2 text-sm rounded-[var(--ui-radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
        "disabled:bg-[var(--surface-1-disabled)] disabled:text-[var(--fg-disabled)]",
        className,
      ].filter(Boolean).join(" ")}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {children}
    </select>
  );
}

export default Select;


