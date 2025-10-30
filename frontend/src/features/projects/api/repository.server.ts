import type { ProjectsRepository } from "@/features/projects/types";
import type { ProjectRow, ProjectChatRow } from "@/lib/db.types";
import { apiListProjects, apiGetProject, apiListProjectChats, apiCreateProject, apiRenameProject, apiDeleteProject } from "@/lib/api/projects";

export function createServerProjectsRepository(): ProjectsRepository {
  return {
    async list(options?: { offset?: number; limit?: number; query?: string; sort?: "updated_desc" | "title_asc" }): Promise<ProjectRow[]> {
      return apiListProjects({ offset: options?.offset, limit: options?.limit, q: options?.query, sort: options?.sort });
    },
    async get(id: number): Promise<ProjectRow | null> { return apiGetProject(id); },
    async listChats(projectId: number): Promise<ProjectChatRow[]> { return apiListProjectChats(projectId); },
    async create(name: string, description?: string | null): Promise<ProjectRow> { return apiCreateProject(name, description); },
    async rename(id: number, name: string, description?: string | null): Promise<ProjectRow> { return apiRenameProject(id, name, description); },
    async remove(id: number): Promise<{ success: boolean }> { return apiDeleteProject(id); },
  };
}


