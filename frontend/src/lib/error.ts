export const MESSAGES = {
  uploadCancelledNoSave: "ファイルアップロードがキャンセルされました。メッセージは保存されません。",
  streamCancelledPartialSave: "AIの応答が中断されました。途中まで保存されました。",
  streamCancelledSaveFailed: "AIの応答が中断されましたが、途中保存に失敗しました。",
  streamCancelledNoSave: "AIの応答が中断されました。メッセージは保存されません。",
  serviceWarmingUp: "サービス起動中です。しばらくしてから再試行してください。",
  networkError: "ネットワークエラーが発生しました。接続を確認してください。",
  unknownError: "不明なエラーが発生しました。",
} as const;

// Moved from lib/transport/fetcher.ts to centralize error normalization
export function normalizeHttpError(status: number, raw: string | unknown): Error {
  let message = `HTTP ${status}`;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const detail = (parsed?.detail as string | undefined) ?? (parsed?.message as string | undefined);
      message = (detail && String(detail)) || message;
    } catch {
      message = (raw as string) || message;
    }
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const detail = (obj.detail as string | undefined) ?? (obj.message as string | undefined);
    if (detail) message = String(detail);
  }
  if (status === 503) message = MESSAGES.serviceWarmingUp;
  else if (typeof raw === "string" && raw.includes("Failed to fetch")) message = MESSAGES.networkError;
  if (!message) message = MESSAGES.unknownError;
  const e: Error & { status?: number } = new Error(message);
  e.status = status;
  return e;
}

export function normalizeErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message || MESSAGES.unknownError;
  try {
    return JSON.stringify(e);
  } catch {
    return MESSAGES.unknownError;
  }
}

export type UiErrorPresentation = { ui: "toast" | "banner"; variant: "error" | "warn" | "info" };

export function categorizeHttpStatus(status?: number): UiErrorPresentation {
  const s = Number(status ?? 500);
  if (s === 401) return { ui: "banner", variant: "error" };
  if (s === 403) return { ui: "toast", variant: "error" };
  if (s === 404) return { ui: "toast", variant: "info" };
  if (s === 409) return { ui: "toast", variant: "warn" };
  if (s === 429) return { ui: "banner", variant: "warn" };
  if (s === 503) return { ui: "banner", variant: "info" };
  if (s >= 500) return { ui: "banner", variant: "error" };
  if (s >= 400) return { ui: "toast", variant: "error" };
  return { ui: "toast", variant: "error" };
}


