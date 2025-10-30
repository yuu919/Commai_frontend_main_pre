# Settings › Run Logs — Backend Handover (Current)

フロント最終仕様に基づく BE 仕様（モック→本実装）。エラーポリシーは RFC7807 互換で最小 `code/message/hint` を返すことを推奨します。

## 1. 認可・ポリシー
- 認証: `Authorization: Bearer <token>` 必須
- 可視範囲: 呼び出しユーザーが閲覧権を持つスレッドのみ返却（ACL）
- Single-Owner Threads: スレッドは常にオーナー1名。Fork/Handoffで新スレッド生成。
- 監査: `actor_id, action, target(type/id), before/after, ts, ip, ua`

## 2. 型（フロントと整合）
```ts
// 親行
interface ThreadSummary {
  threadId: string;
  title: string;
  owner: { id: string; name: string };
  visibility: 'private'|'team-ro'|'link-ro';
  updatedAt: string;
  firstRunAt: string;
  lastRunAt: string;
  okCount: number;
  failCount: number;
  scope: { platform: string; store: string };
  evidenceCount?: { table?: number; image?: number; pdf?: number; link?: number };
  origin?: { kind: 'fork'|'handoff'; fromThreadId?: string; fromRunId?: string; mode?: 'prompt-only'|'upto'|'full' };
  archived?: boolean;
}

// 子行
interface RunLog {
  id: string;
  ts: string;
  status: 'completed'|'running'|'paused'|'failed'|'canceled';
  question: string;
  answerSummary?: string;
  type: 'Ask'|'Agent';
  evidenceCount?: { table?: number; image?: number; pdf?: number; link?: number };
  forkMeta?: { fromThreadId: string; fromRunId: string; mode: 'prompt-only'|'upto'|'full' };
}
```

## 3. API

### 3.1 スレッド一覧（親行） — ThreadTable で使用
```
GET /api/db/run-logs/threads?q=&from=&to=&status=&type=&platformIds=&storeIds=&userIds=&sort=&limit=&cursor=
```
- クエリ
  - `q`: テキスト検索（タイトルのみ。v0ではオーナー名/Run本文は対象外）
  - `from/to`: 期間（ISO8601、日付のみ可）
  - `status[]`: `completed|running|paused|failed|canceled`（OR）
  - `type[]`: `Ask|Agent`（OR）
  - `platformIds[]`（OR）
  - `storeIds[]`（OR）
  - `userIds[]`（OR）
  - `sort`: `updatedAt desc|asc`（既定 desc）
  - `limit`: 50/100/200（既定 50）
  - `cursor`: 次ページトークン
- 200: `{ items: ThreadSummary[], nextCursor?: string }`
 - 仕様: スレッド単位のAPIでは `status/type` のサマリ適用は v0 では不要（将来拡張）。

### 3.2 スレッド内Run（子行） — 展開時に使用
```
GET /api/db/run-logs/threads/:threadId/runs?cursor=&limit=
```
- 200: `{ items: RunLog[], nextCursor?: string }`
 - 仕様: `type` は Ask/Agent のみ。`evidenceCount` は 0 件種を含めない。

### 3.3 再実行
```
POST /api/run-logs/:runId/rerun
```
- 200: `{ newRun: RunLog, threadId: string }`
- 挙動: 新規RunはThread先頭に追加される想定（フロントで即時反映）

### 3.4 失敗詳細
```
GET /api/run-logs/:runId/error
```
- 200: `{ code: string, message: string, detail?: string }`

### 3.5 エビデンス一覧（Run or Thread）
```
GET /api/run-logs/:runOrThreadId/evidence
```
- 200: `{ items: [{ id, kind:'table'|'image'|'pdf'|'link', title, fetchedAt, url }] }`

### 3.6 別スレッドとしてコピー（Fork） — 親行メニューから起動
```
POST /api/runs/:runId/fork
POST /api/threads/:threadId/fork
```
- Request: `{ mode:'prompt-only'|'upto'|'full', visibility:'private'|'team-ro'|'link-ro', members?:string[], copyEvidence?:boolean }`
- 200: `{ newThreadId: string }`

### 3.7 引き継ぎ（Handoff） — 親行メニューから起動
```
POST /api/threads/:threadId/handoff
```
- Request: `{ toUserId: string, visibility?: 'private'|'team-ro'|'link-ro' }`
- 200: `{ newThreadId: string }`

## 4. エラーポリシー（共通）
- 400 validation / 401-403 auth / 404 not found / 409 guard / 5xx server
- 推奨本文（RFC7807互換）：
```json
{ "code":"OWNER_REQUIRED", "message":"At least one owner is required", "hint":"Assign another owner before downgrading." }
```

## 5. パフォーマンス / セキュリティ
- ページング: 親100件/子20件を目安。`nextCursor` を返却。
- アクセス制御: スレッド単位でACL必須。閲覧不可スレッドは検索・APIとも非公開。
- フィールドマスキング: エビデンスURL等は必要最小限。PIIは返却禁止（または匿名化）。
 - タイプ統一: フロント表示は Ask/Agent のみ。`type` にその他が含まれてもUIはAgentとして表示。

## 6. 実装メモ
- フロントは Tailwind不使用・既存CSSで構成。レスポンスは極力軽量に。
- 失敗詳細/Errorは本文と合わせて**提案アクション**（再実行/チャットへ）を返すとUXが良い。
