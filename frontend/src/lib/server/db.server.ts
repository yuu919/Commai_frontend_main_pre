// Server-only DB utilities. Do NOT import client-only modules (e.g. auth.client, SWR, window/localStorage).

import type { ShareInfo } from "@/lib/db.types";
type ShareInfoPayload = { success: boolean; data?: ShareInfo };

export async function serverFetchThreadExists(threadId: string): Promise<boolean> {
  // In mock mode, skip existence check and allow rendering
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") return true;
  const base = process.env.NEXT_PUBLIC_DB_API_URL || "";
  const res = await fetch(`${base}/api/db/chats/${encodeURIComponent(threadId)}/messages`, {
    cache: "no-store",
  });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Failed to fetch thread messages: ${res.status}`);
  return true;
}

export async function serverGetShareInfoByToken(token: string): Promise<ShareInfoPayload> {
  const base = process.env.NEXT_PUBLIC_DB_API_URL || "";
  const res = await fetch(`${base}/api/db/shares/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 410) return { success: false } as ShareInfoPayload;
  if (!res.ok) throw new Error(`Failed to fetch share info: ${res.status}`);
  return res.json();
}


