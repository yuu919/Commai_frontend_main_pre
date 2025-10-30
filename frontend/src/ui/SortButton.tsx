import React from "react";

export function SortButton({ label, direction = "desc", onToggle, disabled }: { label: string; direction?: "asc" | "desc"; onToggle?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="inline-flex items-center h-7 px-2 rounded-[var(--ui-radius-sm)] border border-[var(--border)] text-xs bg-[var(--surface-1)] hover:bg-[var(--surface-2-hover)] active:bg-[var(--surface-2-active)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:bg-[var(--surface-1-disabled)] disabled:text-[var(--fg-disabled)] disabled:cursor-not-allowed"
    >
      <span className="mr-1">{label}</span>
      <span aria-hidden>{direction === "asc" ? "▲" : "▼"}</span>
    </button>
  );
}


