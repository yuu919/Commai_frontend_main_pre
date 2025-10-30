## lib ディレクトリ分割戦略（実装指針）

このドキュメントは、`src/lib/` 配下の設計原則・依存方向・命名規約・実装フローを定義します。目的は「HTTP クライアントの一元化」「UI からデータ取得手段の切り替え容易化」「技術的負債の抑制」です。

### 原則
- **HTTP クライアント一元化**: 外部通信は `lib/api/*` からのみ行う。UI/フック/Repository からの `fetch` 直叩きは禁止。
- **Server Actions の最小化**: Server Actions は必要箇所のみの薄いラッパ（CSRF/同一オリジン Cookie 等）。基本は `lib/api/*` に集約。
- **Repository パターン**: UI は Repository の抽象にのみ依存。実体は `providers.tsx` で `server`/`mock` を DI 切替。
- **型の一元化**: エンティティ/DTO/Role 等は `lib/db.types.ts` に集約し、重複定義と `any` を排除。
- **エラー標準化**: 例外は `lib/error.ts` と `lib/transport/fetcher.ts` の `normalizeHttpError` に統一。
- **SSE の統一**: ストリームは `lib/api/*`（例: `apiOpenChatStream`）と `lib/transport/sse.ts` を使用。
- **環境切替**: `NEXT_PUBLIC_USE_MOCKS=true` で Mock Repository を使用（本番不可）。

### ディレクトリ構成と役割
- `api/`: HTTP/SSE の関数郡。入出力は `db.types.ts` を使用し、内部で `transport/fetcher.ts` / `transport/sse.ts` のみを呼ぶ。
- `client/`: ブラウザ専用ユーティリティ（例: `auth.client.ts`, `title.client.ts`）。`window` 依存コードはここ。
- `server/`: サーバ専用ユーティリティ（例: `auth.server.ts`）。`next/headers` 等の Server 限定 API はここ。
- `repositories/`: Repository 抽象と実装。命名は `*.server.ts`（実サーバ実装）/`*.mock.ts`（モック実装）。UI は抽象インターフェイスのみに依存。
- `transport/`: 低レベル通信層（`fetcher.ts`, `sse.ts`）。ヘッダー統一/エラー正規化/ストリーム分解を提供。
- `db.types.ts`: すべての共通型。UI も Repository もここを参照し、型の重複を禁止。
- `error.ts`, `a11y.ts`, `keyboard.ts`, `urlState.ts`, `cx.ts`: 横断ユーティリティ。
- `legacy/`: 残置互換コード。新規参照禁止。移行完了後に削除（削除は合意の上で）。

### 依存方向（厳守）
```
UI / Hooks / Server Actions
   ↓ 依存
repositories/* (抽象) ──→ repositories/*.server.ts / *.mock.ts
   ↓ 依存
api/*  (HTTP/SSE 集約)
   ↓ 依存
transport/* (fetcher / sse)
```
- `client/*` と `server/*` はユースケースごとに Repository や API から参照されるが、**UI から transport 直参照は禁止**。

### 命名規約
- API: `api<ResourceVerb>` 例) `apiGetThreads`, `apiCreateMessage`, `apiOpenChatStream`。
- Repository 抽象: `XxxRepository`（動詞はメソッド名に集約）。
- Repository 実装: `createServerXxxRepository`, `createMockXxxRepository`。
- 型: `*Row`, `*Input`, `*Response`, 役割は `ChatRole` 等で明示。

### 実装フロー（新規リソース追加例）
1. `db.types.ts` に型を追加/更新（既存型の再利用を最優先）。
2. `api/*` に HTTP 関数を作成（`fetcher`/`sse` を使用、`unknown` はガードで絞り込み）。
3. `repositories/*` に抽象インターフェイス → `*.server.ts` / `*.mock.ts` を実装。
4. `app/providers.tsx` に Repository の DI を追加し、`NEXT_PUBLIC_USE_MOCKS` で切替。
5. UI/フックは Repository のみ参照（API/transport を直参照しない）。
6. 旧来参照（`lib/db.*` 等）が残る場合は参照ゼロ化→廃止手順へ。

### エラーハンドリング
- すべての HTTP エラーは `normalizeHttpError(status, message)` へ正規化。
- 受信 `unknown` はプロパティ存在チェックで安全に狭める（`in` ガード等）。

### SSE（ストリーミング）
- 開始: `apiOpenChatStream(payload, signal)` を使用。
- パース: `transport/sse.ts` のユーティリティで行い、UI では Repository を介して扱う。

### モック方針
- `*.mock.ts` は開発用の最小十分なデータを返す。
- UI はモック/実装の差を意識しない（Repository 抽象で吸収）。

### 禁止事項
- UI/フックからの `fetch` 直叩き。
- `next/headers` を Client コンポーネントに混在。
- `any` の安易な使用（やむを得ない場合は `unknown` → ガードで狭める）。
- `db.types.ts` 以外での型重複定義。

### 環境変数
- `NEXT_PUBLIC_USE_MOCKS`: `true` の場合、全 Repository をモックに切替（開発専用）。

### 移行/削除ポリシー
- 旧コードは `legacy/` に隔離して参照ゼロ化を確認後に削除。
- 削除は理由・影響範囲を明記しレビュー合意の上で実施。


