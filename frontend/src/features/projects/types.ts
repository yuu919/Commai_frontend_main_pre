import type { ProjectRow, ProjectChatRow } from "@/lib/db.types";

export interface ProjectsRepository {
  list: (options?: { offset?: number; limit?: number; query?: string; sort?: "updated_desc" | "title_asc" }) => Promise<ProjectRow[]>;
  get: (id: number) => Promise<ProjectRow | null>;
  listChats: (projectId: number) => Promise<ProjectChatRow[]>;
  addChat?: (projectId: number, threadId: string, title: string) => Promise<ProjectChatRow>; // mock専用
  create: (name: string, description?: string | null) => Promise<ProjectRow>;
  rename: (id: number, name: string, description?: string | null) => Promise<ProjectRow>;
  remove: (id: number) => Promise<{ success: boolean }>;
}


