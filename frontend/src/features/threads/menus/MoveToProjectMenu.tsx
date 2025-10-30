"use client";
import React, { useMemo, useState, useCallback } from "react";
import { Input, Button } from "@ui";

export default function MoveToProjectMenu({
  projects,
  onSelect,
  onCreate,
  onClose,
}: {
  projects: { id: number; name: string }[];
  onSelect: (projectId: number | null) => void;
  onCreate?: (name: string) => Promise<{ id: number; name: string }>;
  onClose?: () => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<number>(-1);
  const filtered = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [projects, q]
  );

  const confirmCreate = useCallback(async () => {
    if (!onCreate) return;
    const name = q.trim();
    if (!name) return;
    const created = await onCreate(name);
    onSelect(created.id);
    onClose?.();
  }, [onCreate, onSelect, onClose, q]);
  return (
    <div className="p-2 space-y-2" role="menu" aria-label="move-to-project-menu">
      <Input
        size="sm"
        placeholder="プロジェクト検索"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(-1);
        }}
        onKeyDown={async (e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (active >= 0 && filtered[active]) {
              onSelect(filtered[active].id);
              onClose?.();
            } else if (onCreate && q.trim()) {
              await confirmCreate();
            }
          } else if (e.key === "Escape") {
            onClose?.();
          }
        }}
      />
      {onCreate && (
        <Button variant="primary" size="sm" className="w-full justify-start text-xs" onClick={confirmCreate}>
          新規プロジェクトを作成
        </Button>
      )}
      <ul className="max-h-56 overflow-auto text-xs" role="listbox">
        <li>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { onSelect(null); onClose?.(); }}>
            プロジェクトから外す
          </Button>
        </li>
        {filtered.map((p, idx) => (
          <li key={p.id}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onMouseEnter={() => setActive(idx)}
              onClick={() => { onSelect(p.id); onClose?.(); }}
              role="option"
              aria-selected={idx === active}
              onDragOver={(e)=> e.preventDefault()}
              onDrop={(e)=> {
                e.preventDefault();
                const threadId = e.dataTransfer.getData("application/x-thread-id");
                if (!threadId) return;
                onSelect(p.id);
                onClose?.();
              }}
            >
              {p.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}


