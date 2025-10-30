import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

export async function updatePassword(payload: { currentPassword: string; newPassword: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/password/update"), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function enableEmail2FA(headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/2fa/email/enable"), { method: "POST", headers });
  return { ok: true };
}

export async function verifyEmail2FA(payload: { code: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/2fa/email/verify"), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function disableEmail2FA(headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/2fa/email/disable"), { method: "POST", headers });
  return { ok: true };
}

export async function requestEmailChange(payload: { newEmail: string }, headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/email/change"), { method: "POST", headers, body: payload });
  return { ok: true };
}

export async function confirmEmailChange(headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/email/confirm"), { method: "POST", headers });
  return { ok: true };
}

export async function cancelEmailChange(headersOverride?: Record<string, string>): Promise<{ ok: true }>
{
  const headers = headersOverride ?? buildUnifiedHeaders();
  await jsonFetch(dbUrl("/api/db/account/email/cancel"), { method: "POST", headers });
  return { ok: true };
}


