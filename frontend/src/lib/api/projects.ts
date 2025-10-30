import { dbUrl, jsonFetch } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import type { ProjectRow, ProjectChatRow } from "@/lib/db.types";

export async function apiListProjects(params?: { offset?: number; limit?: number; q?: string; sort?: string }): Promise<ProjectRow[]> {
  const headers = buildUnifiedHeaders();
  const url = new URL(dbUrl("/api/db/projects"));
  if (params?.offset != null) url.searchParams.set("offset", String(params.offset));
  if (params?.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.sort) url.searchParams.set("sort", params.sort);
  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function apiGetProject(id: number): Promise<ProjectRow | null> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/projects/${id}`), { headers, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  return res.json();
}

export async function apiListProjectChats(projectId: number): Promise<ProjectChatRow[]> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/projects/${projectId}/chats`), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch project chats: ${res.status}`);
  const data: ProjectChatRow[] = await res.json();
  return [...data].sort((a, b) => String(a.updated_at) < String(b.updated_at) ? 1 : -1);
}

export async function apiCreateProject(name: string, description?: string | null): Promise<ProjectRow> {
  const headers = buildUnifiedHeaders();
  return jsonFetch<ProjectRow>(dbUrl("/api/db/projects"), { method: "POST", headers, body: { name, description: description ?? null } });
}

export async function apiRenameProject(id: number, name: string, description?: string | null): Promise<ProjectRow> {
  const headers = buildUnifiedHeaders();
  return jsonFetch<ProjectRow>(dbUrl(`/api/db/projects/${id}`), { method: "PATCH", headers, body: { name, description: description ?? undefined } });
}

export async function apiDeleteProject(id: number): Promise<{ success: boolean }> {
  const headers = buildUnifiedHeaders();
  return jsonFetch<{ success: boolean }>(dbUrl(`/api/db/projects/${id}`), { method: "DELETE", headers });
}


