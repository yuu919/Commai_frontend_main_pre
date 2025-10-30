import React from "react";
import { serverFetchThreadExists } from "@/lib/server/db.server";
import { notFound } from "next/navigation";
import ChatScreenClient from "@/features/chat/ChatScreenClient";
import * as messages from "@/features/chat/api/repository";
import type { ChatMessage } from "@/features/chat/types";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  try {
    const exists = await serverFetchThreadExists(threadId);
    if (!exists) notFound();
  } catch {
    // 通信エラー時は一旦表示継続（UX優先）
  }
  const initial: ChatMessage[] = [];
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const repo = useMocks ? messages.createMockMessagesRepository() : messages.createServerMessagesRepository();
  return <ChatScreenClient initial={initial} threadId={threadId} repo={repo} />;
}
