"use client";
import React, { useState } from "react";
import { RowMenu, Button } from "@ui";
import { usePathname } from "next/navigation";
import ShareModal from "@/features/chat/ShareModal";

export default function HeaderShareMenu({ chatId }: { chatId?: string }) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();
  const url = (() => {
    try {
      if (typeof window === "undefined") return "";
      const origin = window.location.origin;
      const target = chatId ? `/threads/${chatId}` : pathname || "/";
      return `${origin}${target}`;
    } catch {
      return "";
    }
  })();

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>共有</Button>
      <RowMenu open={open} onClose={() => setOpen(false)}>
        <div className="p-1 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
              } catch {}
              setOpen(false);
            }}
          >
            リンクをコピー
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => {
              setShowModal(true);
              setOpen(false);
            }}
          >
            共有詳細...
          </Button>
        </div>
      </RowMenu>
      <ShareModal open={showModal} url={url} onClose={() => setShowModal(false)} threadId={chatId} />
    </div>
  );
}


