import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import type { MessageRow as ChatMessage, ChatRole } from "@/lib/db.types";

export async function apiListMessages(threadId: string): Promise<ChatMessage[]> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/chats/${encodeURIComponent(threadId)}/messages`), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  const data: unknown = await res.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.map((m: unknown): ChatMessage => {
    if (m && typeof m === "object") {
      const o = m as { id?: unknown; role?: unknown; content?: unknown };
      const id = typeof o.id === "string" || typeof o.id === "number" ? o.id : crypto.randomUUID();
      const role = (o.role === "user" || o.role === "assistant") ? (o.role as ChatRole) : "assistant";
      const content = typeof o.content === "string" ? o.content : "";
      return { id, role, content } as ChatMessage;
    }
    return { id: crypto.randomUUID(), role: "assistant", content: "" } as ChatMessage;
  });
}

export async function apiCreateMessage(threadId: string, message: { role: ChatRole; content: string }): Promise<ChatMessage> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(dbUrl(`/api/db/chats/${encodeURIComponent(threadId)}/messages`), {
    method: "POST",
    headers,
    body: JSON.stringify(message),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to create message: ${res.status}`);
  const m: unknown = await res.json();
  if (m && typeof m === "object") {
    const o = m as { id?: unknown; role?: unknown; content?: unknown };
    const id = typeof o.id === "string" || typeof o.id === "number" ? o.id : crypto.randomUUID();
    const role = (o.role === "user" || o.role === "assistant") ? (o.role as ChatRole) : "assistant";
    const content = typeof o.content === "string" ? o.content : "";
    return { id, role, content } as ChatMessage;
  }
  return { id: crypto.randomUUID(), role: "assistant", content: "" } as ChatMessage;
}

export async function apiEditMessage(threadId: string, messageId: string | number, content: string): Promise<ChatMessage> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  return jsonFetch<ChatMessage>(dbUrl(`/api/db/messages/${encodeURIComponent(String(messageId))}`), {
    method: "PATCH",
    headers,
    body: { content },
  });
}


