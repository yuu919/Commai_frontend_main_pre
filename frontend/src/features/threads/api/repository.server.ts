import { apiListThreads, apiCreateThread, apiRenameThread, apiDeleteThread, apiMoveThread } from "@/lib/api/threads";
import type { ThreadsRepository, ThreadItem } from "@/features/threads/types";

export function createServerThreadsRepository(): ThreadsRepository {
  return {
    async list(): Promise<ThreadItem[]> { return apiListThreads(); },
    async create({ title }: { title?: string }): Promise<ThreadItem> {
      const { id } = await apiCreateThread({ title });
      return { id, title: title ?? "無題", projectId: null, updatedAt: new Date().toISOString() };
    },
    async rename({ id, title }: { id: string; title: string }): Promise<void> { await apiRenameThread(id, title); },
    async remove({ id }: { id: string }): Promise<void> { await apiDeleteThread(id); },
    async move({ id, projectId }: { id: string; projectId: number | null }): Promise<void> { await apiMoveThread(id, projectId); },
  };
}


