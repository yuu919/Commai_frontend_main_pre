import type React from "react";

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={["h-1.5 rounded bg-[var(--chat-upload-track)]", className].join(" ")} aria-hidden>
      <div className="h-1.5 rounded bg-[var(--chat-upload-bar)]" style={{ width: `${pct.toFixed(0)}%` }} />
    </div>
  );
}


