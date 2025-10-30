"use client";
import React, { useMemo, useRef, useState } from "react";
import { Button, Textarea, Chip, MutedText, Surface } from "@ui";
import RowMenu from "@ui/RowMenu";
import CompactFileList from "./CompactFileList";
import CompactFileErrors from "./CompactFileErrors";
import useFileUpload from "./hooks/useFileUpload";
import { uploadWithSse, UploadProgress } from "@/lib/uploads";
import { useToast } from "@ui/Toast";
import { useChatModel } from "@/features/chat/context/ChatModelContext";
import type { MessagesRepository } from "@/features/chat/types";
import useMessagesSWR from "@/features/chat/logic/useMessagesSWR";
import UploadProgressBar from "@/features/chat/UploadProgressBar";
import PredictionView from "@/features/chat/PredictionView";
import { useSetChatModel } from "@/features/chat/context/ChatModelContext";

export default function Composer({ onSend, onStop, onRegenerate, busy: busyProp, threadId, showErrorInline = true, allowAttachments = true, repo }: { onSend?: (text: string, attachments?: File[]) => void; onStop?: () => void; onRegenerate?: () => void; busy?: boolean; threadId?: string; showErrorInline?: boolean; allowAttachments?: boolean; repo: MessagesRepository }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const cancelApiRef = useRef<{ cancel(): void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { files, addFiles, removeAt, clear, totalSize } = useFileUpload();
  const { push } = useToast();
  const model = useChatModel();
  const setModel = useSetChatModel();
  const availableModels = ["gpt-4.1", "gpt-4.1-mini", "o4-mini", "o3", "gpt-4.1-nano"];
  const swrMsgs = useMessagesSWR(threadId, repo);
  const [mode, setMode] = useState<"ask" | "agent">("ask");
  const [modeOpen, setModeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = window.getComputedStyle(el);
    const lineH = parseFloat(cs.lineHeight || "20");
    const pad = parseFloat(cs.paddingTop || "0") + parseFloat(cs.paddingBottom || "0");
    const border = parseFloat(cs.borderTopWidth || "0") + parseFloat(cs.borderBottomWidth || "0");
    const max = lineH * 10 + pad + border;
    el.style.maxHeight = `${max}px`;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }

  React.useEffect(() => { resizeTextarea(); }, [text]);

  // 添付バリデーション
  const MAX_FILES = 6;
  const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_EXT = useMemo(() => [
    ".txt", ".md", ".pdf", ".png", ".jpg", ".jpeg", ".gif",
    ".csv", ".tsv", ".json", ".zip"
  ], []);
  const [errors, setErrors] = useState<string[]>([]);

  function validateAndAdd(list: FileList | File[]) {
    if (!allowAttachments) return; // attachments disabled
    const next: string[] = [];
    const arr = Array.from(list);
    if (files.length + arr.length > MAX_FILES) {
      next.push(`添付は最大${MAX_FILES}個までです`);
    }
    let newTotal = totalSize;
    for (const f of arr) {
      newTotal += f.size;
      const lower = f.name.toLowerCase();
      const ok = ALLOWED_EXT.some(ext => lower.endsWith(ext));
      if (!ok) next.push(`${f.name}: この拡張子は許可されていません`);
    }
    if (newTotal > MAX_TOTAL_SIZE) {
      next.push(`合計サイズは最大${Math.floor(MAX_TOTAL_SIZE/1024/1024)}MBまでです`);
    }
    setErrors(next);
    if (next.length === 0) addFiles(arr);
  }

  const handleSend = async () => {
    if ((text.trim().length === 0) && (allowAttachments ? files.length === 0 : true)) return;
    if (busy) return;
    setLastError(null);
    try {
      setBusy(true);
      if (allowAttachments && files.length > 0) {
        let assistantBuffer = "";
        await uploadWithSse(
          files.map(f => f.file),
          { message: text.trim(), model, threadId },
          {
            onCancel: (api) => { cancelApiRef.current = api; },
            onProgress: (p) => {
              setUploadProgress(p);
              if (p.status === "warning") push({ message: p.message || "警告", variant: "warning" });
            },
            onChunk: (chunk) => { assistantBuffer += chunk; },
            onDone: () => { setUploadProgress(null); },
            onError: (err) => { setLastError(err); push({ message: err, variant: "error" }); }
          }
        );
        if (threadId) {
          try {
            await repo.create(threadId, { role: "user", content: text.trim() || "(添付ファイル)" });
            await swrMsgs?.mutate?.();
          } catch (e) {
            push({ message: "メッセージの保存に失敗しました", variant: "error" });
          }
          if (assistantBuffer.trim()) {
            try {
              await repo.create(threadId, { role: "assistant", content: assistantBuffer });
              await swrMsgs?.mutate?.();
            } catch (e) {
              push({ message: "アシスタント応答の保存に失敗しました", variant: "error" });
            }
          }
        }
      } else {
        onSend?.(text.trim(), []);
      }
      setText("");
      clear();
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    try {
      cancelApiRef.current?.cancel();
      // 途中までのassistantがあれば保存し、UIの一貫性を保つ
      // このコンポーネントではassistantBufferはローカルで完結するため、部分保存はuseChatController側で一貫化。
      // ここではユーザーに中止通知のみ行う。
      push({ message: "アップロードがキャンセルされました。メッセージは保存されませんでした。", variant: "info" });
    } finally {
      cancelApiRef.current = null;
      setUploadProgress(null);
    }
  };

  // simple icons (inline SVG)
  function IconPaperclip(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
        <path d="M21.44 11.05 12 20.5a6 6 0 0 1-8.49-8.48l10-10a4 4 0 0 1 5.66 5.66L8.5 19.83"/>
      </svg>
    );
  }
  function IconMic(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
        <rect x="9" y="2" width="6" height="11" rx="3"/>
        <path d="M12 19v3M5 12a7 7 0 0 0 14 0M12 22v0"/>
      </svg>
    );
  }
  function IconSend(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
        <path d="m22 2-7 20-4-9-9-4 20-7Z"/>
      </svg>
    );
  }
  function IconStop(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden {...props}>
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>
    );
  }

  return (
    <Surface variant="panel" borderSide="t" className="py-3 px-2">
      {allowAttachments && uploadProgress && <UploadProgressBar progress={uploadProgress} onCancel={handleCancel} />}
      {showErrorInline && lastError && (
        <div className="max-w-3xl mx-auto mb-2 text-xs">
          <MutedText variant="error">{lastError}</MutedText>
          <Button size="sm" variant="ghost" onClick={handleSend} className="ml-2">再試行</Button>
        </div>
      )}
      {allowAttachments && <CompactFileErrors errors={errors} onClear={() => setErrors([])} />}
      <Surface variant="chatInput" bordered radius="lg" elevated className="max-w-3xl mx-auto flex flex-col gap-2 relative px-3 py-2"
        onDragOver={(e)=> { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
        onDrop={(e)=> {
          e.preventDefault();
          if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            validateAndAdd(e.dataTransfer.files);
          }
        }}
      >
        {/* hidden file input (triggered by clip button in row2) */}
        {allowAttachments && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
            e.currentTarget.value = "";
          }}
        />)}

        {/* row 1: [textarea only] */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef as any}
              placeholder="メッセージを入力"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Cmd/Ctrl+Enter で送信。Enter/Shift+Enter は改行。
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={busy || busyProp || recording}
              rows={1}
              className="bg-transparent border-transparent focus:ring-0 focus:border-transparent resize-none min-h-10"
            />
          </div>
        </div>

        {/* row 2: [clip, mode select, model select, spacer, send/stop] */}
        <div className="flex items-center gap-2">
          {allowAttachments && (
          <Button aria-label="添付" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <IconPaperclip />
          </Button>)}
          {/* Mode picker */}
          <div className="relative">
            <Chip as="button" size="sm" variant="neutral" onClick={() => setModeOpen((v) => !v)} aria-haspopup="menu" aria-expanded={modeOpen} title="モード">
              {mode === "ask" ? "Ask" : "Agent"} <span aria-hidden>▾</span>
            </Chip>
            <RowMenu open={modeOpen} onClose={() => setModeOpen(false)} align="left" placement="up" label="モード選択" className="min-w-[180px]">
              <div className="p-2 flex flex-col gap-1">
                {(["ask","agent"] as const).map((m) => (
                  <Button key={m} size="sm" variant="ghost" className="justify-start text-xs" role="menuitem" onClick={() => { setMode(m); setModeOpen(false); }}>
                    {m === "ask" ? "Ask" : "Agent"}
                  </Button>
                ))}
              </div>
            </RowMenu>
          </div>

          {/* Model picker */}
          <div className="relative">
            <Chip as="button" size="sm" variant="neutral" onClick={() => setModelOpen((v) => !v)} aria-haspopup="menu" aria-expanded={modelOpen} title="モデル選択">
              {model} <span aria-hidden>▾</span>
            </Chip>
            <RowMenu open={modelOpen} onClose={() => setModelOpen(false)} align="left" placement="up" label="モデル選択" className="min-w-[220px]">
              <div className="p-2 max-h-60 overflow-auto flex flex-col gap-1">
                {availableModels.map((m) => (
                  <Button key={m} size="sm" variant="ghost" className="justify-start text-xs" role="menuitem" onClick={() => { setModel(m); setModelOpen(false); }}>
                    {m}
                  </Button>
                ))}
              </div>
            </RowMenu>
          </div>

          <div className="flex-1" />
          {(busy || busyProp) ? (
            <Button size="md" variant="ghost" aria-label="停止" onClick={onStop} disabled={recording}>
              <IconStop />
            </Button>
          ) : (
            <Button size="md" aria-label="送信" onClick={handleSend} disabled={busy || busyProp || recording}>
              <IconSend />
            </Button>
          )}
        </div>

        <PredictionView open={false} suggestions={[]} onPick={(v)=> setText(v)} />
      </Surface>
      {allowAttachments && <CompactFileList files={files} onRemove={removeAt} />}
    </Surface>
  );
}


