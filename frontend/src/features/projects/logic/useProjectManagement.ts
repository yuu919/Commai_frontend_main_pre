"use client";
import { useCallback, useState } from "react";
import type { ProjectsRepository } from "@/features/projects/types";

export default function useProjectManagement(repo: ProjectsRepository, initial?: { items?: { id: number; name: string; description?: string | null }[] }) {
  const [items, setItems] = useState<{ id: number; name: string; description?: string | null }[]>(initial?.items ?? []);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const list = await repo.list();
    setItems(list);
  }, [repo]);

  const create = useCallback(async (name: string, description?: string | null) => {
    setBusy(true);
    const optimistic = { id: Number.MAX_SAFE_INTEGER - Math.floor(Math.random() * 1000), name, description };
    setItems((prev) => [optimistic, ...prev]);
    try {
      const created = await repo.create(name, description);
      setItems((prev) => prev.map((p) => (p.id === optimistic.id ? created : p)));
      return created;
    } catch (e) {
      setItems((prev) => prev.filter((p) => p.id !== optimistic.id));
      throw e;
    } finally {
      setBusy(false);
    }
  }, [repo]);

  const rename = useCallback(async (id: number, name: string, description?: string | null) => {
    const prev = items;
    setItems((list) => list.map((p) => (p.id === id ? { ...p, name, description } : p)));
    try {
      await repo.rename(id, name, description);
    } catch (e) {
      setItems(prev);
      throw e;
    }
  }, [repo, items]);

  const remove = useCallback(async (id: number) => {
    const prev = items;
    setItems((list) => list.filter((p) => p.id !== id));
    try {
      await repo.remove(id);
    } catch (e) {
      setItems(prev);
      throw e;
    }
  }, [repo, items]);

  return { items, setItems, busy, refresh, create, rename, remove };
}


