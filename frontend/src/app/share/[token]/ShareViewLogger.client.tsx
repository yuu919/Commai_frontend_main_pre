"use client";

import { useEffect } from "react";

export default function ShareViewLogger({ token }: { token: string }) {
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        // ベストエフォート: バックエンドに閲覧ログ送出（存在しない場合は無視）
        const base = process.env.NEXT_PUBLIC_DB_API_URL || "";
        await fetch(`${base}/api/db/shares/${encodeURIComponent(token)}/view`, {
          method: "POST",
          cache: "no-store",
          signal: controller.signal,
        }).catch(() => {});
      } catch {}
    })();
    return () => controller.abort();
  }, [token]);
  return null;
}


