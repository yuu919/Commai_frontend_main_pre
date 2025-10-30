import React from "react";
import Surface from "@ui/Surface";

export default function ActionListItem({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Surface
      interactive
      radius="sm"
      onClick={onClick}
      role="button"
      className="w-full px-2 py-2 cursor-pointer"
    >
      <div className="text-xs font-medium truncate">{label}</div>
    </Surface>
  );
}


