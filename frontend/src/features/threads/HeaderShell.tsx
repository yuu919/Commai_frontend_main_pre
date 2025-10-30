import React from "react";
import Surface from "@ui/Surface";

export default function HeaderShell({ children }: { children?: React.ReactNode }) {
  return (
    <Surface variant="panel" className="px-2 py-1 border-b text-xs">
      {children}
    </Surface>
  );
}


