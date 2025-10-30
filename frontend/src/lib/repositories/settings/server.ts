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

export function createServerAccountRepo(): AccountRepo {
  return {
    async updatePassword(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).updatePassword(i, h); },
    async enableEmail2FA() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).enableEmail2FA(h); },
    async verifyEmail2FA(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).verifyEmail2FA(i, h); },
    async disableEmail2FA() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).disableEmail2FA(h); },
    async requestEmailChange(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).requestEmailChange(i, h); },
    async confirmEmailChange() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).confirmEmailChange(h); },
    async cancelEmailChange() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/account")).cancelEmailChange(h); },
    async getMyProfile() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/users")).apiGetMe(); },
  } as AccountRepo;
}

export function createServerBillingRepo(): BillingRepo {
  return { openPortal: async () => (await import("@/lib/api/settings/billing")).openBillingPortal() } as unknown as BillingRepo;
}

export function createServerUsersAccessRepo(): UsersAccessRepo {
  return {
    async listStores() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/usersAccess")).listStores(h); },
    async listUsers(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/usersAccess")).listUsers(i, h); },
    async inviteUser(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/usersAccess")).inviteUser(i, h); },
    async updateRole(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/usersAccess")).updateRole(i, h); },
    async disableUser(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/usersAccess")).disableUser(i, h); },
  };
}

export function createServerConnectionsRepo(): ConnectionsRepo {
  return {
    async list() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).listConnections(h); },
    async reauthUrl(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).reauthUrl(i, h); },
    async prereq() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).prereq(h); },
    async initiate(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).initiate(i, h); },
    async authorize(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).authorize(i, h); },
    async sessionStatus(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).sessionStatus(i, h); },
    async notifyOnReady(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/connections")).notifyOnReady(i, h); },
    async sync(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/connections")).sync(i, h); },
    async unlink(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/connections")).unlink(i, h); },
    async lastError(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/connections")).lastError(i, h); },
  };
}

export function createServerRolesRepo(): RolesRepo {
  return {
    async list() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/roles")).listRoles(h); },
    async create(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/roles")).createRole(i, h); },
    async update(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/roles")).updateRole(i, h); },
    async delete(id) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/roles")).deleteRole(id, h); },
    async estimate(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/roles")).estimateRoles(i, h); },
    async save(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/roles")).saveRoles(i, h); },
  };
}

export function createServerRunLogsRepo(): RunLogsRepo {
  return {
    async list() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/runLogs")).listRunLogs(h); },
    async byThread(threadId) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/runLogs")).getRunLog(threadId, h); },
  };
}

export function createServerHelpRepo(): HelpRepo {
  return {
    async getFaq() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/help")).getFaq(h); },
    async getGuides() { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); return (await import("@/lib/api/settings/help")).getGuides(h); },
  };
}

export function createServerContactRepo(): ContactRepo {
  return { async post(i) { const h = (await import("@/lib/server/auth.server")).buildServerUnifiedHeaders(); await (await import("@/lib/api/settings/contact")).postContact(i, h); } } as ContactRepo;
}



