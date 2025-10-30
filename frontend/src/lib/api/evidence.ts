import { dbUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
export type EvidenceRow = { id: string | number; kind?: string; payload?: unknown };

export async function apiGetEvidenceById(id: string | number): Promise<EvidenceRow> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/evidence/${encodeURIComponent(String(id))}`), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch evidence: ${res.status}`);
  return res.json() as Promise<EvidenceRow>;
}


