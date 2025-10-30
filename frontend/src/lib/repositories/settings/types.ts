export interface AccountRepo {
  updatePassword(input: { currentPassword: string; newPassword: string }): Promise<void>;
  enableEmail2FA(): Promise<void>;
  verifyEmail2FA(input: { code: string }): Promise<void>;
  disableEmail2FA(): Promise<void>;
  requestEmailChange(input: { newEmail: string }): Promise<void>;
  confirmEmailChange(): Promise<void>;
  cancelEmailChange(): Promise<void>;
  getMyProfile?(): Promise<{ email?: string }>; // optional for backward compat
}

export interface BillingRepo { openPortal(): Promise<{ url: string }>; }

export type StoreItem = { storeId: string; storeName: string };
export interface UsersAccessRepo {
  listStores(): Promise<{ items: StoreItem[] }>;
  listUsers(input: { platformId: string; storeId: string; roles?: string[]; statuses?: string[]; sort?: string; q?: string }): Promise<{ items: Array<{ id: string; name: string; email: string; status: string; role: string; updatedAt?: string; scopeStoreId?: string }> }>;
  inviteUser(input: { storeId: string; email: string; role: string }): Promise<void>;
  updateRole(input: { storeId: string; userId: string; role: string }): Promise<void>;
  disableUser(input: { storeId: string; userId: string }): Promise<void>;
}

export type ConnectionItem = { storeId: string; storeName: string; service: string; status: string };
export interface ConnectionsRepo {
  list(): Promise<{ items: ConnectionItem[] }>;
  reauthUrl(input: { storeId: string; service: string }): Promise<{ authUrl: string }>;
  prereq(): Promise<{ hasStore: boolean; stores: Array<{ id: string; name: string }> }>;
  initiate(input: { storeId: string; services: string[] }): Promise<{ sessionId: string; scopes?: Record<string, string[]> }>;
  authorize(input: { sessionId: string }): Promise<{ authUrl: string }>;
  sessionStatus(input: { sessionId: string }): Promise<{ state: 'success' | 'partial' | 'failed'; storeId: string; details: Array<{ service: string; status: 'success' | 'failed'; message?: string }> }>;
  notifyOnReady(input: { storeId: string; services: string[] }): Promise<void>;
  sync(input: { storeId: string; service: string; bulk?: boolean }): Promise<void>;
  unlink(input: { storeId: string; service: string }): Promise<void>;
  lastError(input: { storeId: string; service: string }): Promise<{ code: string; message: string; detail?: string; occurredAt?: string } | null>;
}

export type RoleItem = { id: string; name: string; description?: string };
export interface RolesRepo {
  list(): Promise<{ items: RoleItem[] }>;
  create(input: { name: string; description?: string }): Promise<{ id: string }>;
  update(input: { id: string; name?: string; description?: string }): Promise<void>;
  delete(id: string): Promise<void>;
  estimate?(input: { changes: Array<{ resourceId: string; threshold: 'owner'|'manager'|'general'|'none' }> }): Promise<{ impact: Array<{ metric: string; delta: number }> }>;
  save?(input: { changes: Array<{ resourceId: string; threshold: 'owner'|'manager'|'general'|'none' }> }): Promise<{ ok: true }>;
}

export type RunLogItem = { id: string; threadId: string; status: string; createdAt: string };
export interface RunLogsRepo {
  list(): Promise<{ items: RunLogItem[] }>;
  byThread(threadId: string): Promise<{ items: RunLogItem[] }>;
}

export interface HelpRepo {
  getFaq(): Promise<{ items: Array<{ q: string; a: string }> }>;
  getGuides(): Promise<{ items: Array<{ title: string; url: string }> }>;
}

export interface ContactRepo { post(input: { title: string; body: string }): Promise<void>; }



