"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ProjectHeader from "./ProjectHeader";
import ProjectChatList, { ProjectChatItem } from "./ProjectChatList";
 
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ThreadsRepository } from "@/features/threads/types";
import type { MessagesRepository } from "@/features/chat/types";
import { Input, Button } from "@ui";
import Composer from "@/features/chat/Composer";
import { useToast } from "@ui/Toast";

export default function ProjectView({
  id,
  name,
  description,
  chats,
  onRename,
  onShare,
  onDelete,
  isLoading,
  error,
  onRetry,
  threadsRepo,
  messagesRepo,
}: {
  id: number;
  name: string;
  description?: string | null;
  chats: ProjectChatItem[];
  onRename: (p: { name: string; description: string | null }) => void;
  onShare?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  threadsRepo: ThreadsRepository;
  messagesRepo: MessagesRepository;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [question, setQuestion] = useState("");
  
  const [selected, setSelected] = useState<string | null>(null);
  const [sort] = useState<"updated_desc" | "title_asc">("updated_desc");

  const filtered = useMemo(() => {
    return [...chats];
  }, [chats]);

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader id={id} name={name} description={description ?? null} onUpdated={onRename} repo={{ rename: threadsRepo.rename as any } as any} />
      <div className="flex-1 p-4 grid grid-cols-1 gap-4">
        <div>
          <div className="mb-3">
            <Composer
              onSend={async (text)=>{
                if (!text?.trim()) return;
                try {
                  const created = await threadsRepo.create({ title: text.trim().slice(0, 60) });
                  try { await threadsRepo.move({ id: created.id, projectId: id }); } catch {}
                  try { await messagesRepo.create(String(created.id), { role: "user", content: text.trim() }); } catch {}
                  router.push(`/threads/${created.id}`);
                } catch (err: any) {
                  push({ message: String(err?.message ?? err ?? "作成に失敗しました"), variant: "error" });
                }
              }}
              allowAttachments={false}
              showErrorInline={false}
              repo={messagesRepo}
            />
          </div>
          <ProjectChatList
            chats={filtered}
            selectedId={selected}
            onSelect={(id)=>{ setSelected(id); router.push(`/threads/${id}`); }}
            onRename={async (tid, title)=>{
              try {
                await threadsRepo.rename({ id: tid, title });
              } catch {}
            }}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
          />
        </div>
      </div>
    </div>
  );
}


