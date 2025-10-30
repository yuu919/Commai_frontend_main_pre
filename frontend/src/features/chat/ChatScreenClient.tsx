"use client";
import React, { useEffect } from "react";
import { ViewportMinusHeader } from "@ui";
import Timeline from "./Timeline";
import Composer from "./Composer";
import useChatController from "./logic/useChatController";
import type { ChatMessage } from "./types";
import useMessagesSWR from "./logic/useMessagesSWR";
import type { MessagesRepository } from "@/features/chat/types";

export default function ChatScreenClient({ initial, threadId, repo }: { initial?: ChatMessage[]; threadId: string; repo: MessagesRepository }) {
  const swr = useMessagesSWR(threadId, repo);
  const initMsgs: ChatMessage[] | undefined = swr.data ?? initial;
  const { messages, setMessages, send, stop, regenerate, error, busy, thinkingMap } = useChatController(initMsgs, { threadId, repo });
  useEffect(() => {
    if (swr.data) setMessages(swr.data);
  }, [swr.data, setMessages]);
  useEffect(() => {
    function onUpdated() { swr.mutate(); }
    window.addEventListener("chat:message-updated", onUpdated);
    return () => window.removeEventListener("chat:message-updated", onUpdated);
  }, [swr]);
  return (
    <ViewportMinusHeader className="flex flex-col">
      <div className="flex-1">
        <Timeline messages={messages} thinkingMap={thinkingMap} error={error} showErrorBanner={true} />
      </div>
      <Composer onSend={send} onStop={stop} onRegenerate={regenerate} busy={busy} threadId={threadId} showErrorInline={false} repo={repo} />
    </ViewportMinusHeader>
  );
}


