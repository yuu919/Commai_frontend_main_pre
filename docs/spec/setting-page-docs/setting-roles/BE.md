# 設定 › ロール定義 — Backend Handover (v0)

フロント仕様に基づき、ロールしきい値（General/Manager/Owner）を各リソース単位で保存するためのAPIを定義します。エラーは RFC7807 互換を推奨します（最小: code/message/hint）。

## 1. 用語
- Role: `general | manager | owner`
- しきい値（threshold）: リソースを利用するために必要な最小ロール（＝以上）

## 2. 型
```ts
export type Role = 'general'|'manager'|'owner';

export interface ResourceDef {
  id: string;               // 例: "fba_reports"
  name: string;             // 表示名
  description?: string;
  aliases?: string[];       // 別名検索用
  categoryId: string;       // 例: "report"
  categoryLabel: string;    // 例: "レポート"
  threshold: Role;          // サーバ保存値
}

export interface EstimateResult {
  changedCount: number;
  affectedUsers: number;    // 粗い見積り
  warnings?: { code: string; message: string }[]; // 危険な緩和変更等
}
```

## 3. API
### 3.1 一覧取得（初期表示）
```
GET /api/roles/resources
```
- 200: `{ items: ResourceDef[] }`
- 備考: v0は全件取得。検索・フィルタはクライアント側で実行。

### 3.2 影響見積り
```
POST /api/db/roles/estimate
```
- body: `{ changes: Array<{ id: string; threshold: Role }> }`
- 200: `EstimateResult`

### 3.3 保存
```
POST /api/db/roles/save
```
- headers: `Idempotency-Key`
- body: `{ changes: Array<{ id: string; threshold: Role }> }`
- 200: `{ updated: number }`  // 更新件数

## 4. バリデーション
- 不正IDは 422（複数ある場合は配列で返却推奨）
- `threshold` は `general|manager|owner` のみ

## 5. 非機能
- 監査: `roles.update`（actor, before/after, ts, ip, ua）
- 競合: 直近の保存以降にBE側が更新された場合は 409 / 412 を検討（v0は楽観ロック省略可）
- パフォーマンス: 一覧はカテゴリ別にキャッシュ可

## 6. 備考
- しきい値は“以上”の意味を持つため、行単位で単一値のみを保存（列ごとでなく1値）
- v0ではカスタムロールや依存解決は対象外
