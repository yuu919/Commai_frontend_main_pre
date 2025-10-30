import React from "react";
import { MutedText } from "@ui";
import MarkdownRenderer from "@/features/chat/components/MarkdownRenderer";
import ThinkingProcessDisplay from "@/features/chat/ThinkingProcessDisplay";
import { useEvidence } from "@/features/inspector/context/EvidenceContext";
import { useParams } from "next/navigation";
import { apiEditMessage } from "@/lib/api/messages";
import { apiRegenerateFromMessage } from "@/lib/api/chat";
import Surface from '@ui/Surface';
import Input from '@ui/Input';
import Button from '@ui/Button';

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string | number;
  role: ChatRole;
  content: string;
}

// Markdown rendering is delegated to MarkdownRenderer

type ThinkingMeta = { status: string; message?: string; metadata?: Record<string, unknown> | null };

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20 20a8 8 0 1 1 2-8" />
    </svg>
  );
}

function IconSources(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="6" rx="7.5" ry="3.5" />
      <path d="M4.5 6v5.5c0 1.9 3.4 3.5 7.5 3.5s7.5-1.6 7.5-3.5V6" />
      <path d="M4.5 11.5V17c0 1.9 3.4 3.5 7.5 3.5s7.5-1.6 7.5-3.5v-5.5" />
    </svg>
  );
}

export default function MessageItem({ msg, thinking, inlineError, canRegenerate }: { msg: ChatMessage; thinking?: ThinkingMeta; inlineError?: string | Error | null; canRegenerate?: boolean }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";
  const { setEvidence } = useEvidence();
  const params = useParams() as { threadId?: string };
  const threadId = params?.threadId ? String(params.threadId) : undefined;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(msg.content ?? ""));
  const [localError, setLocalError] = React.useState<string | null>(null);
  const bubbleRef = React.useRef<HTMLDivElement | null>(null);
  const [bubbleWidth, setBubbleWidth] = React.useState<number | undefined>(undefined);
  const editRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [maxEditHeight, setMaxEditHeight] = React.useState<number>(0);

  // Allow parent to set canRegenerate via data-attribute on container
  React.useEffect(() => {
    // no-op; stays controllable via props in future if needed
  }, []);

  return (
    <div className={["w-full max-w-3xl mx-auto px-3 py-2", isUser ? "text-right" : "text-left"].join(" ")}> 
      <Surface radius="sm" className={`inline-block px-3 py-2 text-left ${isUser ? 'whitespace-pre-wrap' : isAssistant ? 'bg-transparent' : ''}`} variant={isUser ? 'chatInput' : isAssistant ? undefined : 'secondary'}>
        {(inlineError || localError) && (
          <div className="mb-1 text-[10px]"><MutedText variant="error">{typeof inlineError === "string" ? inlineError : inlineError ? inlineError.message : localError}</MutedText></div>
        )}
        {editing ? (
          <div className="mt-0">
            <textarea
              className="w-full text-xs border border-border rounded-xs p-2 bg-surface-1"
              value={draft}
              ref={editRef}
              style={maxEditHeight ? { maxHeight: maxEditHeight, overflowY: "auto" } as React.CSSProperties : undefined}
              onChange={(e)=> { setDraft(e.target.value); const el = editRef.current; if (el) { el.style.height = "auto"; const h = Math.min(el.scrollHeight, maxEditHeight || el.scrollHeight); el.style.height = `${h}px`; el.style.overflowY = el.scrollHeight > h ? "auto" : "hidden"; } }}
              onKeyDown={async (e)=>{
                if (e.key === "Escape") { setEditing(false); setDraft(String(msg.content ?? "")); }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  if (!threadId) return;
                  try {
                    setLocalError(null);
                    const useMocks = typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCKS === "true";
                    if (useMocks && (window as any).__messagesRepo?.edit) {
                      await (window as any).__messagesRepo.edit(threadId, msg.id, draft.trim());
                    } else {
                      await apiEditMessage(threadId, msg.id, draft.trim());
                    }
                    setEditing(false);
                    window.dispatchEvent(new CustomEvent("chat:message-updated"));
                  } catch (e: unknown) {
                    setLocalError(e instanceof Error ? e.message : String(e ?? "保存に失敗しました"));
                  }
                }
              }}
            />
            <div className="mt-1 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(String(msg.content ?? "")); setBubbleWidth(undefined); }}>キャンセル</Button>
              <Button size="sm" variant="primary" onClick={async ()=> { if (!threadId) return; try { setLocalError(null); const useMocks = typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCKS === "true"; if (useMocks && (window as any).__messagesRepo?.edit) { await (window as any).__messagesRepo.edit(threadId, msg.id, draft.trim()); } else { await apiEditMessage(threadId, msg.id, draft.trim()); } setEditing(false); setBubbleWidth(undefined); window.dispatchEvent(new CustomEvent("chat:message-updated")); } catch (e: unknown) { setLocalError(e instanceof Error ? e.message : String(e ?? "保存に失敗しました")); } }}>保存</Button>
            </div>
          </div>
        ) : (
          isAssistant ? (
            <div className="mb-1 prose dark:prose-invert max-w-none">
              <MarkdownRenderer content={String(msg.content ?? "")} showCodeHeader={true} />
            </div>
          ) : (
            <div className="mb-1 break-words">{String(msg.content ?? "")}</div>
          )
        )}
        
        {isAssistant && thinking && thinking.status !== "complete" && (
          <div className="mt-2">
            <ThinkingProcessDisplay status={thinking.status} message={thinking.message} metadata={thinking.metadata ?? undefined} />
          </div>
        )}
      </Surface>
      {/* アクションバー（メッセージ外・下） */}
      <div className={["mt-1 flex items-center gap-3", isUser ? "justify-end" : ""].join(" ")}>
        <Button size="sm" variant="ghost" aria-label="コピー" title="コピー" onClick={() => navigator.clipboard.writeText(String(msg.content ?? ""))}>
          <IconCopy />
        </Button>
        {isUser && !editing && (
          <Button size="sm" variant="ghost" aria-label="編集" title="編集" onClick={() => { setLocalError(null); setDraft(String(msg.content ?? "")); const w = bubbleRef.current?.getBoundingClientRect().width; if (w) setBubbleWidth(Math.round(w)); setEditing(true); setTimeout(()=>{ const el = editRef.current; if (el) { const cs = window.getComputedStyle(el); const lh = parseFloat(cs.lineHeight || "0"); const maxPx = Math.max(1, lh || 18) * 15; setMaxEditHeight(maxPx); el.style.height = "auto"; const h = Math.min(el.scrollHeight, maxPx); el.style.height = `${h}px`; el.style.overflowY = el.scrollHeight > h ? "auto" : "hidden"; } }, 0); }}>
            <IconEdit />
          </Button>
        )}
        {/* frontend整合: 削除ボタンは表示しない */}
        {isAssistant && (
          <Button size="sm" variant="ghost" aria-label="再生成" title="再生成" disabled={!Boolean(canRegenerate)} onClick={async () => {
            if (!Boolean(canRegenerate)) return;
            setLocalError(null);
            if (!threadId) return;
            try {
              await apiRegenerateFromMessage(threadId, msg.id);
              window.dispatchEvent(new CustomEvent("chat:message-updated"));
            } catch (e: unknown) {
              setLocalError(e instanceof Error ? e.message : String(e ?? "再生成に失敗しました"));
            }
          }}>
            <IconRefresh />
          </Button>
        )}
        {isAssistant && (
          <Button size="sm" variant="ghost" aria-label="情報源" title="情報源" onClick={() => setEvidence(String(msg.id), undefined)}>
            <IconSources />
          </Button>
        )}
      </div>
    </div>
  );
}


