"use client";
import React, { useState } from "react";
import { FormattedFlowStep } from "@/features/inspector/utils/flowStepFormatter";
import { Badge, MutedText, Card } from "@ui";

export default function FlowTab({ steps }: { steps: FormattedFlowStep[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    const next = new Set(expanded);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpanded(next);
  };

  const onKeyToggle = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(index);
    }
  };

  if (!steps || steps.length === 0) {
    return <MutedText level={40}>フローステップがありません</MutedText>;
  }

  const getStepStyle = (_title: string) => {
    return {} as const;
  };

  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const style = getStepStyle(s.stepTitle);
        const isOpen = expanded.has(i);
        return (
          <Card key={s.id} className="">
            <button
              className="w-full text-left p-3 flex items-start gap-3"
              onClick={() => toggle(i)}
              onKeyDown={(e) => onKeyToggle(e, i)}
              aria-expanded={isOpen}
              aria-controls={`flow-step-panel-${i}`}
            >
              <Badge size="sm" variant="neutral" className="shrink-0">{s.status}</Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium truncate">Step {i + 1}: {s.stepTitle}</div>
                  <MutedText className="text-xs shrink-0" level={40}>{s.duration ?? ""}</MutedText>
                </div>
                {s.reasoning && (
                  <MutedText className="text-sm mt-1 line-clamp-2" level={40}>{s.reasoning}</MutedText>
                )}
                <MutedText className="text-[10px] mt-1" level={50}>{new Date(s.timestamp).toLocaleString()}</MutedText>
              </div>
            </button>
            {isOpen && (
              <div id={`flow-step-panel-${i}`} className="px-3 pb-3 pt-0">
                {/* 思考プロセス（詳細） */}
                {s.reasoning && (
                  <div className="mt-2">
                    <MutedText className="text-xs font-semibold mb-1" level={40}>思考プロセス</MutedText>
                    <div className="p-2 text-sm whitespace-pre-wrap">
                      <MutedText level={40}>{s.reasoning}</MutedText>
                    </div>
                  </div>
                )}
                {/* 入力データ */}
                {s.inputData && s.inputData.length > 0 && (
                  <div className="mt-3">
                    <MutedText className="text-xs font-semibold mb-1" level={40}>入力データ</MutedText>
                    <div className="p-2 text-sm space-y-1">
                      {s.inputData.map((d, idx) => (
                        <div key={idx}>
                          <span className="font-medium">{d.label}: </span>
                          {Array.isArray(d.value) ? d.value.map((ln, j) => <div key={j} className="ml-2 whitespace-pre-wrap">{ln}</div>) : <span className="whitespace-pre-wrap">{d.value}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 出力データ */}
                {s.outputData && s.outputData.length > 0 && (
                  <div className="mt-3">
                    <MutedText className="text-xs font-semibold mb-1" level={40}>出力データ</MutedText>
                    <div className="p-2 text-sm space-y-1">
                      {s.outputData.map((d, idx) => (
                        <div key={idx}>
                          <span className="font-medium">{d.label}: </span>
                          {Array.isArray(d.value) ? d.value.map((ln, j) => <div key={j} className="ml-2 whitespace-pre-wrap">{ln}</div>) : <span className="whitespace-pre-wrap">{d.value}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}


