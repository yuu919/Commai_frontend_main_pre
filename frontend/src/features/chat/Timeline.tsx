"use client";
import React, { useMemo } from "react";
import { MutedText, Button } from "@ui";
import { Virtuoso } from "react-virtuoso";
import MessageItem, { ChatMessage } from "./MessageItem";
import useMessageScroll from "@/features/chat/hooks/useMessageScroll";

export default function Timeline({ messages, thinkingMap, error, showErrorBanner }: { messages: ChatMessage[]; thinkingMap?: Record<string | number, { status: string; message?: string; metadata?: Record<string, any> | null }>; error?: string | Error | null; showErrorBanner?: boolean }) {
  const data = useMemo(() => messages, [messages]);
  const { virtuosoRef, atBottom, showJumpButton, onAtBottomChange, scrollToBottom } = useMessageScroll(data.length);

  const lastAssistantId = useMemo(() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].role === "assistant") return data[i].id;
    }
    return null;
  }, [data]);

  return (
    <div className="h-full relative">
      {showErrorBanner && error && (
        <div className="absolute top-0 inset-x-0 z-10 px-3 py-2 text-xs">
          <MutedText variant="error">{typeof error === "string" ? error : error.message}</MutedText>
        </div>
      )}
      <Virtuoso
        ref={virtuosoRef}
        data={data}
        overscan={200}
        followOutput={true}
        atBottomStateChange={onAtBottomChange}
        itemContent={(index, msg) => (
          <MessageItem
            key={msg.id}
            msg={msg}
            thinking={thinkingMap ? thinkingMap[msg.id] : undefined}
            inlineError={null}
            canRegenerate={lastAssistantId === msg.id}
          />
        )}
      />
      {/* Bottom gradient when not at bottom */}
      {!atBottom && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
      )}
      {showJumpButton && (
        <Button size="sm" className="absolute right-4 bottom-4 text-xs" onClick={scrollToBottom}>末尾へ</Button>
      )}
    </div>
  );
}


