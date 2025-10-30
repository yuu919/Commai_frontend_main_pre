"use client";
import useSWR from "swr";
import { swrAuthedJson, dbUrl, jsonFetch } from "../transport/fetcher";
import type { ProjectRow, MessageRow } from "../db.types";

export function useProjects() {
  const mock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useSWR<ProjectRow[]>(mock ? null : ["projects"], () => swrAuthedJson<ProjectRow[]>("/api/db/projects"), {
    revalidateOnFocus: true,
    dedupingInterval: 1000,
  });
}

export function useProject(projectId?: number) {
  const mock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useSWR<ProjectRow | null>(
    mock ? null : (typeof projectId === "number" ? ["project", projectId] : null),
    () => swrAuthedJson<ProjectRow>(`/api/db/projects/${projectId}`),
    { revalidateOnFocus: true, dedupingInterval: 1000 }
  );
}

export function useProjectChats(projectId?: number) {
  const mock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useSWR<{
    id: string;
    title: string;
    updated_at?: string;
  }[] | null>(
    mock ? null : (typeof projectId === "number" ? ["project-chats", projectId] : null),
    () => swrAuthedJson(`/api/db/projects/${projectId}/chats`),
    { revalidateOnFocus: true, dedupingInterval: 1000 }
  );
}

export function useThreadMessages(threadId?: string) {
  const mock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useSWR<MessageRow[]>(
    mock ? null : (threadId ? ["messages", threadId] : null),
    () => swrAuthedJson<MessageRow[]>(`/api/db/chats/${threadId}/messages`),
    { revalidateOnFocus: true, dedupingInterval: 1000 }
  );
}

// Project mutations (client fetch with unified headers inside swrAuthedJson/jsonFetch pipeline)
export async function createProject(name: string, description?: string | null): Promise<ProjectRow> {
  return jsonFetch<ProjectRow>(dbUrl("/api/db/projects"), {
    method: "POST",
    headers: { ...((await import("../client/auth.client")).buildUnifiedHeaders()) },
    body: { name, description: description ?? null },
  });
}

export async function renameProject(projectId: number, name: string): Promise<ProjectRow> {
  return jsonFetch<ProjectRow>(dbUrl(`/api/db/projects/${projectId}`), {
    method: "PATCH",
    headers: { ...((await import("../client/auth.client")).buildUnifiedHeaders()) },
    body: { name },
  });
}

export async function deleteProject(projectId: number): Promise<{ success: boolean }> {
  return jsonFetch<{ success: boolean }>(dbUrl(`/api/db/projects/${projectId}`), {
    method: "DELETE",
    headers: { ...((await import("../client/auth.client")).buildUnifiedHeaders()) },
  });
}


