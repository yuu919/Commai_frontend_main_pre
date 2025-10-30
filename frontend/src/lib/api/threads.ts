import { dbUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import type { ThreadItem } from "@/features/threads/types";

export async function apiListThreads(): Promise<ThreadItem[]> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl("/api/db/chats"), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch threads: ${res.status}`);
  const data: unknown = await res.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.map((r: unknown) => {
    if (r && typeof r === "object") {
      const o = r as { id?: unknown; title?: unknown; project_id?: unknown; updated_at?: unknown };
      return {
        id: String(o.id ?? crypto.randomUUID()),
        title: typeof o.title === "string" ? o.title : "無題",
        projectId: typeof o.project_id === "number" ? o.project_id : null,
        updatedAt: typeof o.updated_at === "string" ? o.updated_at : new Date().toISOString(),
      };
    }
    return { id: crypto.randomUUID(), title: "無題", projectId: null, updatedAt: new Date().toISOString() };
  });
}

export async function apiCreateThread(input: { title?: string }): Promise<{ id: string }> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const body = input?.title ? { title: input.title } : {};
  const res = await fetch(dbUrl("/api/db/chats/new"), { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const data: unknown = await res.json();
  if (data && typeof data === "object") {
    const d = data as { id?: unknown };
    return { id: String(d.id ?? crypto.randomUUID()) };
  }
  return { id: crypto.randomUUID() };
}

export async function apiRenameThread(id: string, title: string): Promise<void> {
  const headers = buildUnifiedHeaders();
  const url = new URL(dbUrl(`/api/db/chats/${id}/title`));
  url.searchParams.set("title", title);
  const res = await fetch(url.toString(), { method: "PUT", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to rename: ${res.status}`);
}

export async function apiDeleteThread(id: string): Promise<void> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl(`/api/db/chats/${id}`), { method: "DELETE", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
}

export async function apiMoveThread(id: string, projectId: number | null): Promise<void> {
  const headers = buildUnifiedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(dbUrl(`/api/db/chats/${id}/move-to-project`), { method: "PUT", headers, body: JSON.stringify({ project_id: projectId }), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to move: ${res.status}`);
}


