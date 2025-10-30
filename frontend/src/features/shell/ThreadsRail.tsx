"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThreadsController } from "@/features/threads/logic/useThreadsController";
import { Toast, Input } from "@ui";
import HeaderShell from "@/features/threads/HeaderShell";
import ThreadsList from "@/features/threads/ThreadsList";
import ActionListItem from "@/features/threads/ActionListItem";
import type { ProjectsRepository } from "@/features/projects/types";
import type { UsersRepository } from "@/features/users/api/repository";
import type { ThreadsRepository } from "@/features/threads/types";
import { getToken, extractWorkspaceInfoFromToken } from "@/lib/client/auth.client";
import { logoutLegacy } from "@/lib/client/auth.client";
import { RowMenu } from "@ui";
import Surface from "@ui/Surface";
import MutedText from "@ui/MutedText";
import Button from "@ui/Button";
import useSWR from "swr";

export default function ThreadsRail({ children, loadError, projectsRepo, usersRepo, threadsRepo }: { children?: React.ReactNode; loadError?: string; projectsRepo: ProjectsRepository; usersRepo: UsersRepository; threadsRepo: ThreadsRepository }) {
  const router = useRouter();
  const controller = useThreadsController(undefined, threadsRepo);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const token = typeof window !== "undefined" ? getToken() : null;
  const info = extractWorkspaceInfoFromToken(token ?? undefined);
  const { data: profile } = useSWR(["me"], () => usersRepo.me(), { revalidateOnFocus: true, dedupingInterval: 1000 });
  const itemsAll = controller.state.items ?? [];
  const activeId = controller.state.activeId ?? null;
  const query = controller.state.query ?? "";
  const [queryInput, setQueryInput] = useState<string>(query);
  const items = (() => {
    const base = itemsAll.filter((it) => (it as { projectId?: string | number | null }).projectId == null);
    if (!query) return base;
    const q = query.toLowerCase();
    return base.filter((it) => it.title.toLowerCase().includes(q));
  })();
  const derivedError = loadError;

  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [projMenuOpenId, setProjMenuOpenId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState<string>("");
  const [dragOverProjectId, setDragOverProjectId] = useState<number | null>(null);
  const [lastRename, setLastRename] = useState<null | { kind: "thread" | "project"; id: string | number; prev: string; next: string }>(null);
  const selectedProjectId: number | null = (() => {
    const m = pathname?.match(/^\/projects\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();
  useEffect(() => {
    let mounted = true;
    projectsRepo
      .list()
      .then((list) => {
        if (!mounted) return;
        setProjects(list.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [projectsRepo]);

  function handleDropToProject(e: React.DragEvent<HTMLElement>, projectId: number | null) {
    e.preventDefault();
    const threadId = e.dataTransfer.getData("application/x-thread-id");
    if (!threadId) return;
    controller.moveToProject(threadId, projectId)
      .then(() => {
        const onProjectsPage = pathname?.match(/^\/projects\/(\d+)/);
        const currentPid = onProjectsPage ? Number(onProjectsPage[1]) : null;
        if ((projectId != null && currentPid === projectId) || (projectId === null && currentPid != null)) {
          try { router.refresh(); } catch {}
        }
        try {
          const repoAny = projectsRepo as unknown as { addChat?: (pid: number, chatId: string, title: string) => void };
          if (projectId != null && typeof repoAny.addChat === "function") {
            const moved = itemsAll.find(it => it.id === threadId);
            if (moved) repoAny.addChat(projectId, moved.id, moved.title);
          }
        } catch {}
      })
      .catch(() => {})
      .finally(() => setDragOverProjectId(null));
  }

  useEffect(() => {
    if (!pathname) return;
    const m = pathname.match(/\/threads\/([^/]+)/);
    const routeId = m?.[1];
    if (routeId && controller.state.activeId !== routeId) {
      controller.setActiveId(routeId);
    }
  }, [pathname, controller]);
  return (
    <aside
      id="threads-rail"
      className="relative w-full md:w-[264px] shrink-0 h-[100vh]"
      aria-label="Threads navigation"
    >
      {derivedError && <Toast message={derivedError} variant="error" />}
      <Surface variant="thread" className="h-full flex flex-col border-r">
        {derivedError && <Toast message={derivedError} variant="error" />}
        <HeaderShell>
          <div className="flex items-center gap-2">
            <Input
              size="sm"
              placeholder="検索..."
              value={queryInput}
              onChange={(e) => {
                const v = e.target.value;
                setQueryInput(v);
                window.clearTimeout((window as any)._thr_q_t);
                (window as any)._thr_q_t = window.setTimeout(() => controller.setQuery(v), 300);
              }}
            />
          </div>
        </HeaderShell>
        <Surface variant="panel" className="px-2 py-2 border-b">
          <ActionListItem
            label="新しいスレッド"
            onClick={async () => {
              try {
                const created = await controller.createThread();
                router.push(`/threads/${created.id}`);
              } catch {}
            }}
          />
        </Surface>
        <div className="flex-1 min-h-0 overflow-auto">
          {projects.length > 0 && (
        <div className="px-2 pt-2 text-[10px]">
              <MutedText level={30}>プロジェクト</MutedText>
              <ul className="mt-1 space-y-1">
            {projects.map(p => (
              <li key={p.id}>
                <Surface
                  interactive
                  active={selectedProjectId === p.id || dragOverProjectId === p.id}
                  radius="xs"
                  className="px-2 py-2 text-xs cursor-pointer group flex items-center justify-between gap-1"
                  onClick={() => { if (editingProjectId == null) router.push(`/projects/${p.id}`); }}
                  onDragOver={(e)=> { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverProjectId !== p.id) setDragOverProjectId(p.id); }}
                  onDragEnter={(ev)=> { ev.preventDefault(); setDragOverProjectId(p.id); }}
                  onDragLeave={(e)=> { setDragOverProjectId(null); }}
                  onDrop={(e)=> handleDropToProject(e, p.id)}
                  role="button"
                  aria-label={`${p.name} を開く`}
                >
                {editingProjectId === p.id ? (
                  <Input
                    size="sm"
                    value={editingProjectName}
                    onChange={(e)=> setEditingProjectName(e.target.value)}
                    onClick={(e)=> e.stopPropagation()}
                    onKeyDown={async (e)=>{
                      if (e.key === "Escape") { setEditingProjectId(null); setEditingProjectName(""); setProjMenuOpenId(null); }
                      if (e.key === "Enter") {
                        const next = editingProjectName.trim();
                        if (!next || next === p.name) { setEditingProjectId(null); setProjMenuOpenId(null); return; }
                        try {
                          setLastRename({ kind: "project", id: p.id, prev: p.name, next });
                          await projectsRepo.rename(p.id, next);
                          const list = await projectsRepo.list();
                          setProjects(list.map(x=>({ id: x.id, name: x.name })));
                        } finally {
                          setEditingProjectId(null);
                          setProjMenuOpenId(null);
                        }
                      }
                    }}
                    onBlur={async ()=>{
                      const next = editingProjectName.trim();
                      if (!next || next === p.name) { setEditingProjectId(null); setProjMenuOpenId(null); return; }
                      try {
                        setLastRename({ kind: "project", id: p.id, prev: p.name, next });
                        await projectsRepo.rename(p.id, next);
                        const list = await projectsRepo.list();
                        setProjects(list.map(x=>({ id: x.id, name: x.name })));
                      } finally {
                        setEditingProjectId(null);
                        setProjMenuOpenId(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="truncate flex items-center gap-2"
                    onDoubleClick={(e)=>{ e.stopPropagation(); setEditingProjectId(p.id); setEditingProjectName(p.name); }}
                  >
                    <MutedText level={40}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                      </svg>
                    </MutedText>
                    <span className="truncate">{p.name}</span>
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 px-1 py-0.5"
                  aria-label="プロジェクトメニュー"
                  onClick={(e)=> { e.stopPropagation(); setProjMenuOpenId(prev => prev===p.id ? null : p.id); }}
                >…</Button>
                {projMenuOpenId === p.id && (
                  <div className="relative">
                    <RowMenu open={true} onClose={()=> setProjMenuOpenId(null)} align="right" label="プロジェクトメニュー">
                      <div className="p-1 space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          role="menuitem"
                          onClick={()=>{
                            setProjMenuOpenId(null);
                            setTimeout(()=>{
                              setEditingProjectId(p.id);
                              setEditingProjectName(p.name);
                            }, 0);
                          }}
                        >名前を変更する</Button>
                        <div className="border-t my-1" />
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-full justify-start text-xs"
                          role="menuitem"
                          onClick={async ()=>{
                            const ok = window.confirm("プロジェクトを削除しますか？この操作は取り消せません。");
                            if (!ok) { setProjMenuOpenId(null); return; }
                            try {
                              await projectsRepo.remove(p.id);
                              const list = await projectsRepo.list();
                              setProjects(list.map(x=>({ id: x.id, name: x.name })));
                            } finally { setProjMenuOpenId(null); }
                          }}
                        >プロジェクトを削除する</Button>
                      </div>
                    </RowMenu>
                  </div>
                )}
                </Surface>
              </li>
            ))}
          </ul>
        </div>
          )}
          <ThreadsList
            items={items}
            activeId={activeId}
            onSelect={(id: string) => {
              controller.setActiveId(id);
              router.push(`/threads/${id}`);
            }}
            onRename={(id: string, title: string) => {
              const prev = itemsAll.find((it) => it.id === id)?.title;
              if (prev && prev !== title) setLastRename({ kind: "thread", id, prev, next: title });
              controller.renameThread(id, title);
            }}
            onDelete={(id: string) => controller.deleteThread(id)}
            onMoveToProject={async (id: string, projectId: number | null) => controller.moveToProject(id, projectId)}
            projects={projects}
            onCreateProject={async (name: string) => {
              const created = await projectsRepo.create(name);
              const list = await projectsRepo.list();
              setProjects(list.map((p) => ({ id: p.id, name: p.name })));
              return { id: created.id, name: created.name };
            }}
          />
        </div>
        {children}
        <Surface variant="panel" className="mt-auto px-2 py-2 border-t text-xs shrink-0"
             onDragOver={(e)=> e.preventDefault()}
             onDrop={(e)=> handleDropToProject(e, null)}
        >
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-2 py-1"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="truncate max-w-[140px]">{info.workspaceName || "Default Workspace"}</span>
              <span aria-hidden>{menuOpen ? "▴" : "▾"}</span>
            </Button>
            <RowMenu open={menuOpen} onClose={() => setMenuOpen(false)} align="left" placement="up" label="アカウントメニュー">
              <div className="px-3 py-2" role="menuitem" aria-disabled="true">
                <MutedText level={30}>{profile?.email ?? "メールアドレス未取得"}</MutedText>
              </div>
              <div className="border-t my-1" />
              <Button variant="ghost" size="sm" className="w-full justify-start" role="menuitem" onClick={() => { setMenuOpen(false); }}>ワークスペース切替</Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" role="menuitem" asChild>
                <Link href="/settings/account">管理画面</Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" role="menuitem" asChild>
                <Link href="/settings/help">ヘルプ</Link>
              </Button>
              <div className="border-t my-1" />
              <Button variant="danger" size="sm" className="w-full justify-start" role="menuitem" onClick={() => logoutLegacy().then(() => (window.location.href = "/"))}>ログアウト</Button>
            </RowMenu>
          </div>
        </Surface>
      </Surface>
    </aside>
  );
}
