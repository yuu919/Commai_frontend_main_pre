"use client";
import React, { useEffect, useMemo, useState } from "react";
import ProjectList from "@/features/projects/ProjectList";
import { Input, Button, Surface } from "@ui";
import { useRouter } from "next/navigation";
import * as projectsRepoMod from "@/features/projects/api/repository";
import useProjectState from "@/features/projects/logic/useProjectState";
import { useUrlStateManager } from "@/lib/urlState";
import { useToast } from "@ui/Toast";
import { normalizeHttpError } from "@/lib/error";

export default function ProjectsIndexClient() {
  const router = useRouter();
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const repo = useMocks ? projectsRepoMod.createMockProjectsRepository() : projectsRepoMod.createServerProjectsRepository();
  const { push } = useToast();
  const { state, setState, filtered } = useProjectState(repo);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  // URL init/sync
  useUrlStateManager({
    onInit: (sp) => {
      const q = sp.get("q") ?? "";
      const s = (sp.get("sort") as any) ?? undefined;
      const sel = sp.get("projectId");
      setState((st) => ({
        ...st,
        query: q,
        sort: s === "title_asc" || s === "updated_desc" ? s : st.sort,
        selectedId: sel ? Number(sel) : st.selectedId,
      }));
    },
    getParams: () => ({ q: state.query, sort: state.sort, projectId: state.selectedId ? String(state.selectedId) : undefined }),
  });

  const totalCount = useMemo(() => state.items.length, [state.items.length]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await repo.list({ offset: page * pageSize, limit: pageSize, query: state.query, sort: state.sort });
      if (more.length > 0) {
        setState((st) => ({ ...st, items: [...st.items, ...more] }));
        setPage((p) => p + 1);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await repo.create(name);
      const list = await repo.list();
      setState((st) => ({ ...st, items: list, selectedId: created.id }));
      setNewName("");
      router.push(`/projects/${created.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      push({ message: normalizeHttpError(500, msg).message, variant: "error" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Input size="md" placeholder="プロジェクトを検索" value={state.query} onChange={(e)=> setState((st)=> ({ ...st, query: e.target.value }))} />
        <Button size="sm" variant="ghost" onClick={()=> setState((st)=> ({ ...st, sort: st.sort === "updated_desc" ? "title_asc" : "updated_desc" }))}>
          {state.sort === "updated_desc" ? "更新順" : "タイトル順"}
        </Button>
      </div>
      <Surface bordered radius="md" className="flex-1">
        <ProjectList
          items={filtered}
          selectedId={state.selectedId}
          onSelect={(id)=> { setState((st)=> ({ ...st, selectedId: id })); router.push(`/projects/${id}`); }}
          totalCount={totalCount}
          onEndReached={loadMore}
        />
      </Surface>
      <div className="mt-3 flex items-center gap-2">
        <Input size="md" placeholder="新規プロジェクト名" value={newName} onChange={(e)=> setNewName(e.target.value)} onKeyDown={(e)=> { if(e.key === "Enter") handleCreate(); }} />
        <Button size="md" onClick={handleCreate} disabled={creating}>作成</Button>
      </div>
    </div>
  );
}


