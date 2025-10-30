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

export function createClientAccountRepo(): AccountRepo {
  return {
    async updatePassword(i) { await (await import("@/lib/api/settings/account")).updatePassword(i); },
    async enableEmail2FA() { await (await import("@/lib/api/settings/account")).enableEmail2FA(); },
    async verifyEmail2FA(i) { await (await import("@/lib/api/settings/account")).verifyEmail2FA(i); },
    async disableEmail2FA() { await (await import("@/lib/api/settings/account")).disableEmail2FA(); },
    async requestEmailChange(i) { await (await import("@/lib/api/settings/account")).requestEmailChange(i); },
    async confirmEmailChange() { await (await import("@/lib/api/settings/account")).confirmEmailChange(); },
    async cancelEmailChange() { await (await import("@/lib/api/settings/account")).cancelEmailChange(); },
    async getMyProfile() { return (await import("@/lib/api/users")).apiGetMe(); },
  } as AccountRepo;
}

export function createClientBillingRepo(): BillingRepo {
  return { openPortal: async () => (await import("@/lib/api/settings/billing")).openBillingPortal() } as unknown as BillingRepo;
}

export function createClientUsersAccessRepo(): UsersAccessRepo {
  return {
    async listStores() { return (await import("@/lib/api/settings/usersAccess")).listStores(); },
    async listUsers(i) { return (await import("@/lib/api/settings/usersAccess")).listUsers(i); },
    async inviteUser(i) { await (await import("@/lib/api/settings/usersAccess")).inviteUser(i); },
    async updateRole(i) { await (await import("@/lib/api/settings/usersAccess")).updateRole(i); },
    async disableUser(i) { await (await import("@/lib/api/settings/usersAccess")).disableUser(i); },
  };
}

export function createClientConnectionsRepo(): ConnectionsRepo {
  return {
    async list() { return (await import("@/lib/api/settings/connections")).listConnections(); },
    async reauthUrl(i) { return (await import("@/lib/api/settings/connections")).reauthUrl(i); },
    async prereq() { return (await import("@/lib/api/settings/connections")).prereq(); },
    async initiate(i) { return (await import("@/lib/api/settings/connections")).initiate(i); },
    async authorize(i) { return (await import("@/lib/api/settings/connections")).authorize(i); },
    async sessionStatus(i) { return (await import("@/lib/api/settings/connections")).sessionStatus(i); },
    async notifyOnReady(i) { await (await import("@/lib/api/settings/connections")).notifyOnReady(i); },
    async sync(i) { await (await import("@/lib/api/settings/connections")).sync(i); },
    async unlink(i) { await (await import("@/lib/api/settings/connections")).unlink(i); },
    async lastError(i) { return (await import("@/lib/api/settings/connections")).lastError(i); },
  };
}

export function createClientRolesRepo(): RolesRepo {
  return {
    async list() { return (await import("@/lib/api/settings/roles")).listRoles(); },
    async create(i) { return (await import("@/lib/api/settings/roles")).createRole(i); },
    async update(i) { await (await import("@/lib/api/settings/roles")).updateRole(i); },
    async delete(id) { await (await import("@/lib/api/settings/roles")).deleteRole(id); },
    async estimate(i) { return (await import("@/lib/api/settings/roles")).estimateRoles(i); },
    async save(i) { return (await import("@/lib/api/settings/roles")).saveRoles(i); },
  };
}

export function createClientRunLogsRepo(): RunLogsRepo {
  return {
    async list() { return (await import("@/lib/api/settings/runLogs")).listRunLogs(); },
    async byThread(threadId) { return (await import("@/lib/api/settings/runLogs")).getRunLog(threadId); },
  };
}

export function createClientHelpRepo(): HelpRepo {
  return {
    async getFaq() { return (await import("@/lib/api/settings/help")).getFaq(); },
    async getGuides() { return (await import("@/lib/api/settings/help")).getGuides(); },
  };
}

export function createClientContactRepo(): ContactRepo {
  return { async post(i) { await (await import("@/lib/api/settings/contact")).postContact(i); } } as ContactRepo;
}



