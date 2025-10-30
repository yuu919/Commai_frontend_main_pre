import React, { useRef, useState } from "react";
import { Input, Surface, MutedText } from "@ui";
import type { ThreadItem as ThreadItemType } from "./types";
import ThreadsRowMenu from "./menus/ThreadsRowMenu";
import MoveToProjectMenu from "./menus/MoveToProjectMenu";
import ConfirmDeleteDialog from "./dialogs/ConfirmDeleteDialog";
import RenameThreadDialog from "./dialogs/RenameThreadDialog";

export default function ThreadItem({
  item,
  active,
  onClick,
  onRename,
  onDelete,
  onMoveToProject,
  projects = [],
  onCreateProject,
}: {
  item: ThreadItemType;
  active?: boolean;
  onClick?: () => void;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onMoveToProject?: (id: string, projectId: number | null) => void;
  projects?: { id: number; name: string }[];
  onCreateProject?: (name: string) => Promise<{ id: number; name: string }>;
  
}) {
  const [showMove, setShowMove] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [inlineEditing, setInlineEditing] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(item.title);
  const commitRef = useRef(false);

  function beginInlineEdit() {
    commitRef.current = false;
    setInlineTitle(item.title);
    setInlineEditing(true);
  }

  function commitInline() {
    if (commitRef.current) return;
    const next = inlineTitle.trim();
    setInlineEditing(false);
    if (next && next !== item.title) onRename?.(item.id, next);
    commitRef.current = true;
  }
  return (
    <Surface variant="thread" interactive={!active} active={!!active} radius="md" className="w-full px-3 py-2">
      <div className="flex items-start gap-2">
        <div className="flex-1" onClick={onClick}>
          <div className="text-xs font-medium truncate">
            {inlineEditing ? (
              <Input
                size="sm"
                value={inlineTitle}
                onChange={(e)=> setInlineTitle(e.target.value)}
                onClick={(e)=> e.stopPropagation()}
                onKeyDown={(e)=>{
                  if (e.key === "Escape") { setInlineEditing(false); setInlineTitle(item.title); }
                  if (e.key === "Enter") commitInline();
                }}
                onBlur={commitInline}
                autoFocus
              />
            ) : (
              <button className="w-full text-left" onDoubleClick={(e)=>{ e.stopPropagation(); beginInlineEdit(); }}>
                {item.title}
              </button>
            )}
          </div>
          <time
            className="text-[10px] truncate"
            dateTime={item.updatedAt}
            suppressHydrationWarning
          >
            <MutedText level={50}>{new Date(item.updatedAt).toLocaleString()}</MutedText>
          </time>
        </div>
        <div className="relative">
          <ThreadsRowMenu
            onRename={() => { beginInlineEdit(); }}
            onMove={() => setShowMove((v) => !v)}
            onDelete={() => setConfirmOpen(true)}
          />
            {showMove && (
            <div className="absolute right-0 top-6 z-50 min-w-60">
              <MoveToProjectMenu
                projects={projects}
                onSelect={(pid) => {
                  onMoveToProject?.(item.id, pid);
                  setShowMove(false);
                }}
                onCreate={onCreateProject}
                onClose={() => setShowMove(false)}
              />
            </div>
          )}
        </div>
      </div>
      <ConfirmDeleteDialog
        open={confirmOpen}
        title={item.title}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete?.(item.id);
        }}
      />
      {/* モーダルでの改名は廃止し、サイドバー内インライン編集に統一 */}
    </Surface>
  );
}


