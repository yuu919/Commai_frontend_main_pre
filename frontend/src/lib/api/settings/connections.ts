import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export type ConnectionItem = { storeId: string; storeName: string; service: string; status: string };
export type PrereqResult = { hasStore: boolean; stores: Array<{ id: string; name: string }> };
export type InitiateResult = { sessionId: string; scopes?: Record<string, string[]> };
export type AuthorizeResult = { authUrl: string };
export type ConnectSession = { state: 'success' | 'partial' | 'failed'; storeId: string; details: Array<{ service: string; status: 'success' | 'failed'; message?: string }>; };
export type LastError = { code: string; message: string; detail?: string; occurredAt?: string };

export async function listConnections(headersOverride?: Record<string, string>): Promise<{ items: ConnectionItem[] }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/connections"), { headers });
}

export async function reauthUrl(payload: { storeId: string; service: string }, headersOverride?: Record<string, string>): Promise<{ authUrl: string }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/connections/reauth"), { method: "POST", headers, body: payload });
}

export async function prereq(headersOverride?: Record<string, string>): Promise<PrereqResult>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/connections/prereq"), { headers });
}

export async function initiate(payload: { storeId: string; services: string[] }, headersOverride?: Record<string, string>): Promise<InitiateResult>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/connections/initiate"), { method: "POST", headers, body: payload });
}

export async function authorize(payload: { sessionId: string }, headersOverride?: Record<string, string>): Promise<AuthorizeResult>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  return jsonFetch(dbUrl("/api/db/connections/authorize"), { method: "POST", headers, body: payload });
}

export async function sessionStatus(payload: { sessionId: string }, headersOverride?: Record<string, string>): Promise<ConnectSession>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  const usp = new URLSearchParams({ sessionId: payload.sessionId });
  return jsonFetch(dbUrl(`/api/db/connections/session-status?${usp.toString()}`), { headers });
}

export async function notifyOnReady(payload: { storeId: string; services: string[] }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/connections/notify-on-ready"), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function sync(payload: { storeId: string; service: string; bulk?: boolean }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/connections/sync"), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function unlink(payload: { storeId: string; service: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/connections/unlink"), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function lastError(payload: { storeId: string; service: string }, headersOverride?: Record<string, string>): Promise<LastError | null>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  const usp = new URLSearchParams({ storeId: payload.storeId, service: payload.service });
  return jsonFetch(dbUrl(`/api/db/connections/last-error?${usp.toString()}`), { headers });
}


