"use client";

import React from "react";
import { Card, Button } from "@ui";

export default function PredictionView({
  open,
  suggestions,
  onPick,
}: {
  open: boolean;
  suggestions: string[];
  onPick: (value: string) => void;
}) {
  if (!open || suggestions.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 bottom-[42px] max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <ul className="max-h-56 overflow-auto text-sm">
          {suggestions.map((s, i) => (
            <li key={i}>
              <Button variant="ghost" className="w-full justify-start px-3 py-2" onClick={() => onPick(s)}>
                {s}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}


