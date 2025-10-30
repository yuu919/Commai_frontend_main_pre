import { dbUrl } from "@/lib/transport/fetcher";
import { buildUnifiedHeaders } from "@/lib/client/auth.client";
import type { UserDetail } from "@/lib/db.types";

export async function apiGetMe(): Promise<UserDetail> {
  const headers = buildUnifiedHeaders();
  const res = await fetch(dbUrl("/api/db/users/me"), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
  return res.json();
}


