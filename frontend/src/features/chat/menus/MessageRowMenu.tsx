"use client";

import React, { useState } from "react";
import { RowMenu, Button, Divider } from "@ui";

export default function MessageRowMenu({
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  canRegenerate,
}: {
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="メニュー"
      >…</Button>
      <RowMenu open={open} onClose={() => setOpen(false)} align="right">
        <div className="p-1">
          <Button size="sm" variant="ghost" className="w-full text-left" onClick={() => { setOpen(false); onCopy(); }} role="menuitem">コピー</Button>
          <Button size="sm" variant="ghost" className="w-full text-left" onClick={() => { setOpen(false); onEdit(); }} role="menuitem">編集</Button>
          <Button size="sm" variant="danger" className="w-full text-left" onClick={() => { setOpen(false); onDelete(); }} role="menuitem">削除</Button>
          <Divider className="my-1" />
          <Button size="sm" variant="ghost" className="w-full text-left disabled:opacity-50" onClick={() => { setOpen(false); if (canRegenerate) onRegenerate(); }} disabled={!canRegenerate} role="menuitem">再生成</Button>
        </div>
      </RowMenu>
    </div>
  );
}


