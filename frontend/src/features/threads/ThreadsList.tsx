import React from "react";
import { Surface, Badge, Button, MutedText } from "@ui";
import type { ThreadItem as ThreadItemType } from "./types";
import ThreadItem from "./ThreadItem";
import ActionListItem from "./ActionListItem";

export default function ThreadsList({
  items,
  activeId,
  onSelect,
  onRename,
  onDelete,
  onMoveToProject,
  projects = [],
  onCreateProject,
  
  onNewThread,
}: {
  items: ThreadItemType[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onMoveToProject?: (id: string, projectId: number | null) => void;
  projects?: { id: number; name: string }[];
  onCreateProject?: (name: string) => Promise<{ id: number; name: string }>;
  onNewThread?: () => void;
}) {
  if (!items.length) {
    return (
      <div className="p-3 text-xs space-y-2">
        <MutedText level={50}>スレッドがありません</MutedText>
        {onNewThread && (
          <Button size="sm" onClick={onNewThread}>新しいスレッド</Button>
        )}
      </div>
    );
  }
  return (
    <ul className="p-2 space-y-1">
      {onNewThread && (
        <li>
          <ActionListItem label="新しいスレッド" onClick={onNewThread} />
        </li>
      )}
      {items.map((it) => (
        <li key={it.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-thread-id", it.id);
              e.dataTransfer.effectAllowed = "move";
            }}
        >
          <ThreadItem
            item={it}
            active={activeId === it.id}
            onClick={() => onSelect(it.id)}
            onRename={onRename}
            onDelete={onDelete}
            onMoveToProject={onMoveToProject}
            projects={projects}
            onCreateProject={onCreateProject}
          />
        </li>
      ))}
    </ul>
  );
}


