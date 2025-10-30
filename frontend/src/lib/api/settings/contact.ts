import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export async function postContact(payload: { title: string; body: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/contact"), { method: "POST", headers, body: payload });
  return { ok: true };
}


