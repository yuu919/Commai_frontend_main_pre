import { useMemo, useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import type { ThreadsController, ThreadsState, ThreadItem, ThreadId } from "../types";
import type { ThreadsRepository } from "@/features/threads/types";

function nowIso() {
  return new Date().toISOString();
}

export function useThreadsController(initial?: Partial<ThreadsState>, repo?: ThreadsRepository): ThreadsController {
  const [state, setState] = useState<ThreadsState>(() => ({
    items: initial?.items ?? [],
    activeId: initial?.activeId ?? null,
    query: initial?.query ?? "",
  }));
  // 失敗は都度 mutate 再検証で整合を取るため、外部公開のロードエラーは保持しない
  const [, setLoadError] = useState<string | null>(null);

  const { data, error, mutate } = useSWR(repo ? ["threads"] : null, () => repo!.list(), { revalidateOnFocus: true, dedupingInterval: 1000 });

  useEffect(() => {
    if (error) setLoadError("スレッドの読み込みに失敗しました");
    if (data) {
      setState((s) => ({ ...s, items: data as ThreadItem[] }));
      setLoadError(null);
    }
  }, [data, error]);

  const setActiveId = useCallback((id: ThreadId) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const setQuery = useCallback((q: string) => {
    setState((s) => ({ ...s, query: q }));
  }, []);

  const createThread = useCallback(async (title?: string): Promise<ThreadItem> => {
    const optimistic: ThreadItem = {
      id: crypto.randomUUID(),
      title: title ?? "無題",
      projectId: null,
      updatedAt: nowIso(),
    };
    setState((s) => ({ ...s, items: [optimistic, ...s.items], activeId: optimistic.id }));
    try {
      const created = await repo!.create({ title: optimistic.title });
      setState((s) => ({ ...s, items: s.items.map((it) => (it.id === optimistic.id ? { ...created } : it)), activeId: created.id }));
      await mutate();
      return created;
    } catch (e) {
      setState((s) => ({ ...s, items: s.items.filter((it) => it.id !== optimistic.id), activeId: s.activeId === optimistic.id ? null : s.activeId }));
      throw e;
    }
  }, [mutate, repo]);

  const renameThread = useCallback(async (id: ThreadId, title: string) => {
    const prev = state;
    setState((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === id ? { ...it, title, updatedAt: nowIso() } : it)),
    }));
    try {
      await repo!.rename({ id, title });
      await mutate();
    } catch (e) {
      setState(prev);
      throw e;
    }
  }, [mutate, state, repo]);

  const deleteThread = useCallback(async (id: ThreadId) => {
    const prev = state;
    setState((s) => ({
      ...s,
      items: s.items.filter((it) => it.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
    try {
      await repo!.remove({ id });
      await mutate();
    } catch (e) {
      setState(prev);
      throw e;
    }
  }, [mutate, state, repo]);

  const moveToProject = useCallback(async (id: ThreadId, projectId: number | null) => {
    const prev = state;
    setState((s) => {
      const updated = s.items.map((it) => (it.id === id ? { ...it, projectId, updatedAt: nowIso() } : it));
      const idx = updated.findIndex((it) => it.id === id);
      if (idx < 0) return { ...s, items: updated };
      const moved = updated[idx];
      const rest = updated.filter((_, i) => i !== idx);
      return { ...s, items: [moved, ...rest] };
    });
    try {
      await repo!.move({ id, projectId });
      await mutate();
    } catch (e) {
      setState(prev);
      throw e;
    }
  }, [mutate, state, repo]);

  const applyLocalTitle = useCallback((id: ThreadId, title: string) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === id ? { ...it, title, updatedAt: nowIso() } : it)),
    }));
  }, []);

  useMemo(() => state, [state]);

  return {
    state,
    setActiveId,
    setQuery,
    createThread,
    renameThread,
    deleteThread,
    moveToProject,
    applyLocalTitle,
  };
}

export default useThreadsController;


