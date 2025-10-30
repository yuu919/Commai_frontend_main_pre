export type UploadingProgress = {
  status: "uploading";
  message: string;
  progressPct: number;
  uploadedBytes: number;
  totalBytes: number;
  etaSeconds: number | null;
  filesUploaded: number;
  totalFiles: number;
};

export type ProcessingProgress = {
  status: "processing" | "warning" | "completed";
  message?: string;
  metadata?: Record<string, unknown>;
  // Batch processing counters emitted by server when available
  completed?: number;
  total?: number;
};

export type UploadProgress = UploadingProgress | ProcessingProgress;
import { apiUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import { parseSseLines, isError, isContent, isThinking, isMetadata, createRafCoalescer, extractBatchProgress } from "@/lib/sse";

export async function uploadWithSse(
  files: File[],
  params: { message?: string; model?: string; threadId?: string },
  handlers: { onProgress?: (p: UploadProgress) => void; onChunk?: (content: string) => void; onDone?: () => void; onError?: (err: string) => void; onCancel?: (api: { cancel(): void }) => void }
) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (params.message) form.append("message", params.message);
  if (params.model) form.append("model", params.model);
  if (params.threadId) form.append("chat_id", params.threadId);

  const endpoint = apiUrl("/api/chat/upload");

  // Coalescers to throttle UI updates to one per animation frame
  const emitChunk = createRafCoalescer<string>((content) => {
    handlers.onChunk?.(content);
  });
  const emitProgress = createRafCoalescer<UploadProgress>((progress) => {
    handlers.onProgress?.(progress);
  });
  // In browser, use XMLHttpRequest to track upload progress and parse SSE from responseText.
  if (typeof window !== "undefined" && typeof XMLHttpRequest !== "undefined") {
    const xhr = new XMLHttpRequest();
    const headers = buildUnifiedHeaders();
    if (handlers.onCancel) handlers.onCancel({ cancel: () => xhr.abort() });
    const startAt = Date.now();
    xhr.open("POST", endpoint, true);
    // Set headers except content-type
    Object.entries(headers).forEach(([k, v]) => {
      if (k.toLowerCase() !== "content-type") xhr.setRequestHeader(k, v);
    });
    let lastIndex = 0;
    xhr.onprogress = () => {
      // Parse incremental SSE chunks from responseText
      const text = xhr.responseText || "";
      const newText = text.substring(lastIndex);
      lastIndex = text.length;
      const parts = newText.split("\n\n");
      for (const evt of parts) {
        const lines = evt.split("\n");
        for (const raw of lines) {
          const line = raw.trim();
          if (!line || !line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") {
            handlers.onDone?.();
            return;
          }
          parseSseLines(`data: ${dataStr}\n\n`, (obj) => {
            if (isError(obj)) {
              handlers.onError?.(obj.user_message ?? obj.error ?? "エラーが発生しました");
            } else if (isContent(obj)) {
              emitChunk(obj.content);
            } else if (isThinking(obj)) {
              const { completed, total } = extractBatchProgress(obj);
              const st: "processing" | "warning" = obj.thinking_status === "warning" ? "warning" : "processing";
              emitProgress({ status: st, message: obj.message, metadata: obj.thinking_metadata, completed, total });
            } else if (isMetadata(obj)) {
              const { completed, total } = extractBatchProgress(obj);
              emitProgress({ status: "processing", message: "", metadata: obj.metadata, completed, total });
            }
          });
        }
      }
    };
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = (e.loaded / e.total) * 100;
      const elapsed = (Date.now() - startAt) / 1000;
      const rate = e.loaded / Math.max(elapsed, 0.001); // bytes/sec
      const remaining = e.total - e.loaded;
      const eta = rate > 0 ? remaining / rate : null;
      const progress: UploadingProgress = {
        status: "uploading",
        message: `アップロード中... ${files.length}ファイル`,
        progressPct: pct,
        uploadedBytes: e.loaded,
        totalBytes: e.total,
        etaSeconds: eta,
        filesUploaded: 0,
        totalFiles: files.length,
      };
      emitProgress(progress);
    };
    return await new Promise<void>((resolve) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            handlers.onDone?.();
          } else {
            handlers.onError?.(`Upload failed: ${xhr.status}`);
          }
          resolve();
        }
      };
    xhr.onerror = () => {
      handlers.onError?.("ネットワークエラーが発生しました。アップロードに失敗しました。");
      handlers.onDone?.();
    };
      xhr.send(form);
    });
  }
  // Fallback to fetch (no upload progress)
  const controller = new AbortController();
  if (handlers.onCancel) handlers.onCancel({ cancel: () => controller.abort() });
  const headers = buildUnifiedHeaders();
  if (headers["Content-Type"]) delete headers["Content-Type"];
  const res = await fetch(endpoint, { method: "POST", body: form, headers, signal: controller.signal });
  if (!res.ok || !res.body) {
    handlers.onError?.(`アップロード開始に失敗しました: ${res.status}`);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let pending = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      pending += chunk;
      const events = pending.split(/\n\n/);
      pending = events.pop() ?? "";
      for (const evt of events) {
        const lines = evt.split(/\n/);
        for (const raw of lines) {
          const line = raw.trim();
          if (!line || !line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") {
            handlers.onDone?.();
            return;
          }
          parseSseLines(`data: ${dataStr}\n\n`, (obj) => {
            if (isError(obj)) {
              handlers.onError?.(obj.user_message ?? obj.error ?? "エラーが発生しました");
            } else if (isContent(obj)) {
              emitChunk(obj.content);
            } else if (isThinking(obj)) {
              const { completed, total } = extractBatchProgress(obj);
              const st: "processing" | "warning" = obj.thinking_status === "warning" ? "warning" : "processing";
              emitProgress({ status: st, message: obj.message, metadata: obj.thinking_metadata, completed, total });
            } else if (isMetadata(obj)) {
              const { completed, total } = extractBatchProgress(obj);
              emitProgress({ status: "processing", message: "", metadata: obj.metadata, completed, total });
            }
          });
        }
      }
    }
  } catch (e) {
    handlers.onError?.(e instanceof Error ? e.message : String(e));
  } finally {
    handlers.onDone?.();
  }
}


