"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button, Input, MutedText, Surface } from "@ui";

export type ProjectChatItem = { id: string; title: string; updated_at?: string };

export default function ProjectChatList({
  chats,
  selectedId,
  onSelect,
  isLoading,
  error,
  onRetry,
  onRename,
}: {
  chats: ProjectChatItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRename?: (id: string, title: string) => void;
}) {
  const [active, setActive] = useState<number>(-1);
  const listRef = useRef<HTMLUListElement | null>(null);
  // インライン編集用のローカル状態（常にフック順序を固定するため、早期returnより前に定義）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  useEffect(() => {
    // 初期フォーカス位置は選択項目、なければ先頭
    if (!chats.length) { setActive(-1); return; }
    const idx = selectedId ? chats.findIndex(c => c.id === selectedId) : 0;
    setActive(idx >= 0 ? idx : 0);
  }, [chats, selectedId]);
  if (isLoading) {
    return (
      <ul className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <li key={i}><Surface variant="secondary" radius="sm" className="h-12 animate-pulse" /></li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="text-xs space-y-2">
        <MutedText variant="error">チャットの読み込みに失敗しました。</MutedText>
        {onRetry && <Button size="sm" onClick={onRetry}>再試行</Button>}
      </div>
    );
  }

  if (!chats.length) {
    return <div className="text-xs"><MutedText level={50}>チャットはありません</MutedText></div>;
  }

  return (
    <ul
      ref={listRef}
      className="space-y-2 outline-none"
      role="listbox"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!chats.length) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive((i) => Math.min(i + 1, chats.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const item = chats[active >= 0 ? active : 0];
          if (item) onSelect(item.id);
        }
      }}
    >
      {chats.map((c, idx) => (
        <li key={c.id} role="option" aria-selected={selectedId === c.id || active === idx}>
          <Surface
            bordered
            radius="sm"
            interactive={!(selectedId === c.id || active === idx)}
            active={selectedId === c.id || active === idx}
            className="w-full p-1"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 text-left p-2" onMouseEnter={() => setActive(idx)} onClick={() => onSelect(c.id)}>
                <div className="text-sm font-medium truncate">
                  {editingId === c.id ? (
                    <Input
                      size="sm"
                      value={editingTitle}
                      onChange={(e)=> setEditingTitle(e.target.value)}
                      onClick={(e)=> e.stopPropagation()}
                      onKeyDown={(e)=>{
                        if (e.key === "Escape") { setEditingId(null); setEditingTitle(""); }
                        if (e.key === "Enter") {
                          const next = editingTitle.trim();
                          setEditingId(null);
                          if (next && next !== c.title) onRename?.(c.id, next);
                        }
                      }}
                      onBlur={()=>{
                        const next = editingTitle.trim();
                        setEditingId(null);
                        if (next && next !== c.title) onRename?.(c.id, next);
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      className="w-full text-left"
                    >{c.title}</button>
                  )}
                </div>
                {c.updated_at && (
                  <time
                    className="text-[10px] truncate"
                    dateTime={c.updated_at}
                    suppressHydrationWarning
                  ><MutedText level={50}>{new Date(c.updated_at).toLocaleString()}</MutedText></time>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 py-0.5"
                aria-label="チャットメニュー"
                onClick={(e)=> {
                  e.stopPropagation();
                  setEditingId(c.id);
                  setEditingTitle(c.title);
                }}
              >…</Button>
            </div>
          </Surface>
        </li>
      ))}
    </ul>
  );
}


