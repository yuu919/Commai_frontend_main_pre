import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export type StoreItem = { storeId: string; storeName: string };

export async function listStores(headersOverride?: Record<string, string>): Promise<{ items: StoreItem[] }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/connections/stores"), { headers });
}

export async function listUsers(payload: { platformId: string; storeId: string; roles?: string[]; statuses?: string[]; sort?: string; q?: string }, headersOverride?: Record<string, string>): Promise<{ items: Array<{ id: string; name: string; email: string; status: string; role: string; updatedAt?: string; scopeStoreId?: string }> }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  const usp = new URLSearchParams();
  usp.set('platformId', payload.platformId);
  usp.set('storeId', payload.storeId);
  if (payload.q) usp.set('q', payload.q);
  if (payload.sort) usp.set('sort', payload.sort);
  if (payload.roles && payload.roles.length) usp.set('roles', payload.roles.join(','));
  if (payload.statuses && payload.statuses.length) usp.set('statuses', payload.statuses.join(','));
  return jsonFetch(dbUrl(`/api/db/permissions/users?${usp.toString()}`), { headers });
}

export async function inviteUser(payload: { storeId: string; email: string; role: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl(`/api/db/permissions/invite`), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function updateRole(payload: { storeId: string; userId: string; role: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl(`/api/db/permissions/assign`), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function disableUser(payload: { storeId: string; userId: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl(`/api/db/permissions/disable`), { method: "POST", headers, body: payload });
  return { ok: true };
}


