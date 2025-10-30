import type { ThreadsRepository, ThreadItem, ThreadId } from "@/features/threads/types";

function nowIso(): string { return new Date().toISOString(); }
function wait(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
function randomLatency(): number { return 120 + Math.floor(Math.random() * 220); }

export function createMockThreadsRepository(seed?: ThreadItem[]): ThreadsRepository {
  let items: ThreadItem[] = (seed ?? [
    { id: crypto.randomUUID(), title: "提案レビュー", projectId: 1, updatedAt: nowIso() },
    { id: crypto.randomUUID(), title: "デザイン検討", projectId: null, updatedAt: nowIso() },
    { id: crypto.randomUUID(), title: "バックログ整理", projectId: 2, updatedAt: nowIso() },
  ]).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const repo: ThreadsRepository = {
    async list(): Promise<ThreadItem[]> { await wait(randomLatency()); return [...items]; },
    async create({ title }: { title?: string }): Promise<ThreadItem> {
      await wait(randomLatency());
      const newItem: ThreadItem = { id: crypto.randomUUID(), title: title?.trim() || "無題", projectId: null, updatedAt: nowIso() };
      items = [newItem, ...items];
      return newItem;
    },
    async rename({ id, title }: { id: ThreadId; title: string }): Promise<void> {
      await wait(randomLatency());
      const t = title.trim();
      if (!t) throw new Error("empty title");
      const idx = items.findIndex((it) => it.id === id);
      if (idx < 0) throw new Error("not found");
      items[idx] = { ...items[idx], title: t, updatedAt: nowIso() };
    },
    async remove({ id }: { id: ThreadId }): Promise<void> {
      await wait(randomLatency());
      const idx = items.findIndex((it) => it.id === id);
      if (idx < 0) throw new Error("not found");
      items.splice(idx, 1);
    },
    async move({ id, projectId }: { id: ThreadId; projectId: number | null }): Promise<void> {
      await wait(randomLatency());
      const idx = items.findIndex((it) => it.id === id);
      if (idx < 0) throw new Error("not found");
      items[idx] = { ...items[idx], projectId, updatedAt: nowIso() };
    },
  };
  return repo;
}


