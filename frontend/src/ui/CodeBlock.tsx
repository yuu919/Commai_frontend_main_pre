"use client";
import React from "react";

export default function CodeBlock({ language, text, showHeader = true, children }: { language?: string; text?: string; showHeader?: boolean; children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false);
  if (!showHeader) {
    return (
      <pre className="m-0 my-2 p-0 bg-[var(--surface-1)] overflow-auto border border-[var(--border)] rounded-[var(--ui-radius-sm)]">
        <code className="block p-3">{children}</code>
      </pre>
    );
  }
  return (
    <div className="my-2 rounded-[var(--ui-radius-sm)] overflow-hidden border border-[var(--border)]">
      <div className="flex items-center justify-between px-3 py-1 text-[10px] bg-[var(--surface-2-active)]">
        <span className="font-mono text-[var(--fg-muted)] truncate">{language || ""}</span>
        <button
          className="px-2 py-0.5 rounded-[var(--ui-radius-xs)] text-[var(--fg-muted-40)] hover:bg-[var(--surface-2-hover)]"
          onClick={() => {
            if (typeof navigator !== "undefined" && text) {
              navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }
          }}
        >{copied ? "コピー済" : "コピー"}</button>
      </div>
      <pre className="m-0 p-0 bg-[var(--surface-1)] overflow-auto">
        <code className="block p-3">{children}</code>
      </pre>
    </div>
  );
}


