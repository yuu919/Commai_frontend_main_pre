import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export async function getFaq(headersOverride?: Record<string, string>): Promise<{ items: Array<{ q: string; a: string }> }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/help/faq"), { headers });
}

export async function getGuides(headersOverride?: Record<string, string>): Promise<{ items: Array<{ title: string; url: string }> }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/help/guides"), { headers });
}


