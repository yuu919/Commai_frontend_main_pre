"use client";
import React, { useState } from "react";
import { RowMenu, Button } from "@ui";

export default function ThreadsRowMenu({ onRename, onMove, onDelete }: {
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="px-2 py-1 text-xs"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        …
      </Button>
      <RowMenu open={open} onClose={() => setOpen(false)}>
        <div className="p-1 space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { setOpen(false); onRename(); }}>名前を変更</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { setOpen(false); onMove(); }}>プロジェクトへ移動</Button>
          <Button variant="danger" size="sm" className="w-full justify-start text-xs" onClick={() => { setOpen(false); onDelete(); }}>削除</Button>
        </div>
      </RowMenu>
    </div>
  );
}
