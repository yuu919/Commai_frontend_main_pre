# Settings › Contact — Backend Handover (v0)

フロント最終仕様に基づく BE 仕様（モック→本実装）。RFC7807互換エラー（最小: code/message/hint）を推奨します。

## 1. 認可・前提
- 認証: `Authorization: Bearer`（未ログインも想定する場合は省略可。今回はログイン前提でOK）
- 監査: `actor_id, action, targetId, ts, ip, ua`
- 添付ファイル: 最大3ファイル、合計10MB、許可拡張子: pdf,csv,xlsx,xls,png,jpg,jpeg
- 連投対策: 同一 `actor_id` から 30s 以内の再送は 429（または 202 既受理）

## 2. 型
```ts
export type ContactCategory =
  | 'account_login'
  | 'system_usage'
  | 'billing'
  | 'bug'
  | 'feedback'
  | 'other';

export interface CreateContactRequest {
  category: ContactCategory;            // 必須
  email: string;                        // 必須、ログイン時は FE 初期値
  title: string;                        // 1..120
  message: string;                      // 20..5000（HTML不可）
  attachments?: Array<{                // 任意（最大3）
    filename: string;
    contentType: string;
    size: number;                       // bytes
    base64: string;                     // v0は簡易でbase64送信も可（将来S3直PUTへ）
  }>;
  consent: boolean;                     // 必須
}

export interface CreateContactResponse {
  ticketId: string;                     // 例: "ABC123"
}
```

## 3. API
### 3.1 送信
```
POST /api/contact
```
- headers: `Idempotency-Key`, `Authorization`（任意）, `Content-Type: application/json`
- body: `CreateContactRequest`
- 201: `CreateContactResponse`
- 400/422: バリデーションエラー（配列で返却推奨）
- 429: 連投
- 5xx: サーバエラー

### 3.2 確認メール（サーバ内実装）
- 送信成功後、以下を実施
  - 申請者へ受付メール（ticketId、返信目安）
  - 運用窓口へ通知（メール/Slack 等）

## 4. バリデーション（サーバ）
- `email` RFC準拠 + 禁止ドメイン/ブロックリスト
- `title` 1..120、`message` 20..5000、HTMLタグ除去（サニタイズ）
- `attachments` 拡張子/サイズ/個数の上限
- `consent` が true であること

## 5. 非機能
- 保存先: チケット管理はメール運用想定のため、DBは任意（必要なら `contacts` テーブルで保存）
- 監査ログ: `contact.create` を記録
- レート制限: `IP + actor_id` 単位

## 6. ルーティング（Next.js実装メモ）
- `/app/settings/contact/page.tsx`…フォーム（Client Component）。`/api/contact` を呼ぶ。
- `/app/api/contact/route.ts`…上記仕様で実装（v0はメモリ保存でも可）。

## 7. やらない（v0）
- アプリ内のチケット閲覧・返信UI
- カテゴリ自動エスカレーション/SLA
- ヘルプ検索連携


