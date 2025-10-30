"use client";
import { useEffect, useMemo, useState } from "react";
import type { ProjectsRepository } from "@/features/projects/types";

export type ProjectEntity = { id: number; name: string; description?: string | null };
export type ProjectState = {
  items: ProjectEntity[];
  selectedId: number | null;
  query: string;
  sort: "updated_desc" | "title_asc";
};

export default function useProjectState(repo: ProjectsRepository, initial?: Partial<ProjectState> & { autoLoad?: boolean }) {
  const [state, setState] = useState<ProjectState>({
    items: initial?.items ?? [],
    selectedId: initial?.selectedId ?? null,
    query: initial?.query ?? "",
    sort: initial?.sort ?? "updated_desc",
  });

  useEffect(() => {
    if (initial?.autoLoad === false) return;
    let mounted = true;
    repo.list().then(list => { if (mounted) setState(s => ({ ...s, items: list })); }).catch(()=>{});
    return () => { mounted = false; };
  }, [repo, initial?.autoLoad]);

  const filtered = useMemo(() => {
    const q = state.query.trim().toLowerCase();
    let base = state.items;
    if (q) base = base.filter(p => p.name.toLowerCase().includes(q));
    if (state.sort === "title_asc") return [...base].sort((a,b)=> a.name.localeCompare(b.name));
    return base; // updated_desc はAPI側での並びを想定
  }, [state.items, state.query, state.sort]);

  return { state, setState, filtered };
}


