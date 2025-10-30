"use client";
import { SWRConfig } from "swr";
import { ToastProvider, useToast } from "@ui/Toast";
import { normalizeHttpError } from "@/lib/error";
import { categorizeHttpStatus } from "@/lib/error";
import React, { createContext, useContext, useMemo } from "react";
import type { ThreadsRepository } from "@/features/threads/types";
import type { ProjectsRepository } from "@/features/projects/types";
import type { MessagesRepository } from "@/features/chat/types";
import type { UsersRepository } from "@/features/users/api/repository";
import * as threadsRepo from "@/features/threads/api/repository";
import * as projectsRepo from "@/features/projects/api/repository";
import * as usersRepo from "@/features/users/api/repository";
import * as chatRepo from "@/features/chat/api/repository";
// settings repositories
import type {
  AccountRepo,
  BillingRepo,
  UsersAccessRepo,
  ConnectionsRepo,
  RolesRepo,
  RunLogsRepo,
  HelpRepo,
  ContactRepo,
} from "@/features/settings/api/types";
import * as settingsApi from "@/features/settings/api";

declare global {
  interface Window {
    __messagesRepo?: MessagesRepository;
  }
}

function SWRWithToast({ children }: { children: React.ReactNode }) {
  const { push } = useToast();
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        dedupingInterval: 1000,
        onError: (err: unknown) => {
          const status = typeof err === "object" && err && "status" in (err as Record<string, unknown>)
            ? Number((err as { status?: unknown }).status) || 500
            : 500;
          const message = typeof err === "object" && err && "message" in (err as Record<string, unknown>)
            ? String((err as { message?: unknown }).message ?? "")
            : String(err ?? "");
          const e = normalizeHttpError(status, message);
          const pres = categorizeHttpStatus(status);
          // 現状は Toast のみ実装。Banner が必要な場合は上位で画面コンポーネントに伝播するIFを検討
          push({ message: e.message, variant: pres.variant === "warn" ? "warning" : pres.variant });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

const ThreadsRepoContext = createContext<ThreadsRepository | null>(null);
export function useThreadsRepo(): ThreadsRepository {
  const ctx = useContext(ThreadsRepoContext);
  if (!ctx) throw new Error("ThreadsRepository not provided");
  return ctx;
}

const MessagesRepoContext = createContext<MessagesRepository | null>(null);
export function useMessagesRepo(): MessagesRepository {
  const ctx = useContext(MessagesRepoContext);
  if (!ctx) throw new Error("MessagesRepository not provided");
  return ctx;
}

const ProjectsRepoContext = createContext<ProjectsRepository | null>(null);
export function useProjectsRepo(): ProjectsRepository {
  const ctx = useContext(ProjectsRepoContext);
  if (!ctx) throw new Error("ProjectsRepository not provided");
  return ctx;
}

const UsersRepoContext = createContext<UsersRepository | null>(null);
export function useUsersRepo(): UsersRepository {
  const ctx = useContext(UsersRepoContext);
  if (!ctx) throw new Error("UsersRepository not provided");
  return ctx;
}

// settings repo contexts
const AccountRepoContext = createContext<AccountRepo | null>(null);
export function useAccountRepo(): AccountRepo {
  const ctx = useContext(AccountRepoContext);
  if (!ctx) throw new Error("AccountRepo not provided");
  return ctx;
}

const BillingRepoContext = createContext<BillingRepo | null>(null);
export function useBillingRepo(): BillingRepo {
  const ctx = useContext(BillingRepoContext);
  if (!ctx) throw new Error("BillingRepo not provided");
  return ctx;
}

const UsersAccessRepoContext = createContext<UsersAccessRepo | null>(null);
export function useUsersAccessRepo(): UsersAccessRepo {
  const ctx = useContext(UsersAccessRepoContext);
  if (!ctx) throw new Error("UsersAccessRepo not provided");
  return ctx;
}

const ConnectionsRepoContext = createContext<ConnectionsRepo | null>(null);
export function useConnectionsRepo(): ConnectionsRepo {
  const ctx = useContext(ConnectionsRepoContext);
  if (!ctx) throw new Error("ConnectionsRepo not provided");
  return ctx;
}

const RolesRepoContext = createContext<RolesRepo | null>(null);
export function useRolesRepo(): RolesRepo {
  const ctx = useContext(RolesRepoContext);
  if (!ctx) throw new Error("RolesRepo not provided");
  return ctx;
}

const RunLogsRepoContext = createContext<RunLogsRepo | null>(null);
export function useRunLogsRepo(): RunLogsRepo {
  const ctx = useContext(RunLogsRepoContext);
  if (!ctx) throw new Error("RunLogsRepo not provided");
  return ctx;
}

const HelpRepoContext = createContext<HelpRepo | null>(null);
export function useHelpRepo(): HelpRepo {
  const ctx = useContext(HelpRepoContext);
  if (!ctx) throw new Error("HelpRepo not provided");
  return ctx;
}

const ContactRepoContext = createContext<ContactRepo | null>(null);
export function useContactRepo(): ContactRepo {
  const ctx = useContext(ContactRepoContext);
  if (!ctx) throw new Error("ContactRepo not provided");
  return ctx;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const useMocks = typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const repo = useMemo<ThreadsRepository>(() => (useMocks ? threadsRepo.createMockThreadsRepository() : threadsRepo.createServerThreadsRepository()), [useMocks]);
  const msgRepo = useMemo<MessagesRepository>(() => (useMocks ? chatRepo.createMockMessagesRepository() : chatRepo.createServerMessagesRepository()), [useMocks]);
  // expose repo for mock-only editing from components without prop drilling
  if (typeof window !== "undefined") {
    window.__messagesRepo = msgRepo;
  }
  const projRepo = useMemo<ProjectsRepository>(() => (useMocks ? projectsRepo.createMockProjectsRepository() : projectsRepo.createServerProjectsRepository()), [useMocks]);
  const usersRepoInst = useMemo<UsersRepository>(() => (useMocks ? usersRepo.createMockUsersRepository() : usersRepo.createServerUsersRepository()), [useMocks]);
  // settings repos
  const accountRepo = useMemo<AccountRepo>(() => (useMocks ? settingsApi.createMockAccountRepo() : settingsApi.createClientAccountRepo()), [useMocks]);
  const billingRepo = useMemo<BillingRepo>(() => (useMocks ? settingsApi.createMockBillingRepo() : settingsApi.createClientBillingRepo()), [useMocks]);
  const usersAccessRepo = useMemo<UsersAccessRepo>(() => (useMocks ? settingsApi.createMockUsersAccessRepo() : settingsApi.createClientUsersAccessRepo()), [useMocks]);
  const connectionsRepo = useMemo<ConnectionsRepo>(() => (useMocks ? settingsApi.createMockConnectionsRepo() : settingsApi.createClientConnectionsRepo()), [useMocks]);
  const rolesRepo = useMemo<RolesRepo>(() => (useMocks ? settingsApi.createMockRolesRepo() : settingsApi.createClientRolesRepo()), [useMocks]);
  const runLogsRepo = useMemo<RunLogsRepo>(() => (useMocks ? settingsApi.createMockRunLogsRepo() : settingsApi.createClientRunLogsRepo()), [useMocks]);
  const helpRepo = useMemo<HelpRepo>(() => (useMocks ? settingsApi.createMockHelpRepo() : settingsApi.createClientHelpRepo()), [useMocks]);
  const contactRepo = useMemo<ContactRepo>(() => (useMocks ? settingsApi.createMockContactRepo() : settingsApi.createClientContactRepo()), [useMocks]);
  return (
    <ToastProvider>
      <SWRWithToast>
        <ThreadsRepoContext.Provider value={repo}>
          <MessagesRepoContext.Provider value={msgRepo}>
            <ProjectsRepoContext.Provider value={projRepo}>
              <UsersRepoContext.Provider value={usersRepoInst}>
                <AccountRepoContext.Provider value={accountRepo}>
                  <BillingRepoContext.Provider value={billingRepo}>
                    <UsersAccessRepoContext.Provider value={usersAccessRepo}>
                      <ConnectionsRepoContext.Provider value={connectionsRepo}>
                        <RolesRepoContext.Provider value={rolesRepo}>
                          <RunLogsRepoContext.Provider value={runLogsRepo}>
                            <HelpRepoContext.Provider value={helpRepo}>
                              <ContactRepoContext.Provider value={contactRepo}>
                                {children}
                              </ContactRepoContext.Provider>
                            </HelpRepoContext.Provider>
                          </RunLogsRepoContext.Provider>
                        </RolesRepoContext.Provider>
                      </ConnectionsRepoContext.Provider>
                    </UsersAccessRepoContext.Provider>
                  </BillingRepoContext.Provider>
                </AccountRepoContext.Provider>
              </UsersRepoContext.Provider>
            </ProjectsRepoContext.Provider>
          </MessagesRepoContext.Provider>
        </ThreadsRepoContext.Provider>
      </SWRWithToast>
    </ToastProvider>
  );
}


