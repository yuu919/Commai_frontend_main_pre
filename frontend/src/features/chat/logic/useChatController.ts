"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { useEvidence } from "@/features/inspector/context/EvidenceContext";
import { apiOpenChatStream, apiChatOnce } from "@/lib/api/chat";
import type { SsePayload } from "@/lib/sse";
import { isError, isEvidence, isContent, isThinking, isMetadata, parseSseLines, createRafCoalescer } from "@/lib/sse";
import { useChatModel } from "@/features/chat/context/ChatModelContext";
import { generateTitleAndPersist } from "@/lib/client/title.client";
import { useThreadsController } from "@/features/threads/logic/useThreadsController";
import type { MessagesRepository } from "@/features/chat/types";
import { useToast } from "@ui/Toast";
import { MESSAGES } from "@/lib/error";
import { telemetry } from "@/lib/telemetry";
import useMessagesSWR from "@/features/chat/logic/useMessagesSWR";
import { MessageRow } from "@/features/chat/types";

type ThinkingState = { status: string; message?: string; metadata?: Record<string, unknown> | null };

export function useChatController(initial?: ChatMessage[], opts?: { threadId?: string; model?: string; repo: MessagesRepository }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingMap, setThinkingMap] = useState<Record<string | number, ThinkingState>>({});
  const { setEvidence } = useEvidence();
  const abortRef = useRef<AbortController | null>(null);
  const ctxModel = useChatModel();
  const didTitleGenRef = useRef<boolean>(false);
  const threads = useThreadsController();
  const repo = opts?.repo;
  const swrMsgs = useMessagesSWR(opts?.threadId, repo);
  const { push } = useToast();

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    setError(null);
    try {
      // 既存リクエストがあれば中断
      if (abortRef.current) {
        abortRef.current.abort();
      }

      // 先に user メッセージをサーバ保存
      if (opts?.threadId && repo) {
        try {
          await repo.create(opts.threadId, { role: "user", content: userMsg.content });
          await swrMsgs?.mutate?.();
        } catch {
          setError("メッセージの保存に失敗しました");
        }
      }

      

      // ストリーム内で生成されるアシスタントの一時バッファ/ID（中断時の部分保存に用いる）
      let assistantBuffer = "";
      let assistantId: string | null = null;

      const tryStream = async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        const payload: { messages: { role: ChatMessage["role"]; content: string }[]; model: string; chat_id?: string } = {
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          model: opts?.model ?? ctxModel ?? "gpt-4.1-mini",
          chat_id: opts?.threadId,
        };

        const reader = await apiOpenChatStream(payload as any, controller.signal);
        const decoder = new TextDecoder("utf-8");
        assistantBuffer = "";
        assistantId = crypto.randomUUID();
        const assistantRow: MessageRow = { id: assistantId, role: "assistant", content: "" } as MessageRow;
        setMessages((m) => [...m, assistantRow]);
        // initialize thinking for this assistant message
        setThinkingMap((prev) => ({ ...prev, [assistantId as string]: { status: "thinking", message: undefined, metadata: null } }));

        let pending = "";
        const emitBuffered = createRafCoalescer<string>((contentNow) => {
          setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, content: contentNow } : msg)));
        });
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          pending += chunk;
          const chunkBuf = pending + ""; // copy
          parseSseLines(chunkBuf, (json: SsePayload) => {
            if (isError(json)) {
              setError(json.user_message ?? json.error ?? "エラーが発生しました");
              return;
            }
            if (isEvidence(json)) {
              setEvidence(String(json.evidence_id), json.message);
              return;
            }
            if (isThinking(json)) {
              if (assistantId) {
                setThinkingMap((prev) => ({
                  ...prev,
                  [assistantId as string]: {
                    status: json.thinking_status ?? "thinking",
                    message: (json as { message?: string }).message ?? prev[assistantId as string]?.message,
                    metadata: (json as { thinking_metadata?: Record<string, unknown> }).thinking_metadata ?? prev[assistantId as string]?.metadata ?? null,
                  },
                }));
              }
              return;
            }
            if (isMetadata(json)) {
              if (assistantId) {
                const meta = (json as { metadata?: Record<string, unknown> }).metadata ?? null;
                setThinkingMap((prev) => ({
                  ...prev,
                  [assistantId as string]: {
                    status: prev[assistantId as string]?.status ?? "thinking",
                    message: prev[assistantId as string]?.message,
                    metadata: meta,
                  },
                }));
              }
              return;
            }
            if (isContent(json)) {
              assistantBuffer += json.content;
              emitBuffered(assistantBuffer);
            }
          });
          // pending の切り詰め（最後の未完イベントを残す）
          const parts = pending.split(/\n\n/);
          pending = parts.pop() ?? "";
        }

        // ストリーム完了後、assistant保存とタイトル生成
        if (!didTitleGenRef.current && opts?.threadId) {
          didTitleGenRef.current = true;
          try {
            const msgs: ChatMessage[] = [...messages, userMsg];
            // 直近のアシスタント応答を付与
            if (assistantBuffer) {
              msgs.push({ id: assistantId, role: "assistant", content: assistantBuffer });
            }

            if (assistantBuffer && repo && opts?.threadId) {
              try {
                await repo.create(opts.threadId, { role: "assistant", content: assistantBuffer });
                await swrMsgs?.mutate?.();
              } catch {
                setError("アシスタントの保存に失敗しました");
              }
            }
            const result = await generateTitleAndPersist(
              opts.threadId,
              msgs,
              opts?.model ?? ctxModel ?? "gpt-4.1-mini"
            );
            const newTitle = result.title;
            if (newTitle) {
              threads.applyLocalTitle(opts.threadId!, newTitle);
            }
          } catch {
            // タイトル生成失敗は無視（UX優先）
          }
        }
        // mark thinking completed for this assistant message
        if (assistantId) {
          setThinkingMap((prev) => ({
            ...prev,
            [assistantId as string]: { ...prev[assistantId as string], status: "complete" },
          }));
        }
      };

      let attemptNum = 0;
      const MAX_RETRIES = 5;
      const baseDelay = 600; // ms
      while (true) {
        try {
          await tryStream();
          telemetry.log("sse_connect_success", { threadId: opts?.threadId });
          break;
        } catch (e) {
          telemetry.log("sse_connect_error", { error: e instanceof Error ? e.message : String(e) });
          // Fallback: non-streaming once call to backend JSON API
          try {
            const oncePayload = {
              messages: [...messages, userMsg].map((m) => ({ role: m.role as any, content: m.content })),
              model: opts?.model ?? ctxModel ?? "gpt-4.1-mini",
            };
            const { content } = await apiChatOnce(oncePayload);
            const assistantId = crypto.randomUUID();
            const assistantRow: MessageRow = { id: assistantId, role: "assistant", content: content || "" } as MessageRow;
            setMessages((m) => [...m, assistantRow]);
            if (opts?.threadId && content?.trim() && repo) {
              try {
                await repo.create(opts.threadId, { role: "assistant", content });
                await swrMsgs?.mutate?.();
              } catch {}
            }
            telemetry.log("chat_once_success", { threadId: opts?.threadId });
            break;
          } catch (fallbackErr) {
            telemetry.log("chat_once_error", { error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr) });
          }
          // 中断された場合は部分保存フローへ
          if (abortRef.current?.signal.aborted) {
            // assistantBuffer が存在し、スレッドIDがある場合は部分保存
            if (opts?.threadId && assistantBuffer?.trim() && repo) {
              try {
                const saved = await repo.create(opts.threadId, { role: "assistant", content: assistantBuffer });
                await swrMsgs?.mutate?.();
                // UIの末尾assistantのIDを置換
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, id: String((saved as any).id ?? m.id) } : m)));
                push({ message: MESSAGES.streamCancelledPartialSave, variant: "info" });
              } catch {
                push({ message: MESSAGES.streamCancelledSaveFailed, variant: "error" });
              }
            } else {
              push({ message: MESSAGES.streamCancelledNoSave, variant: "info" });
            }
            if (assistantId) {
              setThinkingMap((prev) => ({
                ...prev,
                [assistantId as string]: { ...prev[assistantId as string], status: "stopped" },
              }));
            }
            break;
          }
          if (attemptNum >= MAX_RETRIES) {
            setError(e instanceof Error ? e.message : "接続に失敗しました");
            push({ message: "ストリームの接続に失敗しました。再試行してください。", variant: "error" });
            telemetry.log("sse_connect_failed", { attempts: attemptNum, threadId: opts?.threadId });
            break;
          }
          const delay = Math.min(baseDelay * Math.pow(2, attemptNum), 8000);
          push({ message: `接続が不安定です。再接続中... (${attemptNum + 1}/${MAX_RETRIES})`, variant: "info" });
          telemetry.log("sse_retry", { attempt: attemptNum + 1, delayMs: delay, threadId: opts?.threadId });
          await new Promise((r) => setTimeout(r, delay));
          attemptNum += 1;
        }
      }
    } finally {
      setBusy(false);
    }
  }, [ctxModel, messages, opts?.model, opts?.threadId, setEvidence, swrMsgs, threads]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setBusy(false);
    }
  }, []);

  const regenerate = useCallback(async () => {
    // 最後の user メッセージを探して再送
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      await send(String(lastUser.content));
    }
  }, [messages, send]);

  return { messages, setMessages, busy, send, stop, regenerate, error, thinkingMap };
}

export default useChatController;


