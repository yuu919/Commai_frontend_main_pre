"use client";
import React, { useEffect, useMemo, useState } from "react";
import Surface from "@ui/Surface";
import { Button, Input, Modal } from "@ui";
import { useRouter } from "next/navigation";
import type { ProjectsRepository } from "@/features/projects/types";

export default function ProjectHeader({
  id,
  name: initialName,
  description: initialDescription,
  onUpdated,
  repo,
}: {
  id: number;
  name: string;
  description?: string | null;
  onUpdated?: (p: { name: string; description: string | null }) => void;
  repo: ProjectsRepository;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [renameOpen, setRenameOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setName(initialName), [initialName]);

  async function save(upd: { name?: string }) {
    setBusy(true);
    try {
      const newName = (upd.name ?? name).trim() || "無題";
      const res = await repo.rename(id, newName);
      setName(res.name);
      onUpdated?.({ name: res.name, description: res.description ?? null });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface variant="panel" borderSide="b" className="px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* 戻りボタンは削除（選択状態はサイドバーで示す） */}
        <button className="text-base font-semibold" onClick={()=> setRenameOpen(true)}>{name}</button>
      </div>
      <div className="relative flex items-center gap-2">
        {/* アクションメニュー削除 */}
      </div>

      {/* Rename Modal */}
      <ProjectRenameModal
        open={renameOpen}
        initial={name}
        onConfirm={async (newName)=>{ await save({ name: newName }); setRenameOpen(false); }}
        onClose={()=> setRenameOpen(false)}
      />
    </Surface>
  );
}

function ProjectRenameModal({ open, initial, onConfirm, onClose }:{ open: boolean; initial: string; onConfirm: (name:string)=>void; onClose: ()=>void }) {
  const [value, setValue] = useState(initial);
  useEffect(()=>{ if (open) setValue(initial); }, [open, initial]);
  return (
    <Modal isOpen={open} onClose={onClose} title="プロジェクト名を変更">
      <div className="p-3">
        <Input size="md" value={value} onChange={(e)=> setValue(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter" && value.trim()) onConfirm(value.trim()); if(e.key==="Escape") onClose(); }} />
        <div className="flex justify-end gap-2 mt-3">
          <Button size="sm" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button size="sm" onClick={()=> onConfirm(value.trim())} disabled={!value.trim()}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}


