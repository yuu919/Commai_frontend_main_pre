import type { ProjectsRepository } from "@/features/projects/types";
import type { ProjectRow, ProjectChatRow } from "@/lib/db.types";

function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function lat() { return 120 + Math.floor(Math.random() * 200); }

export function createMockProjectsRepository(): ProjectsRepository {
  let projects: ProjectRow[] = [
    { id: 1, name: "デモプロジェクトA", description: null },
    { id: 2, name: "UI改善", description: "サイドバーとヘッダの再設計" },
    { id: 3, name: "バックログ", description: null },
  ];
  for (let i = 4; i <= 50; i++) {
    projects.push({ id: i, name: `ダミープロジェクト ${String(i).padStart(2, "0")}`, description: i % 3 === 0 ? "検証用メモ" : null });
  }

  const chats: Record<number, ProjectChatRow[]> = {};
  chats[1] = [ { id: crypto.randomUUID(), title: "要件整理" }, { id: crypto.randomUUID(), title: "初回レビュー" } ];
  chats[2] = [ { id: crypto.randomUUID(), title: "ナビゲーション改善" } ];
  chats[3] = [];
  for (let i = 4; i <= 50; i++) {
    const count = i % 6;
    chats[i] = Array.from({ length: count }).map((_, idx) => ({ id: crypto.randomUUID(), title: `検証チャット ${i}-${idx + 1}` }));
  }
  return {
    async list(options?: { offset?: number; limit?: number; query?: string; sort?: "updated_desc" | "title_asc" }) {
      await wait(lat());
      let list = [...projects];
      if (options?.query) list = list.filter(p => p.name.toLowerCase().includes(options.query!.toLowerCase()));
      if (options?.sort === "title_asc") list = list.sort((a,b)=> a.name.localeCompare(b.name));
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? list.length;
      return list.slice(offset, offset + limit);
    },
    async get(id: number) { await wait(lat()); return projects.find(p => p.id === id) ?? null; },
    async listChats(projectId: number) { await wait(lat()); return [...(chats[projectId] ?? [])]; },
    async addChat(projectId: number, threadId: string, title: string) {
      await wait(lat());
      const row: ProjectChatRow = { id: threadId, title };
      chats[projectId] = [row, ...(chats[projectId] ?? [])];
      return row;
    },
    async create(name: string, description?: string | null) {
      await wait(lat());
      const p: ProjectRow = { id: Math.max(0, ...projects.map(p=>p.id)) + 1, name: name.trim(), description: description ?? null };
      projects = [p, ...projects];
      return p;
    },
    async rename(id: number, name: string, description?: string | null) {
      await wait(lat());
      const idx = projects.findIndex(p=>p.id===id);
      if (idx>=0) projects[idx] = { ...projects[idx], name: name.trim(), description: description ?? projects[idx].description };
      return projects[idx];
    },
    async remove(id: number) {
      await wait(lat());
      projects = projects.filter(p=>p.id!==id);
      delete chats[id];
      return { success: true };
    },
  } as unknown as ProjectsRepository;
}


