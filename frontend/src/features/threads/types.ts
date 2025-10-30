export type ThreadId = string; // UUIDv7 string（当面は文字列型）

export interface ThreadItem {
  id: ThreadId;
  title: string;
  projectId: number | null;
  updatedAt: string; // ISO8601
}

export interface ThreadsState {
  items: ThreadItem[];
  activeId: ThreadId | null;
  query: string;
}

export interface ThreadsController {
  state: ThreadsState;
  setActiveId: (id: ThreadId) => void;
  setQuery: (q: string) => void;
  createThread: (title?: string) => Promise<ThreadItem>;
  renameThread: (id: ThreadId, title: string) => Promise<void>;
  deleteThread: (id: ThreadId) => Promise<void>;
  moveToProject: (id: ThreadId, projectId: number | null) => Promise<void>;
  applyLocalTitle: (id: ThreadId, title: string) => void;
}

// Repository abstraction for Threads to enable server/mock implementations
export interface ThreadsRepository {
  list: () => Promise<ThreadItem[]>;
  create: (input: { title?: string }) => Promise<ThreadItem>;
  rename: (input: { id: ThreadId; title: string }) => Promise<void>;
  remove: (input: { id: ThreadId }) => Promise<void>;
  move: (input: { id: ThreadId; projectId: number | null }) => Promise<void>;
}


