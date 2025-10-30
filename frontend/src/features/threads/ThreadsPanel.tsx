import React, { useMemo, useState } from "react";
import ThreadsList from "./ThreadsList";
import HeaderShell from "./HeaderShell";
import type { ThreadItem } from "./types";
import { Button, Input } from "@ui";

export default function ThreadsPanel({
  items,
  activeId,
  onSelect,
  onRename,
  onDelete,
  onMoveToProject,
  onNew,
  onSearch,
  projects,
  onCreateProject,
}: {
  items: ThreadItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMoveToProject: (id: string, projectId: number | null) => void;
  onNew: () => void;
  onSearch: (q: string) => void;
  projects: { id: number; name: string }[];
  onCreateProject?: (name: string) => Promise<{ id: number; name: string }>;
}) {
  const [query, setQuery] = useState("");
  const debounced = useMemo(() => {
    let t: any;
    return (v: string) => {
      clearTimeout(t);
      t = setTimeout(() => onSearch(v), 300);
    };
  }, [onSearch]);
  return (
    <div className="h-full flex flex-col">
      <HeaderShell>
        <div className="flex items-center gap-2">
          <Input
            size="sm"
            placeholder="検索..."
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              debounced(v);
            }}
          />
        </div>
      </HeaderShell>
      <div className="flex-1 overflow-auto">
        <ThreadsList
          items={items}
          activeId={activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onMoveToProject={onMoveToProject}
          projects={projects}
          onCreateProject={onCreateProject}
          onNewThread={onNew}
        />
      </div>
    </div>
  );
}


