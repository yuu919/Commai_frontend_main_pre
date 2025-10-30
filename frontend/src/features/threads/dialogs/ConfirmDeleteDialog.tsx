"use client";
import React from "react";
import { Button } from "@ui";
import { Card } from "@ui/Card";

export default function ConfirmDeleteDialog({
  open,
  title,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative p-4 w-[320px]">
        <div className="text-sm mb-3">「{title}」を削除しますか？</div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>キャンセル</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>削除</Button>
        </div>
      </Card>
    </div>
  );
}


