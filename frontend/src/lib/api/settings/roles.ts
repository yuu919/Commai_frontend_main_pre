import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export type RoleItem = { id: string; name: string; description?: string };

export async function listRoles(headersOverride?: Record<string, string>): Promise<{ items: RoleItem[] }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/roles"), { headers });
}

export async function createRole(payload: { name: string; description?: string }, headersOverride?: Record<string, string>): Promise<{ id: string }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/roles"), { method: "POST", headers, body: payload });
}

export async function updateRole(payload: { id: string; name?: string; description?: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl(`/api/db/roles/${encodeURIComponent(payload.id)}`), { method: "PUT", headers, body: payload });
  return { ok: true };
}

export async function deleteRole(id: string, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl(`/api/db/roles/${encodeURIComponent(id)}`), { method: "DELETE", headers });
  return { ok: true };
}

export async function estimateRoles(payload: { changes: Array<{ resourceId: string; threshold: 'owner'|'manager'|'general'|'none' }> }, headersOverride?: Record<string, string>): Promise<{ impact: Array<{ metric: string; delta: number }> }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl(`/api/db/roles/estimate`), { method: "POST", headers, body: payload });
}

export async function saveRoles(payload: { changes: Array<{ resourceId: string; threshold: 'owner'|'manager'|'general'|'none' }> }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl(`/api/db/roles/save`), { method: "POST", headers, body: payload });
  return { ok: true };
}


