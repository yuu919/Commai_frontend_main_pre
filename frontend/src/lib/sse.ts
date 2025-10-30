/**
 * SSE payload contract (frontend-side normalization)
 * - thinking: { thinking_status, message?, thinking_metadata? { completed?, total? } }
 * - content: { content }
 * - evidence: { evidence_id, message? }
 * - metadata: { metadata: { completed?, total?, ... } }
 * - error: { error, code?, user_message? }
 */
export type SseContent = { content: string };
export type SseEvidence = { evidence_id: string | number; message?: string };
export type SseError = { error: string; code?: string; user_message?: string };
export type SseThinking = { thinking_status: string; message?: string; thinking_metadata?: Record<string, unknown> };
export type SseMetadata = { metadata: Record<string, unknown>; agent_type?: string; autonomous_mode?: boolean; file_upload?: boolean };

export type SsePayload = SseContent | SseEvidence | SseError | SseThinking | SseMetadata;

export const isError = (v: SsePayload): v is SseError => (v as SseError)?.error !== undefined;
export const isEvidence = (v: SsePayload): v is SseEvidence => (v as SseEvidence)?.evidence_id !== undefined;
export const isContent = (v: SsePayload): v is SseContent => (v as SseContent)?.content !== undefined;
export const isThinking = (v: SsePayload): v is SseThinking => (v as SseThinking)?.thinking_status !== undefined;
export const isMetadata = (v: SsePayload): v is SseMetadata => (v as SseMetadata)?.metadata !== undefined;

export function parseSseLines(buffer: string, onEvent: (payload: SsePayload) => void) {
  const events = buffer.split(/\n\n/);
  for (const evt of events) {
    const lines = evt.split(/\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if (dataStr === "[DONE]") continue;
      try {
        const json: SsePayload = JSON.parse(dataStr);
        onEvent(json);
      } catch {}
    }
  }
}

// Extract batch progress counters (completed/total) from either thinking or generic metadata
export function extractBatchProgress(v: SsePayload): { completed?: number; total?: number } {
  if (isThinking(v)) {
    const completed = (v as SseThinking).thinking_metadata?.completed as number | undefined;
    const total = (v as SseThinking).thinking_metadata?.total as number | undefined;
    return { completed, total };
  }
  if (isMetadata(v)) {
    const meta = (v as SseMetadata).metadata as Record<string, unknown>;
    const completed = typeof meta.completed === "number" ? meta.completed : undefined;
    const total = typeof meta.total === "number" ? meta.total : undefined;
    return { completed, total };
  }
  return {};
}

// requestAnimationFrameでUI更新頻度を抑制するユーティリティ
// 高頻度のSSE content更新を合流し、1フレームに1回だけコールバックを呼ぶ
export function createRafCoalescer<T>(onEmit: (data: T) => void) {
  let scheduled = false;
  let latest: T | null = null;
  return (data: T) => {
    latest = data;
    if (scheduled) return;
    scheduled = true;
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      scheduled = false;
      if (latest != null) onEmit(latest);
      latest = null;
      return;
    }
    window.requestAnimationFrame(() => {
      scheduled = false;
      if (latest != null) onEmit(latest);
      latest = null;
    });
  };
}


