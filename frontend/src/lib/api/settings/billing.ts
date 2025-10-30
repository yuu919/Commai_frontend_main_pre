import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export async function openBillingPortal(headersOverride?: Record<string, string>): Promise<{ url: string }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/billing/portal"), { method: "POST", headers });
}


