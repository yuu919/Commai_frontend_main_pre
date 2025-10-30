"use server";
import { z } from "zod";
import { dbUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";

const CreateThreadInput = z.object({
  title: z.string().trim().max(120).optional(),
});

export async function createThreadAction(input: unknown): Promise<string> {
  const { title } = CreateThreadInput.parse(input ?? {});
  const headers = await buildUnifiedHeaders({ "Content-Type": "application/json" });
  // In mock mode, skip calling DB API and synthesize a thread id
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    // Prefer crypto.randomUUID when available
    const id = (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return String(id);
  }

  const maxAttempts = 4;
  let attempt = 0;
  let lastErr: Error | null = null;
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(dbUrl("/api/db/chats"), {
        method: "POST",
        headers,
        body: JSON.stringify({ title: title ?? "無題" }),
        cache: "no-store",
      });
      if (res.status === 503) {
        // backend warm-up。指数バックオフで再試行
        attempt += 1;
        const waitMs = 300 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to create thread: ${res.status} ${text}`);
      }
      const data = await res.json();
      return String(data.id ?? data.chat_id ?? data?.data?.id ?? crypto.randomUUID());
    } catch (e) {
      lastErr = e as Error;
      attempt += 1;
      const waitMs = 300 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr ?? new Error("Failed to create thread after retries");
}


