"use client";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useProjectsRepo } from "@/app/providers";
import { Button, Input, MutedText, Surface } from "@ui";
import { normalizeHttpError } from "@/lib/error";
import { useToast } from "@ui/Toast";

export default function ProjectsList() {
  const repo = useProjectsRepo();
  const { data, error, isLoading, mutate } = useSWR(["projects"], () => repo.list(), { revalidateOnFocus: true, dedupingInterval: 1000 });
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, query]);

  const sel = useSWR(selectedId != null ? ["project", selectedId] : null, () => repo.get(selectedId!), { revalidateOnFocus: true, dedupingInterval: 1000 });
  const chats = useSWR(selectedId != null ? ["project-chats", selectedId] : null, () => repo.listChats(selectedId!), { revalidateOnFocus: true, dedupingInterval: 1000 });

  if (isLoading) return <div className="text-sm">Loading...</div>;
  if (error) return <div className="text-sm"><MutedText variant="error">Failed to load projects</MutedText></div>;
  const projects = filtered;

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await repo.create(name);
      setNewName("");
      await mutate();
    } catch (e: any) {
      push({ message: normalizeHttpError(e?.status ?? 500, e?.message ?? e).message, variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const onRename = async (id: number, name: string) => {
    try {
      await repo.rename(id, name);
      await mutate();
      setRenamingId(null);
    } catch (e: any) {
      push({ message: normalizeHttpError(e?.status ?? 500, e?.message ?? e).message, variant: "error" });
    }
  };

  const onDelete = async (id: number) => {
    try {
      await repo.remove(id);
      if (selectedId === id) setSelectedId(null);
      await mutate();
    } catch (e: any) {
      push({ message: normalizeHttpError(e?.status ?? 500, e?.message ?? e).message, variant: "error" });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Input size="md" placeholder="プロジェクトを検索" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Surface bordered radius="sm" active={selectedId===p.id} interactive={! (selectedId===p.id)}> 
              <div className="p-3">
                {renamingId === p.id ? (
                  <div className="flex items-center gap-2">
                    <Input size="sm" defaultValue={p.name} onKeyDown={(e)=>{ if(e.key==="Enter"){ onRename(p.id, (e.target as HTMLInputElement).value); } }} />
                    <Button size="sm" onClick={()=> onRename(p.id, (document.activeElement as HTMLInputElement)?.value || p.name)}>保存</Button>
                    <Button size="sm" variant="ghost" onClick={()=> setRenamingId(null)}>キャンセル</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button className="text-left" onClick={() => setSelectedId(p.id)}>
                      <div className="font-medium">{p.name}</div>
                      {p.description && <div className="text-xs"><MutedText level={50}>{p.description}</MutedText></div>}
                    </button>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={()=> setRenamingId(p.id)}>改名</Button>
                      <Button size="sm" variant="ghost" onClick={()=> onDelete(p.id)}>削除</Button>
                    </div>
                  </div>
                )}
              </div>
              </Surface>
            </li>
          ))}
          {projects.length === 0 && <li className="text-xs"><MutedText level={50}>No projects</MutedText></li>}
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <Input size="md" placeholder="新規プロジェクト名" value={newName} onChange={(e)=> setNewName(e.target.value)} />
          <Button size="md" onClick={onCreate} disabled={creating}>作成</Button>
        </div>
      </div>
      <Surface bordered radius="md" className="md:col-span-2 p-3 min-h-40">
        {selectedId == null && <div className="text-sm"><MutedText level={40}>左からプロジェクトを選択してください</MutedText></div>}
        {selectedId != null && (
          <div>
            <div className="mb-3">
              <div className="text-base font-semibold">{sel.data?.name ?? ""}</div>
              {sel.data?.description && <div className="text-xs"><MutedText level={50}>{sel.data.description}</MutedText></div>}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">所属チャット</div>
              {chats.isLoading && <div className="text-sm">Loading...</div>}
              {chats.error && <div className="text-sm"><MutedText variant="error">Failed to load</MutedText></div>}
              <ul className="space-y-2">
                {(chats.data ?? []).map((c) => (
                  <li key={c.id} className="text-sm"><Surface bordered radius="sm" className="p-2">{c.title}</Surface></li>
                ))}
                {(chats.data ?? []).length === 0 && !chats.isLoading && <li className="text-xs"><MutedText level={50}>チャットはありません</MutedText></li>}
              </ul>
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}


