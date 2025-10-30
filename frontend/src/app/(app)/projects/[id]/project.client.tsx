"use client";
import React, { useEffect, useMemo, useState } from "react";
import { MutedText } from "@ui";
import * as projectsRepoMod from "@/features/projects/api/repository";
import * as threadsRepoMod from "@/features/threads/api/repository";
import * as messagesRepoMod from "@/features/chat/api/repository";
import ProjectView from "@/features/projects/ProjectView";
import { useToast } from "@ui/Toast";
import { normalizeHttpError } from "@/lib/error";
import { useRouter } from "next/navigation";

export default function ProjectDetailClient({ id: idStr }: { id: string }) {
  const [id, setId] = useState<number | null>(() => {
    const n = Number(idStr);
    return Number.isFinite(n) ? n : null;
  });

  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const projectsRepo = useMocks ? projectsRepoMod.createMockProjectsRepository() : projectsRepoMod.createServerProjectsRepository();
  const threadsRepo = useMocks ? threadsRepoMod.createMockThreadsRepository() : threadsRepoMod.createServerThreadsRepository();
  const messagesRepo = useMocks ? messagesRepoMod.createMockMessagesRepository() : messagesRepoMod.createServerMessagesRepository();
  const { push } = useToast();
  const router = useRouter();
  const [projName, setProjName] = useState<string>("");
  const [projDesc, setProjDesc] = useState<string | null>(null);
  const [chatItems, setChatItems] = useState<{ id: string; title: string; updated_at?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id == null) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const p = await projectsRepo.get(id);
        if (!mounted) return;
        if (!p) {
          setError("プロジェクトが見つかりません");
          setLoading(false);
          return;
        }
        setProjName(p.name);
        setProjDesc(p.description ?? null);
        const chats = await projectsRepo.listChats(id);
        if (!mounted) return;
        setChatItems(chats.map(c => ({ id: c.id, title: c.title, updated_at: (c as any).updated_at })));
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(normalizeHttpError(500, msg).message);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, projectsRepo]);

  const project = useMemo(() => (id != null ? { id, name: projName, description: projDesc } : null), [id, projName, projDesc]);

  if (id == null) return <div className="p-4 text-sm">不正なプロジェクトIDです</div>;
  if (error) return <div className="p-4 text-sm"><MutedText variant="error">{error}</MutedText></div>;
  if (!project) return <div className="p-4 text-sm">プロジェクトが見つかりません</div>;

  return (
    <ProjectView
      id={id}
      name={project.name}
      description={project.description ?? null}
      chats={chatItems}
      onRename={async (p)=> {
        try {
          await projectsRepo.rename(id, p.name, p.description);
          push({ message: "保存しました", variant: "success" });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          push({ message: normalizeHttpError(500, msg).message, variant: "error" });
        }
      }}
      isLoading={loading}
      error={null}
      onRetry={async () => {
        // trigger re-fetch via effect
        if (id == null) return;
        try {
          setLoading(true);
          const p = await projectsRepo.get(id);
          setProjName(p?.name ?? "");
          setProjDesc(p?.description ?? null);
          const chats = await projectsRepo.listChats(id);
          setChatItems(chats.map(c => ({ id: c.id, title: c.title, updated_at: (c as any).updated_at })));
          setLoading(false);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          push({ message: normalizeHttpError(500, msg).message, variant: "error" });
          setLoading(false);
        }
      }}
      threadsRepo={threadsRepo}
      messagesRepo={messagesRepo}
    />
  );
}


