"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useEvidence } from "@/features/inspector/context/EvidenceContext";
import { useToast } from "@ui/Toast";
import { MutedText, Surface, Button } from "@ui";
//
import FlowTab from "../tabs/FlowTab";
import { useEvidenceFlow } from "@/features/inspector/hooks/useEvidenceData";
import useMessagesSWR from "@/features/chat/logic/useMessagesSWR";
import { useParams } from "next/navigation";

export default function EvidencePanel() {
  const { state } = useEvidence();
  const tabs = useMemo(() => ["flow"] as const, []);
  type Tab = typeof tabs[number];
  const [activeTab, setActiveTab] = useState<Tab>("flow");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [currentRunIndex, setCurrentRunIndex] = useState<number>(0);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [rightRunIndex, setRightRunIndex] = useState<number>(0);
  const params = useParams() as { threadId?: string };
  const threadId = params?.threadId ? String(params.threadId) : undefined;
  const swrMsgs = useMessagesSWR(threadId);
  type RunPair = { pairIndex: number; assistantMessageId?: string | number; userPreview: string };
  const messages = useMemo(() => swrMsgs.data ?? [], [swrMsgs.data]);
  const assistantIndices = useMemo(() => messages.map((m, i) => ({ m, i })).filter(({ m }) => m.role === "assistant"), [messages]);
  const pairs: RunPair[] = useMemo(() => assistantIndices.map(({ i }, idx) => {
    // 直前の user メッセージを検索
    let j = i - 1;
    let userText = "";
    while (j >= 0) {
      if (messages[j]?.role === "user") { userText = messages[j]?.content ?? ""; break; }
      j--;
    }
    const preview = userText.trim().length === 0 ? "(空のメッセージ)" : (userText.trim().length > 50 ? userText.trim().slice(0, 50) + "..." : userText.trim());
    return { pairIndex: idx + 1, assistantMessageId: messages[i]?.id, userPreview: preview };
  }), [assistantIndices, messages]);
  const totalPairs = pairs.length;
  const singlePair = currentRunIndex > 0 ? pairs[currentRunIndex - 1] : undefined;
  const leftPair = currentRunIndex > 0 ? pairs[currentRunIndex - 1] : undefined;
  const rightPair = rightRunIndex > 0 ? pairs[rightRunIndex - 1] : undefined;
  const singleFetch = useEvidenceFlow(
    state.evidenceId || undefined,
    singlePair?.assistantMessageId && threadId ? { messageId: Number(singlePair.assistantMessageId), chatId: threadId } : undefined
  );
  const leftFetch = useEvidenceFlow(
    state.evidenceId || undefined,
    leftPair?.assistantMessageId && threadId ? { messageId: Number(leftPair.assistantMessageId), chatId: threadId } : undefined
  );
  const rightFetch = useEvidenceFlow(
    state.evidenceId || undefined,
    rightPair?.assistantMessageId && threadId ? { messageId: Number(rightPair.assistantMessageId), chatId: threadId } : undefined
  );
  const evidence = singleFetch.data?.evidence;
  const formattedSteps = singleFetch.data?.formattedFlowSteps ?? [];
  const loading = singleFetch.isLoading;
  const err = singleFetch.error as Error | undefined;
  const { push } = useToast();

  // evidenceIdが変わったらタブをリセットし、最新Runにスナップ
  useEffect(() => {
    if (state.evidenceId) {
      setActiveTab("flow");
      setCurrentRunIndex((prev) => (totalPairs > 0 ? totalPairs : prev));
      push({ message: "最新のエビデンスを読み込みました", variant: "info" });
    }
  }, [state.evidenceId, totalPairs, push]);

  // メッセージが届いていて currentRunIndex が未選択なら最新へ
  useEffect(() => {
    if (currentRunIndex === 0 && totalPairs > 0) {
      setCurrentRunIndex(totalPairs);
    }
  }, [currentRunIndex, totalPairs]);

  const onTabsKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = tabs.indexOf(activeTab);
    const next = e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[next]);
    tabRefs.current[next]?.focus();
  }, [activeTab, tabs]);

  const header = useMemo(() => (
    <Surface variant="panel" borderSide="b" className="flex items-center justify-between px-3 py-2">
      <div className="text-xs truncate"><MutedText level={40}>{state.evidenceId ? `Evidence: ${state.evidenceId}` : "Evidence"}</MutedText></div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 text-xs" role="tablist" aria-label="Evidence tabs" onKeyDown={onTabsKey}>
          {tabs.map((t, i) => (
            <Button
              key={t}
              size="sm"
              variant={activeTab === t ? "primary" : "ghost"}
              role="tab"
              aria-selected={activeTab === t}
              tabIndex={activeTab === t ? 0 : -1}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsSplitMode((v) => !v)}
          aria-pressed={isSplitMode}
          title={isSplitMode ? "単一パネルに戻す" : "パネルを分割する"}
          aria-label={isSplitMode ? "単一パネルに戻す" : "パネルを分割する"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5V5Zm9 0h-5v14h5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </Button>
      </div>
    </Surface>
  ), [activeTab, isSplitMode, state.evidenceId, onTabsKey, tabs]);

  const RunSelector = ({ side }: { side: "left" | "right" | "single" }) => {
    const [open, setOpen] = useState(false);
    const runIdx = side === "right" ? rightRunIndex : currentRunIndex;
    const setIdx = side === "right" ? setRightRunIndex : setCurrentRunIndex;
    const label = runIdx === 0 ? "チャット履歴メッセージを選択してください" : `#${runIdx} ${pairs[runIdx - 1]?.userPreview ? "- " + pairs[runIdx - 1].userPreview : ""}`;
    const onKeyToggle = (e: React.KeyboardEvent, idx: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIdx(idx);
        setOpen(false);
      }
    };
    return (
      <div className="border-b border-border">
        <Button size="sm" variant="ghost" className="w-full justify-start text-sm px-3 py-2" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox">
          {label}
        </Button>
        {open && (
          <div className="max-h-48 overflow-auto" role="listbox" aria-label="Run selector">
            {(totalPairs > 0 ? pairs : [{ pairIndex: 1, assistantMessageId: undefined, userPreview: "(メッセージなし)" }] as RunPair[]).map((p: RunPair) => (
              <Button
                key={p.pairIndex}
                role="option"
                aria-selected={runIdx === p.pairIndex}
                className="w-full justify-start text-sm px-3 py-2"
                variant={runIdx === p.pairIndex ? "primary" : "ghost"}
                onClick={() => { setIdx(p.pairIndex); setOpen(false); }}
                onKeyDown={(e) => onKeyToggle(e, p.pairIndex)}
              >
                #{p.pairIndex} {p.userPreview ? "- " + p.userPreview : ""}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {header}
      <div className="p-0 flex-1 overflow-auto">
        {!isSplitMode ? (
          <div>
            <RunSelector side="single" />
            <div className="p-3">
              {!state.evidenceId && <MutedText level={40}>エビデンスをここに表示します（SSEから evidence_id を受信後にロード）</MutedText>}
              {state.evidenceId && loading && (
                <div className="space-y-2 animate-pulse">
                  <Surface className="h-4 rounded bg-surface-2" />
                  <Surface className="h-4 rounded bg-surface-2 w-11/12" />
                  <Surface className="h-4 rounded bg-surface-2 w-9/12" />
                </div>
              )}
              {state.evidenceId && err && (
                <MutedText variant="error" className="flex items-center gap-2">{String(err.message)}</MutedText>
              )}
              {state.evidenceId && !loading && !err && !evidence && (
                <MutedText level={40}>データが見つかりません</MutedText>
              )}
              {state.evidenceId && evidence && activeTab === "flow" && (
                <FlowTab steps={formattedSteps} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex">
            <div className="w-1/2">
              <Surface borderSide="r">
              <RunSelector side="left" />
              <div className="p-3">
                {leftFetch.isLoading && (
                  <div className="space-y-2 animate-pulse"><Surface className="h-4 rounded bg-surface-2" /><Surface className="h-4 rounded bg-surface-2 w-11/12" /><Surface className="h-4 rounded bg-surface-2 w-9/12" /></div>
                )}
                {leftFetch.error && (
                  <MutedText variant="error">{String((leftFetch.error as Error)?.message ?? leftFetch.error)}</MutedText>
                )}
                {!leftFetch.isLoading && !leftFetch.error && leftFetch.data?.formattedFlowSteps && (
                  <FlowTab steps={leftFetch.data.formattedFlowSteps} />
                )}
              </div>
              </Surface>
            </div>
            <div className="w-1/2">
              <RunSelector side="right" />
              <div className="p-3">
                {rightFetch.isLoading && (
                  <div className="space-y-2 animate-pulse"><Surface className="h-4 rounded bg-surface-2" /><Surface className="h-4 rounded bg-surface-2 w-11/12" /><Surface className="h-4 rounded bg-surface-2 w-9/12" /></div>
                )}
                {rightFetch.error && (
                  <MutedText variant="error">{String((rightFetch.error as Error)?.message ?? rightFetch.error)}</MutedText>
                )}
                {!rightFetch.isLoading && !rightFetch.error && rightFetch.data?.formattedFlowSteps && (
                  <FlowTab steps={rightFetch.data.formattedFlowSteps} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

