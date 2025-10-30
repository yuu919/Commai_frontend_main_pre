# Settings › Run Logs — Frontend Spec (Current)

この文書は `/settings/run-logs` の最終フロント仕様です。Settings配下・左ナビ一体型・右ドロワーは使用しません。UIライブラリは使わず、既存の `settings.css` と同等の簡素UIで実装します。

## 0. 確定事項（短）
- URL同期: `q/from/to/status/type/platformIds/storeIds/userIds/sort/limit/view`
- タイムゾーン/日付: 表示・計算とも JST。`from/to` は日単位の閉区間（00:00〜23:59:59）
- 並び替え: 既定 `updatedAt desc` のみ（v0。他列ソート不要）
- Evidence合計: 件数のみ。0件の種類は非表示（存在する種類だけ並べる）
- 親行メニューの可視性/アーカイブ: UI先行で可（API未実装時は“未実装”トースト）
- リネーミング: UI上は「フォーク」→「別スレッドとしてコピー…」
- ReRun/コピー/Handoff後: `/app/chat?threadId=...` へ遷移
- Flatビュー: 既定 threaded、`?view=flat` で切替。Flatでは Scope 列は常時表示＋「スレッド」列を表示
- ページング: 親=cursor+limit、子=cursor+limit。limit既定 50
- ACL: 可視スレッドのみ表示（権限なし非表示）
- ローカリゼーション: ステータスは日本語表記（完了/実行中/一時停止/失敗/キャンセル）
- タイプ表示/フィルタ: Ask/Agent のみ（データも Ask/Agent のみ返却）

## 1. 目的 / 原則
- 目的: 「いつ・誰が・何を実行し、どう応答されたか」を素早く探し、チャット復帰・再実行・フォーク/引き継ぎへ繋げる。
- 既定表示: スレッド単位（親行）。クリック展開で Run（子行）を遅延ロード。
- 設計: Single-Owner Threads（1スレッド=1オーナー）。共有は閲覧専用（RO）。
- エビデンスは一覧（ポインタ）のみ。プレビューはしない。

## 2. ルーティング / 権限
- URL: `/settings/run-logs`
- 可視: 自分が閲覧権を持つスレッドのみ（ACL準拠）
- ビュー: `?view=threaded|flat`（既定=threaded）
- Shallow routingでFilter Barの状態をURL同期（復元可）

## 3. 画面構成
- Header: タイトル「実行ログ」
- FilterBar: 折りたたみ可。URL同期。
- LogView:
  - ThreadTable（親行）
  - RunRows（親行展開時に遅延ロード）
- ToastArea（共通）

## 4. FilterBar（要素 / URLキー）
- 検索 `q`: スレッドタイトルのみ（プレースホルダー「スレッド名で検索」）
- 期間 `from`/`to`: ISO8601（日付のみ可）。プリセット Today/7d/30d/Custom。JST・閉区間。
- ステータス `status[]`: `completed|running|paused|failed|canceled`（表示・適用は flat ビューのみ）
- タイプ `type[]`: `Ask|Agent`（表示・適用は flat ビューのみ）
- プラットフォーム `platformIds[]`（複数）
- ストア `storeIds[]`（typeahead複数）
- ユーザー（オーナー） `userIds[]`
- 並び `sort`: `updatedAt desc`（v0固定）
- 件数 `limit`: 50/100/200（既定 50）
- 適用/クリア、適用中バッジ（×で解除）

## 5. ThreadTable（親行）
### 列（v0 最終）
1) スレッド（左に ▶︎/▼ 展開トグル。副情報として Evidence 合計を小さく表示）
2) オーナー
3) 更新 `updatedAt`
4) スコープ（`Platform · Store`。Platformは複数PFがある時だけ表示）
5) …（行メニュー）

### 親行メニュー
- スレッドで開く（チャットへ遷移）
- 引き継ぎ…（相手ユーザーへ所有権ごと移す＝相手名義の新スレッド）
- 別スレッドとしてコピー…（自分/第三者名義で分岐）
- 可視性を変更（Private/Team-RO/Link-RO）※API未実装時は“未実装”トースト
- アーカイブ ※API未実装時は“未実装”トースト

### 展開
- クリック/トグルで展開。展開時に `GET /api/db/run-logs/threads/:threadId/runs` を叩いて子行を挿入。
- 複数展開を許可。

## 6. RunRows（子行）
### 列（v0）
- ステータス（色バッジ。日本語表記）
- タイムスタンプ（開始）
- 指示・質問（先頭を短縮表示、ホバーで全文）
- 回答（先頭を短縮表示）
- タイプ（Ask/Agent）
- Evidence合計

備考: v0では子行のアクション列（…）はありません。操作は親行メニューのみです。

Flatビュー（`?view=flat`）では単一テーブルでRunを表示。Scope列＋スレッド列を表示し、Threadの文脈を補う。

## 7. モーダル（最小）
- ReRunModal(runId): POST成功→当該Threadの先頭に newRun を挿入。完了後チャットへ遷移
- ErrorDetailModal(runId): エラー情報表示
- EvidenceListModal(targetId): 種類・タイトル・取得時刻・URLの一覧
- 別スレッドとしてコピー（ForkModal）(runId|threadId): mode, visibility, members[]。完了後チャットへ遷移。説明文：
  - 元スレッドは変更されない／比較検討用に安全に分岐／所有者は作成者。
- HandoffModal(threadId): toUserId, visibility。完了後チャットへ遷移

## 8. 型（FE想定）
（省略。BE.md参照）

## 9. API（フロントからの期待）
（BE.md参照。上記URL同期キーでクエリを構成）

## 10. A11y/UX
- 親子行はツリーグリッド（`role="treegrid"`, `aria-expanded`）。
- モーダル：フォーカストラップ＆Esc閉＆背景スクロールロック。
- 親100件＋展開即時（<1s）を目標。Runは遅延フェッチ＋インクリメンタル描画。

## 11. DoD
- 既定 `view=threaded`、親行のみ→クリック展開でRun取得。
- 検索はスレッド名にヒットしたスレッドのみが表示される。
- 行メニューで「チャット復帰 / 再実行 / 別スレッドとしてコピー / Handoff / エラー / Evidence一覧」。
- `?view=flat` でRunフラット一覧に切替（Scope＋スレッド列あり）。
- 50〜200件で滑らか（ページング or 簡易仮想化）。
