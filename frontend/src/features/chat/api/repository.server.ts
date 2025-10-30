import type { MessagesRepository } from "@/features/chat/types";
import type { MessageRow as ChatMessage, ChatRole } from "@/lib/db.types";
import { apiListMessages, apiCreateMessage, apiEditMessage } from "@/lib/api/messages";

export function createServerMessagesRepository(): MessagesRepository {
  return {
    async list(threadId: string): Promise<ChatMessage[]> {
      return apiListMessages(threadId);
    },
    async create(threadId: string, message: { role: ChatRole; content: string }): Promise<ChatMessage> {
      return apiCreateMessage(threadId, message);
    },
    // optional method (not part of base interface in some builds)
    edit(threadId: string, messageId: string | number, content: string): Promise<ChatMessage> {
      return apiEditMessage(threadId, messageId, content);
    },
  };
}
