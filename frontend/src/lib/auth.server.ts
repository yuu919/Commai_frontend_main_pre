import { cookies } from "next/headers";

export function getAuthCookie(): string | null {
  try {
    const got = cookies();
    // Next 15 may return a Promise-like for params; cookies() remains sync in server context
    const c = got as unknown as { get(name: string): { value?: string } | undefined };
    const token = c.get("auth_token")?.value ?? null;
    return token ?? null;
  } catch {
    return null;
  }
}

export function buildServerUnifiedHeaders(additional?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(additional ?? {}) };
  const token = getAuthCookie();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    // workspace_id の Cookie 化は後段で導入。ここではヘッダーは最小限。
  }
  return headers;
}


