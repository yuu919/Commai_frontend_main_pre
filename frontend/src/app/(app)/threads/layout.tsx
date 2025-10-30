// Removed: ThreadsLayout previously duplicated ThreadsRail rendering.
// The ThreadsRail is now solely rendered by app/(app)/layout.tsx.
// This file intentionally keeps a pass-through layout in case of future segment-specific wrappers.
"use client";
import React from "react";

export default function ThreadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


