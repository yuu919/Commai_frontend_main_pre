type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export async function jsonFetch<T>(
  url: string,
  options: { method?: HttpMethod; headers?: Record<string, string>; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", headers = {}, body } = options;
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw normalizeHttpError(res.status, text || res.statusText);
  }
  return (await res.json()) as T;
}

export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}${path}`;
}

export function dbUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_DB_API_URL || "";
  return `${base}${path}`;
}

export async function swrJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw normalizeHttpError(res.status, text || res.statusText);
  }
  return (await res.json()) as T;
}

import { buildUnifiedHeaders } from "../client/auth.client";
export async function swrAuthedJson<T>(path: string): Promise<T> {
  const headers = buildUnifiedHeaders();
  return swrJson<T>(dbUrl(path), { headers });
}

import { normalizeHttpError } from "../error";


