import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export type RunLogItem = { id: string; threadId: string; status: string; createdAt: string };

export async function listRunLogs(headersOverride?: Record<string, string>): Promise<{ items: RunLogItem[] }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/run-logs/threads"), { headers });
}

export async function getRunLog(threadId: string, headersOverride?: Record<string, string>): Promise<{ items: RunLogItem[] }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl(`/api/db/run-logs/threads/${encodeURIComponent(threadId)}/runs`), { headers });
}


