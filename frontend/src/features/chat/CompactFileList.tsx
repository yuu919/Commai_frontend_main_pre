"use client";

import React from "react";
import { Button, MutedText, Surface } from "@ui";
import type { SelectedFile } from "./hooks/useFileUpload";

export default function CompactFileList({ files, onRemove }: {
  files: SelectedFile[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className="px-2 py-1 text-xs flex gap-2 flex-wrap">
      {files.map((sf, i) => (
        <Surface key={i} variant="secondary" bordered radius="xs" className="inline-flex items-center gap-1 px-2 py-1">
          <span className="truncate max-w-[180px]" title={sf.file.name}><MutedText level={40}>{sf.file.name}</MutedText></span>
          <Button size="sm" variant="ghost" onClick={() => onRemove(i)}>×</Button>
        </Surface>
      ))}
    </div>
  );
}


