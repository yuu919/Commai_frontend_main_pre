import React from "react";
import { MutedText, Surface } from "@ui";

type Props = {
  status: string;
  message?: string;
  metadata?: { completed?: number; total?: number } | Record<string, any> | null;
};

export default function ThinkingProcessDisplay({ status, message, metadata }: Props) {
  const completed = typeof (metadata as any)?.completed === "number" ? Number((metadata as any).completed) : undefined;
  const total = typeof (metadata as any)?.total === "number" ? Math.max(1, Number((metadata as any).total)) : undefined;
  const pct = completed !== undefined && total !== undefined ? Math.floor((completed / total) * 100) : undefined;
  return (
    <Surface variant="secondary" bordered radius="xs" className="inline-flex items-center gap-2 px-2 py-1">
      <MutedText level={40}>{status}</MutedText>
      {message && <MutedText level={50}>{message}</MutedText>}
      {pct !== undefined && (
        <span className="ml-1"><MutedText level={50}>{completed}/{total} ({pct}%)</MutedText></span>
      )}
    </Surface>
  );
}


