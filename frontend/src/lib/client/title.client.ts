"use client";
import type { ChatMessage } from "@/features/chat/types";
import { apiGenerateTitle, apiPersistTitle } from "@/lib/api/chat";

export async function generateTitleAndPersist(threadId: string, messages: ChatMessage[], model: string): Promise<{ title: string }> {
  const title = await apiGenerateTitle(messages.map(m => ({ role: m.role, content: m.content })), model);
  await apiPersistTitle(threadId, title);
  return { title };
}


