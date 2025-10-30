"use client";
import React, { useState, useEffect } from "react";
import { Button, Modal, Input } from "@ui";

export default function RenameThreadDialog({
  open,
  initialTitle,
  onConfirm,
  onClose,
}: {
  open: boolean;
  initialTitle: string;
  onConfirm: (title: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  useEffect(() => {
    if (open) setTitle(initialTitle);
  }, [open, initialTitle]);
  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="p-4">
        <div className="text-sm mb-2">スレッド名を変更</div>
        <Input value={title} onChange={(e) => setTitle(e.currentTarget.value)} size="md" />
        <div className="flex gap-2 justify-end mt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>キャンセル</Button>
          <Button size="sm" onClick={() => onConfirm(title.trim())} disabled={!title.trim()}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}


