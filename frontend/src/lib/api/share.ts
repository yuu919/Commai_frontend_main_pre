import { dbUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import type { ShareResponse, ShareInfoPayload } from "@/lib/db.types";

export async function apiIssueShare(threadId: string, input: { visibility?: "public" | "workspace"; expires_in_hours?: number }): Promise<ShareResponse> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(dbUrl(`/api/db/chats/${encodeURIComponent(threadId)}/share`), { method: "POST", headers, body: JSON.stringify(input), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to issue share: ${res.status}`);
  return res.json();
}

export async function apiRevokeShare(threadId: string): Promise<{ success: boolean }> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/chats/${encodeURIComponent(threadId)}/share`), { method: "DELETE", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to revoke share: ${res.status}`);
  return { success: true };
}

export async function apiGetShareInfoByToken(token: string): Promise<ShareInfoPayload> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/shares/${encodeURIComponent(token)}`), { headers, cache: "no-store" });
  if (res.status === 404 || res.status === 410) return { success: false };
  if (!res.ok) throw new Error(`Failed to fetch share info: ${res.status}`);
  return res.json();
}


