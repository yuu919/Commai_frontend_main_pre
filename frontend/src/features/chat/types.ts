import type { ChatRole, MessageRow as ChatMessage } from "@/lib/db.types";

export type { ChatMessage };
export type MessageRow = ChatMessage;

export interface MessagesRepository {
  list: (threadId: string) => Promise<ChatMessage[]>;
  create: (threadId: string, message: { role: ChatRole; content: string }) => Promise<ChatMessage>;
  edit?: (threadId: string, messageId: string | number, content: string) => Promise<ChatMessage>;
}


