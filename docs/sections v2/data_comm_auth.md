## データ/通信/認証 v2（Server Actions 境界を含む）

v1 の方針を継承し、用語と配置のみ v2 構造へ更新。

### データ/通信
- HTTP クライアントに一元化。Server Actions は必要最小の薄いラッパ（Cookie/CSRF が必要な箇所）。
- FastAPI: `/api`（推論/SSE/モデル）, `/api/db`（チャット/プロジェクト/ユーザー）。
- SSE はクライアント直叩き。共通処理は `lib/sse.ts`。
- SWR 既定: `revalidateOnFocus=true`, `dedupingInterval=1000ms`（`app/providers.tsx`）。

### 認証
- 現状: Legacy。CSR ガード。
- 将来: `middleware.ts` で SSR ガード（`auth_token` Cookie）。
- Server 側は `lib/server/auth.server.ts`/`lib/server/db.server.ts` に集約。

補足（本リポジトリ決定事項）:
- 開発用バイパス (`/__auth/on|off`, `?auth=off`) は本番では無効化。
- `lib/server/auth.server.ts` にて Cookie→Bearer 組み立てを実装し、`auth.client.ts` はクライアント専用を維持。

### Cookie vs Header
- ブラウザ→Next: HttpOnly Cookie（SameSite=Lax, Secure）。
- Next→FastAPI: `Authorization: Bearer`（Server 側で組み立て）。
- セット/クリア: `/api/session/set|clear`。

### Server Actions 境界（共有）
- 現状: クライアント fetch（POST/DELETE `/api/db/chats/{chat_id}/share`）。
- 将来: Server Action 経由のみ。Zod 検証/正規化、同一オリジン POST 限定。

### 型/契約と SSE の単一化
- 型: `src/lib/db.types.ts`（DB行/入出力/共有）。
- SSE: `src/lib/sse.ts`（判別ユニオン/型ガード/節流）。


