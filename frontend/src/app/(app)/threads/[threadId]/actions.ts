"use server";
import { RenameThreadSchema, DeleteThreadSchema, MoveThreadSchema } from "./schema";
import { dbUrl } from "@/lib/transport/fetcher";
import { buildServerUnifiedHeaders } from "@/lib/server/auth.server";
import { apiRenameThread, apiDeleteThread, apiMoveThread } from "@/lib/api/threads";
import { apiGenerateTitle, apiPersistTitle, apiRegenerateFromMessage } from "@/lib/api/chat";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";

async function assertSameOrigin() {
  try {
    const h = await nextHeaders();
    const origin = h.get("origin");
    const referer = h.get("referer");
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (!origin && !referer) return true;
    if (!host) return true;
    const allowedOrigin = `${proto}://${host}`;
    if (origin && !origin.startsWith(allowedOrigin)) throw new Error("Invalid origin");
    if (referer && !referer.startsWith(allowedOrigin)) throw new Error("Invalid referer");
    return true;
  } catch {
    throw new Error("CSRF validation failed");
  }
}

export async function renameThreadAction(input: unknown) {
  await assertSameOrigin();
  const { threadId, title } = RenameThreadSchema.parse(input);
  await apiRenameThread(threadId, title);
  return { ok: true as const, threadId, title };
}

export async function deleteThreadAction(input: unknown) {
  await assertSameOrigin();
  const { threadId } = DeleteThreadSchema.parse(input);
  await apiDeleteThread(threadId);
  return { ok: true as const, threadId };
}

export async function moveThreadAction(input: unknown) {
  await assertSameOrigin();
  const { threadId, projectId } = MoveThreadSchema.parse(input);
  await apiMoveThread(threadId, projectId);
  return { ok: true as const, threadId, projectId };
}

const GenerateTitleSchema = z.object({
  threadId: z.string().min(1),
  messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().min(1) })).min(1),
  model: z.string().min(1).default("gpt-4.1-mini"),
});

export async function generateTitleAction(input: unknown) {
  await assertSameOrigin();
  const { threadId, messages, model } = GenerateTitleSchema.parse(input);
  const title = await apiGenerateTitle(messages, model);
  await apiPersistTitle(threadId, title);
  return { ok: true as const, threadId, title };
}

// ---- Message-level actions ----
const EditMessageSchema = z.object({ threadId: z.string().min(1), messageId: z.union([z.string(), z.number()]), content: z.string().min(1) });
const DeleteMessageSchema = z.object({ threadId: z.string().min(1), messageId: z.union([z.string(), z.number()]) });
const RegenerateSchema = z.object({ threadId: z.string().min(1), messageId: z.union([z.string(), z.number()]) });

export async function editMessageAction(input: unknown) {
  await assertSameOrigin();
  const { threadId, messageId, content } = EditMessageSchema.parse(input);
  const headers = buildServerUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(dbUrl(`/api/db/messages/${encodeURIComponent(String(messageId))}`), {
    method: "PATCH",
    headers,
    body: JSON.stringify({ content }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to edit message: ${res.status} ${text}`);
  }
  return { ok: true as const, threadId, messageId, content };
}

export async function deleteMessageAction(input: unknown) {
  await assertSameOrigin();
  const { threadId, messageId } = DeleteMessageSchema.parse(input);
  const headers = buildServerUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/messages/${encodeURIComponent(String(messageId))}`), {
    method: "DELETE",
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to delete message: ${res.status} ${text}`);
  }
  return { ok: true as const, threadId, messageId };
}

export async function regenerateFromMessageAction(input: unknown) {
  await assertSameOrigin();
  const { threadId, messageId } = RegenerateSchema.parse(input);
  // 実装方針: messageId以降を再生成するAPIへ委譲（仮）
  await apiRegenerateFromMessage(threadId, messageId);
  return { ok: true as const, threadId, messageId };
}


