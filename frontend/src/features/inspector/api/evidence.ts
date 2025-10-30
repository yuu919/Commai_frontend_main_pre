import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { normalizeHttpError } from "@/lib/error";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import { createMockEvidenceRepository } from "./repository.mock";
import type { EvidenceResponse } from "@/features/inspector/types";

export async function getEvidenceById<T = any>(evidenceId: string): Promise<{ evidence: T }>
{
  const useMocks = typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  if (useMocks) {
    const repo = createMockEvidenceRepository();
    const res = await repo.getById(evidenceId);
    return { evidence: res.evidence as unknown as T };
  }
  try {
    return await jsonFetch<{ evidence: T }>(dbUrl(`/api/db/evidence/${encodeURIComponent(evidenceId)}`), {
      headers: buildUnifiedHeaders(),
    });
  } catch (e: any) {
    throw normalizeHttpError(e?.status ?? 500, e?.message ?? e);
  }
}

export async function getEvidenceByMessage<T = any>(messageId: number, chatId: string): Promise<{ evidence: T }>
{
  const useMocks = typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  if (useMocks) {
    // モック時は by-message でも by-id と同様のダミー応答にする
    const repo = createMockEvidenceRepository();
    const res = await repo.getById(`msg_${messageId}`);
    return { evidence: res.evidence as unknown as T };
  }
  try {
    return await jsonFetch<{ evidence: T }>(dbUrl(`/api/db/evidence/by-message?message_id=${messageId}&chat_id=${encodeURIComponent(chatId)}`), {
      headers: buildUnifiedHeaders(),
    });
  } catch (e: any) {
    throw normalizeHttpError(e?.status ?? 500, e?.message ?? e);
  }
}

// duplicate removed; getEvidenceByMessage is defined above with mock support

export async function getEvidencesByChat<T = any>(chatId: string): Promise<{ items: T[] }>
{
  try {
    return await jsonFetch<{ items: T[] }>(dbUrl(`/api/db/evidence/by-chat?chat_id=${encodeURIComponent(chatId)}`), {
      headers: buildUnifiedHeaders(),
    });
  } catch (e: any) {
    throw normalizeHttpError(e?.status ?? 500, e?.message ?? e);
  }
}

// NOTE: LangChain経路の重複実装は削除し、DB API 経路のみを残します


