# 設定 › 接続 — Backend Handover (v0)

フロント仕様に基づく接続管理のAPI定義。Amazon（SP＋広告・DSP・ベンダー）専用。RFC7807互換エラー推奨。

## 1. 認可・前提
- 認証: `Authorization: Bearer` 必須
- 監査: `actor_id, action, target(storeId/service), ts, ip, ua`
- セッション管理: 接続フローの途中状態を一時保持（Redis等）
- Amazon OAuth: SP/広告/DSP/ベンダーそれぞれ異なるスコープ・エンドポイント

## 2. 型
```ts
export type ServiceType = 'sp_ads' | 'dsp' | 'vendor';
export type ConnectionStatus = 'ok' | 'needs_auth' | 'syncing' | 'failed' | 'disconnected';

export interface StoreConnection {
  storeId: string;
  storeName: string;
  services: Array<{
    type: ServiceType;
    status: ConnectionStatus;
    lastSyncAt?: string;
    tokenExpiryAt?: string;
    consecutiveFailures: number;
    jobId?: string;
  }>;
}

export interface ConnectSession {
  sessionId: string;
  storeId: string;
  services: ServiceType[];
  state: 'pending' | 'success' | 'partial' | 'failed';
  details: Array<{
    service: ServiceType;
    status: 'success' | 'failed';
    message?: string;
  }>;
}
```

## 3. API
### 3.1 初期表示
```
GET /api/connections/stores?status=&service=&q=
```
- 200: `{ items: StoreConnection[] }`

```
GET /api/connections/summary
```
- 200: `{ totalStores: number, needsAuth: number, syncing: number, failed: number }`

### 3.2 ウィザード開始
```
GET /api/connections/prereq
```
- 200: `{ hasStore: boolean, stores: Array<{id, name}> }`

```
POST /api/connections/initiate
```
- body: `{ storeId: string, services: ServiceType[] }`
- 事前条件: `services` はユニーク（`sp_ads`/`dsp`/`vendor`）。FE は `SP/広告` の個別選択時も `sp_ads` に正規化し、重複を除外して送信。
- 201: `{ sessionId: string, scopes: Record<ServiceType, string[]> }`

### 3.3 認証開始
```
POST /api/connections/authorize
```
- body: `{ sessionId: string }`
- 200: `{ authUrl: string }`

### 3.4 コールバック処理
```
GET /api/connections/callback?sessionId=&code=&state=
```
- 200: リダイレクト（`/settings/connections?modal=connect&sessionId=...`）
- 処理: トークン交換 → 接続レコード作成 → 初回同期ジョブ起動

### 3.5 セッション状況
```
GET /api/connections/session-status?sessionId=
```
- 200: `ConnectSession`

### 3.6 通知登録
```
POST /api/connections/notify-on-ready
```
- body: `{ storeId: string, services: ServiceType[] }`
- 200: `{ registered: boolean }`

備考: `services` には成功した接続のみが入る（FEはStep3成功項目から抽出）。

### 3.7 復旧系
```
POST /api/connections/reauth
```
- body: `{ storeId: string, service: ServiceType }`
- 200: `{ authUrl: string }`

```
POST /api/connections/sync
```
- body: `{ storeId: string, service: ServiceType }`
- 202: `{ jobId: string }`

```
POST /api/connections/sync-bulk
```
- body: `{ storeId: string, services: ServiceType[] }`
- 202: `{ jobId: string }`

```
GET /api/connections/job?jobId=
```
- 200: `{ status: 'running'|'completed'|'failed', progress?: number, message?: string }`

```
POST /api/connections/unlink
```
- body: `{ storeId: string, service: ServiceType }`
- 200: `{ status: 'disconnected' }`

```
GET /api/connections/last-error?storeId=&service=
```
- 200: `{ code: string, message: string, detail?: string, occurredAt: string }`

## 4. 非機能要件
- セッション有効期限: 30分（延長可）
- ジョブ進捗: ポーリング 2-5s または SSE
- トークン更新: 期限7日前に自動更新試行
- 失敗リトライ: 指数バックオフ、最大3回
- 監査: 接続/切断/再認証/同期の全操作を記録

## 5. エラーポリシー
- 400/422: バリデーション
- 401/403: 認証・認可
- 409: 競合（既に実行中等）
- 429: レート制限
- 5xx: サーバエラー

## 6. 実装メモ
- Amazon OAuth フロー: 各サービス（SP/広告/DSP/ベンダー）で異なるスコープ・エンドポイント
- SP＋広告の連続処理: 1つ目成功→2つ目実行、部分成功も許容（`sp_ads` として一括管理）
- セッション復帰: sessionId でStep3の状態を復元
- 初回同期: 接続直後に自動開始（最大24時間）

## 7. 排他ルール（参考：FEに合わせる）
- ベンダー ⇄ SP系（SP/広告/SP＆広告）は相互排他
- DSPは独立（ベンダー/SP系と併用可能）
