"use client";
import React from "react";
import Header from "@/features/shell/Header";
import Surface from "@ui/Surface";
import { ViewportMinusHeader } from "@ui";
import ThreadsRail from "@/features/shell/ThreadsRail";
import * as projectsRepoMod from "@/features/projects/api/repository";
import * as usersRepoMod from "@/features/users/api/repository";
import * as threadsRepoMod from "@/features/threads/api/repository";
import InspectorDock from "@/features/shell/InspectorDock";
import { extractWorkspaceInfoFromToken, getToken } from "@/lib/client/auth.client";
import { useUsersRepo } from "@/app/providers";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EvidenceProvider } from "@/features/inspector/context/EvidenceContext";
import { ChatModelProvider } from "@/features/chat/context/ChatModelContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? getToken() : null;
  const { workspaceName } = extractWorkspaceInfoFromToken(token ?? undefined);
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const usersRepo = useMocks ? usersRepoMod.createMockUsersRepository() : usersRepoMod.createServerUsersRepository();
  const { data: profile } = useSWR(["me"], () => usersRepo.me(), { revalidateOnFocus: true, dedupingInterval: 1000 });
  const router = useRouter();
  useEffect(() => {
    // 開発用: middlewareバイパス時はクライアントリダイレクトもしない
    const bypass = typeof window !== "undefined" && document.cookie.includes("auth_disabled=1");
    if (bypass) return;
    if (!token) router.replace("/login");
  }, [token, router]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>("gpt-4.1");
  useEffect(() => {
    try {
      const savedCollapse = typeof window !== "undefined" ? window.localStorage.getItem("sidebar_collapsed") : null;
      if (savedCollapse != null) setIsSidebarCollapsed(savedCollapse === "1");
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("chat_model") : null;
      if (saved) setCurrentModel(saved);
    } catch {}
  }, []);
  const handleSetCollapsed = (v: boolean) => {
    setIsSidebarCollapsed(v);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("sidebar_collapsed", v ? "1" : "0");
    } catch {}
  };
  return (
    <div className="min-h-screen">
      <ChatModelProvider
        value={currentModel}
        onChange={(m) => {
          setCurrentModel(m);
          try {
            if (typeof window !== "undefined") window.localStorage.setItem("chat_model", m);
          } catch {}
        }}
      >
        <EvidenceProvider>
          <div className="flex">
            {/* Left rail */}
            <aside className={isSidebarOpen ? "block md:block" : "hidden md:block"} style={{ contain: "layout" }}>
              <div className={["overflow-hidden transition-[width,opacity] duration-200", isSidebarCollapsed ? "w-0 opacity-0" : "w-[264px] opacity-100"].join(" ")}>
                <ThreadsRail
                  projectsRepo={useMocks ? projectsRepoMod.createMockProjectsRepository() : projectsRepoMod.createServerProjectsRepository()}
                  usersRepo={usersRepo}
                  threadsRepo={useMocks ? threadsRepoMod.createMockThreadsRepository() : threadsRepoMod.createServerThreadsRepository()}
                />
              </div>
            </aside>
            {/* Center column: Header + Content */}
            <ViewportMinusHeader className="flex-1 flex flex-col">
              <Surface variant="panel" className="flex-1 flex flex-col">
              <Header
                title={profile?.profile?.display_name || profile?.username || "Commai"}
                workspaceName={workspaceName ?? undefined}
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={handleSetCollapsed}
                onModelChange={(m) => setCurrentModel(m)}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                inspectorCollapsed={isInspectorCollapsed}
                setInspectorCollapsed={setIsInspectorCollapsed}
              />
              <div className="relative flex-1">
                {children}
              </div>
              </Surface>
            </ViewportMinusHeader>
            {/* Right dock */}
            <InspectorDock collapsed={isInspectorCollapsed} onToggle={setIsInspectorCollapsed} />
          </div>
        </EvidenceProvider>
      </ChatModelProvider>
    </div>
  );
}


