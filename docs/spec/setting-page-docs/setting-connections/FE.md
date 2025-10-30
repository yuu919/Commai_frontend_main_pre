# 設定 › 接続（/settings/connections）— フロント定義 v0

## 0. 目的
- Amazon（SP＋広告・DSP・ベンダー）との接続を管理する。
- 接続ウィザード、再認証、同期、切断を一元化。

## 1. ルーティング / 画面構成
- ルート: `/settings/connections`
- メイン画面: 接続一覧（テーブル）、要対応サマリ、右上「＋接続する」ボタン
- モーダル: ConnectWizard（Step1→2→3）
- ディープリンク: `?modal=connect&sessionId=...` でウィザード再開

## 2. 接続ウィザード（ConnectWizard）
### Step 1: 対象選択
- サービス選択（1つ以上必須）:
  - SP
  - 広告
  - SP＆広告（まとめて接続）
  - DSP
  - ベンダー
- 排他ルール:
  - ベンダー ⇄ SP系（SP/広告/SP＆広告）は相互排他
  - DSPは独立（ベンダー/SP系と併用可能）
- ストア選択: 当面なし（既定ストアへ接続・UI非表示）
- 注意文: 「SP＋広告は連続で認証します。片方だけ成功しても、残りは後で再認証できます。」
- ボタン: 次へ（活性条件: サービス≥1）/ 閉じる

### Step 2: 権限確認 → Amazon認証
- 要求スコープの要約（選択サービスに応じて表示）。SP/広告を個別に選択した場合でも表示は「SP＆広告」に統合。
- 同意チェック: 「上記の権限に同意し、Amazonで認証します。」（必須）
- ボタン: 認証に進む（同一タブでAmazonへ遷移）/ 戻る

### Step 3: 結果表示（3パターン）
1) **成功**: 「接続を開始しました。初回同期を開始しました（最大24時間）。」
   - オプション: 完了したら通知（トグル）
   - ボタン: 接続一覧に戻る / このストアの接続を表示

2) **部分成功**: 成功/失敗の結果リスト（バッジ付き）
   - 失敗項目に［再認証する］ボタン
   - 「同期は成功側から開始しました（最大24時間）」

3) **失敗**: 失敗理由 + 推奨アクション
   - ボタン: やり直す / あとで行う（閉じる）

## 3. 一覧画面
### KPIフィルタ（上部）
- クリック可能なチップ: 全て/要認証/同期中/失敗/正常（件数表示）
- 選択時はアクセント色でハイライト、テーブルを該当状態で絞り込み

### 接続テーブル
- **行単位**: ストア×サービス（SP＋広告は SP行・広告行に分離）
- **列**: 状態｜ストア｜サービス｜最終同期｜期限｜主アクション｜…
- **警告ハイライト**: 24h超・期限間近・連続失敗≥3 の行を淡いオレンジ背景
- **ステータス優先度**: `failed` > `needs_auth` > `syncing` > `ok` > `disconnected`

### 主アクション（1ボタン）
- `needs_auth`/`failed` → 再認証
- `syncing` → 同期中...（表示のみ）
- `ok` → 手動同期
- `disconnected` → 未接続（表示のみ）

### …メニュー（副次操作）
- エラー詳細（failed時のみ）
- SP&広告同期（SP/広告行のみ）
- 切断（危険アクション）

## 4. データモデル（FE想定）
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
    jobId?: string; // 実行中ジョブ
  }>;
}

export interface ConnectSession {
  sessionId: string;
  storeId: string;
  services: ServiceType[];
  state: 'success' | 'partial' | 'failed';
  details: Array<{
    service: ServiceType;
    status: 'success' | 'failed';
    message?: string;
  }>;
}
```

## 5. ウィザード状態・ガード
- フォーカストラップ / 背景スクロール停止 / Escで閉じない（×ボタンのみ）
- 戻る: Step2→1のみ可能。Step3は戻れない
- 中断復帰: sessionId があればStep再開
- 実行中ジョブがあるサービスは手動同期 disabled
- 送信前処理: サービスは `SP/広告` を `sp_ads` に正規化し、重複は除外して API に送信

## 6. アクセシビリティ
- ボタンに `aria-busy` / `aria-disabled` を適切に付与
- 認証遷移・結果は `aria-live="polite"` で読み上げ
- モーダル: フォーカストラップ + 明示的な閉じる操作のみ

- Step1でサービス≥1でなければ次へ不可
- Step2で同意後、Amazonへ遷移→戻るとStep3が開く
- 成功: 最大24hメッセージ、部分成功: 成功/失敗リスト+再認証導線、失敗: 理由+やり直す
- KPIフィルタでテーブル絞り込み、主アクション（1ボタン）で即座に操作可能
- SP＋広告は SP行・広告行に分離表示、束ね同期は…メニューから
- 再認証/手動同期/切断がテーブルから実行でき、状態が更新される
- sessionId があればフロー再開できる
- 全モーダルでフォーカストラップ・スクロールロック

## 8. v0 でやらない
- ストア新規作成、複数ストア同時接続、詳細ログ閲覧
