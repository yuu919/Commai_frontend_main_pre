"use client";
import React from "react";
import type { UploadProgress } from "@/lib/uploads";
import { Button, Card, CardBody, MutedText, ProgressBar } from "@ui";

export default function UploadProgressBar({ progress, onCancel }: { progress: UploadProgress; onCancel?: () => void }) {
  const pct = progress.status === "uploading"
    ? Math.max(0, Math.min(100, Number(progress.progressPct || 0)))
    : 0;
  return (
    <div className="max-w-3xl mx-auto mb-2 text-xs" role="status" aria-live="polite">
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="truncate">
              <span className="font-medium mr-1">{progress.status}</span>
              {progress.message && <MutedText level={40}>{progress.message}</MutedText>}
            </div>
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel}>キャンセル</Button>
            )}
          </div>
          {progress.status === "uploading" ? (
            <div>
              <ProgressBar value={pct} />
              <div className="mt-1 flex items-center justify-between">
                <MutedText level={40}>{`${pct.toFixed(0)}%`}</MutedText>
                <MutedText level={40}>{progress.etaSeconds !== null ? `残り ~${Math.max(0, Math.round(Number(progress.etaSeconds))).toString()}秒` : "計測中..."}</MutedText>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <MutedText level={40}>
                {typeof progress.completed === 'number' && typeof progress.total === 'number'
                  ? `処理 ${progress.completed}/${progress.total}`
                  : "処理中..."}
              </MutedText>
              {typeof progress.completed === 'number' && typeof progress.total === 'number' && (
                <MutedText level={40}>{(() => { const c = Number(progress.completed); const t = Math.max(1, Number(progress.total)); return `${Math.floor((c / t) * 100)}%`; })()}</MutedText>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}


