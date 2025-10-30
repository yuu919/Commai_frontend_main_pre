import { apiUrl, dbUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import type { ChatRole } from "@/lib/db.types";

export async function apiGenerateTitle(messages: { role: ChatRole; content: string }[], model: string): Promise<string> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(apiUrl(`/api/chat/generate-title`), {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, model }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to generate title: ${res.status}`);
  const data: unknown = await res.json();
  const content = (data as { content?: unknown })?.content;
  const title: string = String(content ?? "").trim() || "新規チャット";
  return title;
}

export async function apiPersistTitle(threadId: string, title: string): Promise<void> {
  const headers = buildUnifiedHeaders();
  const url = new URL(dbUrl(`/api/db/chats/${threadId}/title`));
  url.searchParams.set("title", title);
  const upd = await fetch(url.toString(), { method: "PUT", headers, cache: "no-store" });
  if (!upd.ok) throw new Error(`Failed to persist title: ${upd.status}`);
}

export async function apiRegenerateFromMessage(threadId: string, messageId: string | number): Promise<void> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(apiUrl(`/api/chat/regenerate`), {
    method: "POST",
    headers,
    body: JSON.stringify({ thread_id: threadId, from_message_id: messageId }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to regenerate: ${res.status}`);
}

export type ChatStreamMessage = { role: ChatRole; content: string };
export async function apiOpenChatStream(
  payload: { messages: ChatStreamMessage[]; model: string; chat_id?: string },
  signal: AbortSignal
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(apiUrl("/api/chat/stream"), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error(`SSE start failed: ${res.status}`);
  return res.body.getReader();
}


// Non-streaming fallback to backend JSON API (/api/v1/chat)
export async function apiChatOnce(payload: { messages: { role: ChatRole; content: string }[]; model: string; provider?: string }): Promise<{ content: string }>{
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(apiUrl("/api/v1/chat"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: payload.provider,
      model: payload.model,
      messages: payload.messages,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
  const json = await res.json();
  const content = (json && typeof json === "object" ? (json as any).content : "") as string;
  return { content: content || "" };
}


