# 設定 › ロール定義（/settings/roles）— フロント定義 v0（簡潔版）

## 0. 目的
- Owner / Manager / General の3ロールに対し、各リソースの「必要最小ロール（＝以上）」を設定する。
- 例: FBAレポート = Manager 以上、のような“しきい値”を単一選択で管理。

## 1. ルーティング / 画面構成
- ルート: `/settings/roles`
- ヘッダー: タイトル / 右上〔保存〕
- ツールバー: 検索（名称/説明/カテゴリ/別名）・〔変更のみ表示〕
- テーブル（仮想スクロール）
  - 列: リソース名｜説明（i ツールチップ）｜General｜Manager｜Owner（単一選択ラジオ = しきい値）
  - カテゴリ見出しで折りたたみ可（全閉/全開トグル任意）
- フッター（追従）: 変更件数 / 影響件数（保存前プレビュー時）/ 保存ボタン

## 2. データモデル（FE想定）
```ts
export type Role = 'general'|'manager'|'owner';
export type CategoryId = string;

export interface ResourceDef {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];            // 別名検索用
  categoryId: CategoryId;
  categoryLabel: string;         // 表示用
  threshold: Role;               // サーバ保存値（ベースライン）
  draft: Role;                   // 編集中値（初期=threshold）
}

export interface EstimateResult {
  changedCount: number;          // 変更件数
  affectedUsers: number;         // 影響ユーザー件数（例）
  warnings?: { code: string; message: string }[]; // 危険な緩和変更など
}
```

## 3. 状態・ガード
- 状態: `Clean`（差分0）/ `Dirty`（差分>0）/ `Saving` / `SaveError`
- 保存ボタン: Dirty の時のみ活性。Saving はローディング。
- 離脱ガード: Dirty なら beforeunload 警告
  - App Router 遷移時＆ブラウザ離脱（beforeunload）

## 4. 振る舞い（編集）
- ラジオはセルごとに `role="radiogroup"`。選択＝しきい値。
- “以上”の視覚: 選択列＋右側列をハイライト（General→3列、Manager→Manager/Owner、Owner→Owner）。
- キーボード: `/` 検索、←/→ セル移動、Space/Enter 選択。

## 5. 検索/フィルタ
- テキスト: 名称/説明/カテゴリ/別名に部分一致、即時反映（client-side）
- 変更のみ表示: `threshold !== draft` の行のみ

## 6. 保存フロー
1) 保存ボタン
2) 影響見積りAPIの結果（件数/警告）をモーダル表示（危険な緩和は黄色）
3) OK → 保存API、Cancel → 編集へ
4) 成功: トースト「更新しました（変更 n 件）」→ サーバ値へ同期 → `Clean`。失敗: 上部アラート（差分保持）

## 7. アクセシビリティ
- ラジオ群: `role="radiogroup"`、選択セルに `aria-checked`、列ヘッダーと関連付け
- 成功/失敗は `aria-live="polite"`
- モーダル: フォーカストラップ + Esc 閉じ

## 8. DoD
- 1セルでも変更→保存活性・フッターに変更件数
- ブラウザ離脱で警告（beforeunload）
- 保存成功でトースト→差分クリア、即ページ遷移可
- 危険な緩和変更時に影響件数/警告を表示して確認
- 検索/変更のみ表示が即時反映
- “以上”ハイライトで許可範囲が一目で分かる

## 9. v0 でやらない
- カスタムロール作成/削除、依存関係の自動解決UI、ユーザー/ストア例外ルール
