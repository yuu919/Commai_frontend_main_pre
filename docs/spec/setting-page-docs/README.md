# 設定ページ — 総合ハンドオーバー（最終）

本書は設定配下（/settings/*）の現行フロント実装の要点・残事項・バックエンド接続観点を集約したものです。以降はメインページ開発に移行し、残りは最後に調整するか BE 実装へ委譲可能です。

## 0. 共通方針
- 技術: Next.js(App Router) + React + TypeScript(strict) + CSS 変数（ダーク/ライト）
- A11y: モーダル/ダイアログ/ウィザードはフォーカストラップ・Esc 閉。トーストは `aria-live="polite"`。
- UI: 共通 `.btn/.btn-lg/.input`（高さ28px）。テーブルは `tableLayout: fixed + colgroup` で列幅安定、長文は ellipsis。
- モック: DEV-ONLY。フロント側の“無理な正規化”は撤去し、理想的なBE契約に寄せ済み。
- ルーティング: 設定は `app/(settings)/settings/*` のルートグループ配下で独立レイアウト（Header/Threads/Inspector なし）。メインは `app/(app)` 配下の3領域フレーム。

## 1) ログイン設定（/settings/account）
- 実装
  - プロフィール: `ProfileSummary`
  - パスワード変更: `PasswordChangeModal`（8文字以上・一致／Enter送信・Esc閉）
  - 2FA（メール）: `TwoFactorEmailToggle` → `TwoFactorEmailVerifyModal`（6桁・再送60s UI）
  - メール変更: `EmailChangeSection`（送信→確認待ち→再送/取消）
- BE（例）
  - POST `/api/account/password/update` { currentPassword, newPassword }
  - POST `/api/account/2fa/email/enable` → POST `/api/account/2fa/email/verify` { code }
  - POST `/api/account/2fa/email/disable`
  - POST `/api/account/email/change` { newEmail } → POST `/api/account/email/confirm` / `/cancel`

## 2) プラン・請求（/settings/billing）
- 実装（最小）
  - `CurrentPlanCard`（表示）
  - `ManageBillingCard`（Stripe Customer Portal）
- BE
  - POST `/api/billing/portal` → { url }
  - GET `/api/billing/current`（任意）
- 非対応: 支払い方法/請求先/履歴はポータル委譲

## 3) ユーザー・権限（/settings/users-access/[platformId]/[storeId]）
- 前提: Amazon専用・Scopedビュー
- レイアウト
  - 左 280px 固定
  - テーブル: 固定列（ロール120/状態100/更新110/操作100）+ 残り430px= Scope25%/名前25%/メール50%
  - 更新は年月日のみ
- BE（モック一致）
  - GET `/api/db/permissions/users?platformId&storeId` → `rows[{id,name,email,status,role,updatedAt}]`（updatedAt常時ISO）
  - POST `/api/permissions/assign` { userId, subject:'store', subjectId, role }
  - DELETE `/api/permissions/assign` { userId, subject:'store', subjectId }
  - POST `/api/permissions/invite` { emails[], initialRole, scope:{ type:'store', id } }

## 4) 接続（/settings/connections）
- 実装
  - サービス: SP / 広告 / SP&広告 / DSP / ベンダー
  - 排他: ベンダー⇄SP系、DSP独立
  - Step2: SP/広告は SP&広告 に統合表示
- BE（モック一致）
  - GET `/api/connections/summary`, `/stores`, `/prereq`
  - POST `/api/connections/initiate` { storeId, services:['sp_ads'|'dsp'|'vendor'] }（SP/広告はsp_adsへ正規化&重複除去）
  - POST `/api/connections/authorize` { sessionId }、GET `/api/connections/session-status`
  - POST `/api/connections/reauth|sync|sync-bulk|unlink`

## 5) 実行ログ（/settings/run-logs）
- 実装: Threaded/Flat、行展開、Rowメニュー、モーダルスタブ。Flat初回自動ロード。
- BE（現行契約）
  - GET `/api/db/run-logs/threads`、GET `/api/db/run-logs/threads/:threadId/runs`
  - rerun/error/evidence/fork/handoff は契約未確定（TBD）

## 6) ヘルプ / 問い合わせ
- ヘルプ: `/settings/help` → Notion へサーバリダイレクト（`HELP_CENTER_URL`）
- 問い合わせ: `/settings/contact`（30秒クールダウン、添付<=3, 合計<=10MB）
  - BE: POST `/api/contact`

## 7) ロール定義（/settings/roles）
- 実装: Owner/Manager/General/None の表。保存は見積→保存→トースト。
- BE: GET `/api/roles/resources`、POST `/api/roles/estimate|save`

## 8) 環境変数
- `HELP_CENTER_URL`（ヘルプ先）

## 9) A11y / スタイル
- モーダル: フォーカストラップ/タブ循環/Esc閉
- ボタン高さ: 28px、入力フォーカスリング有
- テーブル: fixed+colgroup、ellipsis

## 10) 既知の非対応/任意改善
- users-access: Allビュー（複数PF/Store混在）は将来拡張
- connections: 複数ストア同時接続・詳細ログ閲覧は非対応
- run-logs: 大規模時のページング/並列制御はBEと調整
- 未使用 `.perm-grid` の整理（任意）
- `filtersKey` 未使用（任意で削除可能）

## 11) 受け入れ最終チェック
- ナビ: アクティブ判定/重複キーなし
- 各ページ主要操作がコンソール or モックで成功
- モックはDEV-ONLY（BE接続で置換可能）

## 12) 未移管 fetch / モック状況（備忘）
以下は現時点で Repository 経由に未移管、もしくは API 未定義のため暫定実装に留めている箇所です。BE契約決定後に repo 化します。

- connections（/settings/connections）
  - 直 fetch のまま: `/api/connections/prereq`, `/api/connections/session-status`, `/api/connections/initiate`, `/api/connections/authorize`, `/api/connections/notify-on-ready`
  - 未実装（UIスタブのみ）: `sync`, `unlink`, `last-error` 表示（簡易ダイアログ）
  - Repo 経由済み: `list()`, `reauthUrl()`（`ConnectionsRepo`）
  - モック: 上記直 fetch 系は未モック（repo 導入時に `*.mock.ts` 追加）

- users-access（/settings/users-access/[platformId]/[storeId]）
  - Repo: `UsersAccessRepo`（`listStores/listUsers/inviteUser/updateRole/disableUser`）を使用
  - API: `/api/db/permissions/users`, `/api/db/permissions/assign`, `/api/db/permissions/invite`, `/api/db/permissions/disable`
  - モック: `UsersAccessRepo` のモックあり

- run-logs（/settings/run-logs）
  - Repo 経由: スレッド一覧 `runLogsRepo.list()`／スレッド別取得 `runLogsRepo.byThread(threadId)`
  - API クライアント: `/api/db/run-logs/threads`, `/api/db/run-logs/threads/:threadId/runs`
  - モック: `RunLogsRepo` のモック有（UI 検証可）

- contact（/settings/contact）
  - 直 fetch のまま: `/api/me`（メール自動補完用）
  - Repo 経由済み: 送信 `ContactRepo.post`
  - モック: 送信はモック有、`/api/me` は repo 化後にモック化

- roles（/settings/roles）
  - 状態: UI 内で見積/保存のロジックはスタブ（ローカル計算/確認モーダル）
  - API: `estimate/save` の正式エンドポイント未決定。現状 `RolesRepo` は `list/create/update/delete` のみ
  - モック: `estimate/save` 未作成（BE契約決定後に `roles` API と repo を拡張）

【次アクション】
1) `connections` の直 fetch 群→ `ConnectionsRepo` 拡張（`initiate/authorize/sessionStatus/notifyOnReady/sync/unlink/lastError`）+ モック追加
2) `users-access` 詳細ページの直 fetch → `UsersAccessRepo` 配線
3) `contact` の `/api/me` → `AccountRepo.getMyProfile()`（API/Repo 追加）
4) `roles` の `estimate/save` エンドポイント設計 → `RolesRepo` 拡張 + モック

## 13) 認証ガード（/settings/*）
- `settings/layout.tsx` に `useAuth()` を導入。未認証時は `/login?next=<path>` へ遷移。
- `/login` は `next` クエリを解釈して成功後に復帰。

## 14) モック運用
- `NEXT_PUBLIC_USE_MOCKS=true` で Repository を `*.mock.ts` に切替。
- SWR は `key=null` でネットワーク抑止（users-access の一覧など）。
- connections/users-access/run-logs/roles/contact/account の主要操作をモックで完了可能。

## 15) ドキュメントの単一ソース
- 本設定ドキュメントは正として本ディレクトリ（`frontend/docs/spec/setting-page-docs/*`）に集約しています。
- 旧来の `Transfer document/sections/setting-*` は参照のみとし、更新は行いません（必要に応じて本ドキュメントへ誘導）。