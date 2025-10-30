import type {
  AccountRepo,
  BillingRepo,
  UsersAccessRepo,
  ConnectionsRepo,
  RolesRepo,
  RunLogsRepo,
  HelpRepo,
  ContactRepo,
} from "./types";

export function createMockAccountRepo(): AccountRepo {
  return {
    async updatePassword() {}, async enableEmail2FA() {}, async verifyEmail2FA() {}, async disableEmail2FA() {},
    async requestEmailChange() {}, async confirmEmailChange() {}, async cancelEmailChange() {},
    async getMyProfile() { return { email: 'mock.user@example.com' }; },
  };
}

export function createMockBillingRepo(): BillingRepo {
  return { openPortal: async () => ({ url: "https://billing.mock.local/portal" }) } as BillingRepo;
}

import { mockPermissions } from "@/data/mock/permissions";

export function createMockUsersAccessRepo(): UsersAccessRepo {
  return {
    async listStores() {
      const items = mockPermissions.stores.map(s => ({ storeId: s.id, storeName: s.name }));
      return { items };
    },
    async listUsers(i) {
      const { users, assignments } = mockPermissions as any;
      const storeAssigns = assignments.filter((a: any) => a.subject === 'store' && a.subjectId === i.storeId);
      const joined = storeAssigns.map((a: any, idx: number) => {
        const u = users.find((x: any) => x.id === a.userId) || { id: `u-${idx}`, name: `User ${idx}`, email: `user${idx}@example.com`, status: 'active' };
        return { id: u.id, name: u.name, email: u.email, status: u.status || 'active', role: a.role || 'general', updatedAt: a.updatedAt, scopeStoreId: a.subjectId } as any;
      });
      return { items: joined };
    },
    async inviteUser() {}, async updateRole() {}, async disableUser() {},
  };
}

export function createMockConnectionsRepo(): ConnectionsRepo {
  return {
    async list() {
      const now = Date.now();
      const inDays = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000).toISOString();
      const { buildDefaultServices } = await import("@/data/mock/settings/connectionServices");
      const items = mockPermissions.stores.map(s => ({
        storeId: s.id,
        storeName: s.name,
        // services expected by UI
        services: buildDefaultServices(inDays),
      }));
      return { items } as any;
    },
    async reauthUrl() { return { authUrl: "https://auth.mock.local/reauth" }; },
    async prereq() { return { hasStore: mockPermissions.stores.length > 0, stores: mockPermissions.stores.map(s => ({ id: s.id, name: s.name })) }; },
    async initiate() { return { sessionId: "sess-mock-1", scopes: { sp_ads: ["profile", "ads.read"] } }; },
    async authorize() { return { authUrl: "https://amazon.mock.local/oauth" }; },
    async sessionStatus() { return { state: 'success', storeId: mockPermissions.stores[0]?.id || 'store-1', details: [{ service: 'sp_ads', status: 'success' }] }; },
    async notifyOnReady() { return; },
    async sync() { return; },
    async unlink() { return; },
    async lastError() { return null; },
  };
}

import { rolesCategories } from "@/data/mock/settings/rolesCategories";

export function createMockRolesRepo(): RolesRepo {
  return {
    async list() {
      // Expand with categories/resources used in UI (ResourceDef-like)
      const mk = (cat: { id: string; label: string }, idx: number) => ({
        id: `${cat.id}-${idx}`,
        categoryId: cat.id,
        categoryLabel: cat.label,
        name: idx % 2 === 0 ? `閲覧` : `編集`,
        description: idx % 2 === 0 ? `閲覧可能範囲` : `編集可能範囲`,
        aliases: idx % 2 === 0 ? ["read", "view"] : ["write", "edit"],
        threshold: (idx % 3 === 0 ? 'owner' : idx % 3 === 1 ? 'manager' : 'general') as any,
      });
      const items = [
        ...Array.from({ length: 5 }).map((_, i) => mk(rolesCategories[0], i + 1)),
        ...Array.from({ length: 4 }).map((_, i) => mk(rolesCategories[1], i + 1)),
        ...Array.from({ length: 6 }).map((_, i) => mk(rolesCategories[2], i + 1)),
      ];
      return { items } as any;
    },
    async create() { return { id: "role-3" }; },
    async update() {},
    async delete() {},
    async estimate() { return { impact: [{ metric: 'affected_users', delta: 12 }] } as any; },
    async save() { return { ok: true } as any; },
  };
}

export function createMockRunLogsRepo(): RunLogsRepo {
  return {
    async list() {
      const { buildRunLogThreads } = await import("@/data/mock/settings/runLogs");
      return { items: buildRunLogThreads() } as any;
    },
    async byThread(arg: any) {
      const threadId: string = typeof arg === 'string' ? arg : (arg && arg.threadId) ? String(arg.threadId) : 'th-0';
      const { buildRunsForThread } = await import("@/data/mock/settings/runLogs");
      return { items: buildRunsForThread(threadId) } as any;
    },
  };
}

export function createMockHelpRepo(): HelpRepo {
  return {
    async getFaq() { return { items: [] }; },
    async getGuides() { return { items: [] }; },
  };
}

export function createMockContactRepo(): ContactRepo {
  return { async post() {} } as ContactRepo;
}


