// Centralized DB row/DTO types (unified, deduped)

export type ChatRole = "user" | "assistant" | "system";

export interface MessageRow {
  id: number | string;
  chat_id?: string;
  role: ChatRole;
  content: string;
  model?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatRow {
  id: string;
  title: string;
  project_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateMessageInput = {
  role: ChatRole;
  content: string;
  model?: string;
};

export interface ProjectRow {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectChatRow {
  id: string;
  title: string;
  updated_at?: string;
}

export interface ShareResponse {
  share_token: string;
  share_url: string;
  visibility: "public" | "workspace";
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
}

export interface ShareInfo {
  chat_title?: string;
  message_count?: number;
  visibility: "public" | "workspace";
  created_at: string;
  expires_at?: string | null;
}

export type CreateShareInput = {
  visibility?: "public" | "workspace";
  expires_in_hours?: number;
};

export type ShareInfoPayload = { success: boolean; data?: ShareInfo };

// User profile
export interface UserDetail {
  id?: number | string;
  username?: string;
  email?: string;
  profile?: { display_name?: string | null };
}


