"use client";
import React, { createContext, useContext } from "react";

type ChatModelCtx = { model: string; setModel: (m: string) => void };

const ChatModelContext = createContext<ChatModelCtx>({ model: "gpt-4.1", setModel: () => {} });

export function ChatModelProvider({ value, onChange, children }: { value: string; onChange: (m: string) => void; children: React.ReactNode }) {
  return <ChatModelContext.Provider value={{ model: value, setModel: onChange }}>{children}</ChatModelContext.Provider>;
}

export function useChatModel(): string {
  return useContext(ChatModelContext).model;
}

export function useSetChatModel(): (m: string) => void {
  return useContext(ChatModelContext).setModel;
}


