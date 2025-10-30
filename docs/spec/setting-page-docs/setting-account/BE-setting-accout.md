### バックエンド引き継ぎ（/settings/account — ログイン設定）

- **前提（共通）**
  - 認証: OIDC（Cookie/Bearer）。全更新系は `Idempotency-Key` 必須、`x-audit-correlation-id` 付与。
  - エラー: RFC7807 互換（title/detail/status/type）。422 は入力不正、401/403 は権限系。
  - 監査: actor_id, action, resource(before/after), ts, ip, ua を記録。
  - レスポンスは JSON。タイムスタンプは ISO8601/UTC。

---

- **プロフィール**
  - UI: `PasswordChangeModal`（現在/新/確認）
  - 必要処理
    - 再認証（必要時）
      - POST `/auth/reauth`
      - body: `{ "password": "string" }`
      - 200: `{ "token": "reAuthToken" }`
    - パスワード変更
      - POST `/auth/password/update`
      - headers: `Idempotency-Key`, `Authorization`, optional `X-Reauth-Token`
      - body:
        ```json
        { "current": "string", "next": "string" }
        ```
      - 200: `{ "ok": true }`
      - 400/422: ポリシー不一致（長さ/複雑性）、現在パスワード不一致
  - バリデーション（BE）
    - 最低8文字/辞書攻撃対策（common password denylist）
    - 直近 N 回と同一不可（履歴）

---

- **2段階認証（メール）**
  - UI: `TwoFactorEmailToggle`（無効/メール）→ `TwoFactorEmailVerifyModal`（6桁）
  - 必要処理
    - 有効化リクエスト（コード送信）
      - POST `/auth/2fa/email/enable`
      - 200: `{ "sent": true, "cooldownSec": 60 }`
      - 409: 既に有効
    - コード検証（6桁）
      - POST `/auth/2fa/email/verify`
      - body: `{ "code": "string(6)" }`
      - 200: `{ "status": "enabled" }`
      - 400/422: フォーマット不正/コード不正、429: クールダウン中
    - 無効化
      - POST `/auth/2fa/email/disable`
      - 200: `{ "status": "disabled" }`
      - 401/403: 再認証要求あるいは権限不足
    - 再送
      - POST `/auth/2fa/email/resend`
      - 200: `{ "sent": true, "cooldownSec": 60 }`
  - ポリシー（BE）
    - コードは TOTP ではなく one-time 6桁/5分有効/最大試行回数5回
    - クールダウン: 60s（再送）

---

- **メールアドレス変更**
  - UI: `EmailChangeSection`（新メール→送信 / 確認待ちバナー：再送・取消）
  - 必要処理
    - 変更リクエスト
      - POST `/account/email/change`
      - headers: `Idempotency-Key`
      - body:
        ```json
        { "newEmail": "user@example.com" }
        ```
      - 202: `{ "pendingEmail": "user@example.com" }`（確認メール送信）
      - 409: 既に同一メール/保留中
    - 確認リンク（メール内）
      - POST `/account/email/confirm`
      - body: `{ "token": "string" }`
      - 200: `{ "email": "new@example.com" }`
      - 410: トークン期限切れ、409: 取り消し済み
    - 再送
      - POST `/account/email/resend`
      - 200: `{ "sent": true, "cooldownSec": 60 }`
    - 取り消し
      - POST `/account/email/cancel`
      - 200: `{ "pending": false }`
  - バリデーション（BE）
    - MX/禁止ドメイン/既存重複チェック、本人確認（再認証）要件があれば同様に `X-Reauth-Token`

---

- **非機能/共通仕様**
  - **レート制限**（推奨）：/reauth, /password/update, 2FA verify/resend, email resend に IP+actor ベースの制限
  - **通知**：成功/失敗の重要イベントはセキュリティ通知（メール/Webhook）を発行可
  - **国際化**：テンプレートメール（ja）を BE 側で管理。将来 en 追加を想定（locale ヘッダ）

---

- **FE からの呼び出しイベント（現在のUI実装と対応）**
  - PasswordChangeModal.onSubmit → `/auth/password/update`
  - TwoFactorToggle.onEnable → `/auth/2fa/email/enable` → VerifyModal.onVerify → `/auth/2fa/email/verify`
  - TwoFactorToggle.onDisable → `/auth/2fa/email/disable`（confirm OK の場合）
  - EmailChangeSection.onSend → `/account/email/change`
  - EmailChangeSection.onResend → `/account/email/resend`
  - EmailChangeSection.onCancel → `/account/email/cancel`

以上をベースに BE 実装・契約のドラフトを作成ください。

結論: ほぼ完成。バックエンドが仕様通りに動けば、主要フローはそのまま繋がります。残りは「console.log を実APIに置換」と「初期状態の取得」と「共通エラー/UI抑止」の実装のみです。

- すでに完了（BEがあれば即動く）
  - パスワード変更モーダル（UI/検証/Enter/Esc/フォーカス）
  - 2FA（無効/メール）切替UI＋Verifyモーダル（6桁/再送60s）
  - メール変更UI（送信→保留バナー→再送/取消）
  - レイアウト/ナビ/アクセシビリティ最低限

- フロント最終実装タスク（短時間）
  - API接続: 現在の console.log を実APIに置換（Idempotency-Key/監査ヘッダ付与）
    - POST `/auth/password/update`
    - POST `/auth/2fa/email/enable|verify|disable|resend`
    - POST `/account/email/change|resend|cancel`
  - 初期状態取得（マウント時）
    - GET `/me`（name/email）
    - GET `/auth/2fa/status`（enabled/disabled）
    - GET `/account/email/pending`（保留メール有無）
  - エラー/ローディング
    - RFC7807を共通処理（ボタン disabled・トースト表示）
    - サーバの cooldownSec をUIタイマーに反映（再送ボタン）
  - 再認証トークンの受け渡し（必要時のみ）
    - `/auth/reauth` → 成功時 `X-Reauth-Token` を更新系APIに付加
  - 任意: メール確認リンクのディープリンク処理
    - `?confirmEmail=token` を検知→自動で `/account/email/confirm` → 成功トースト

上記が入れば、このページはBEリリースと同時に機能として完成します。