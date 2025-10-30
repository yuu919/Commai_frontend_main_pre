"use client";
import useSWR from "swr";
import type { ChatMessage } from "../types";
import type { MessagesRepository } from "@/features/chat/types";

export function useMessagesSWR(threadId: string | undefined, repo?: MessagesRepository) {
  return useSWR<ChatMessage[]>(threadId && repo ? ["messages", threadId] : null, () => repo!.list(threadId as string), {
    revalidateOnFocus: true,
    dedupingInterval: 1000,
  });
}

export default useMessagesSWR;


