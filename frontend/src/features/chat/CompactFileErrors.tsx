"use client";

import React from "react";
import { MutedText, Button } from "@ui";

export default function CompactFileErrors({ errors, onClear }: { errors: string[]; onClear?: () => void }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="max-w-3xl mx-auto mb-2 text-xs">
      <ul className="list-disc pl-5 space-y-1">
        {errors.map((e, i) => (
          <li key={i}><MutedText variant="error">{e}</MutedText></li>
        ))}
      </ul>
      {onClear && (
        <div className="mt-1"><Button variant="ghost" size="sm" onClick={onClear}>閉じる</Button></div>
      )}
    </div>
  );
}


