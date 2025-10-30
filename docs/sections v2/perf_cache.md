## パフォーマンス/キャッシュ v2（SWR/キー設計）

### SWR 再検証
- グローバル: `revalidateOnFocus: true`, `dedupingInterval: 1000`。
- 目安 TTL: メッセージ=1s、スレッド=5s、プロジェクト=10s。
- 書き込み後: 該当キーに `mutate()` を即時実行。

補足（本リポジトリ決定事項）:
- `mutate()` は Repository の書き込み関数内で呼び出す（呼び出し側での重複呼び出しを避ける）。

### キー設計
- 一覧: `['threads', { offset, limit, q, sort }]` 等。
- 詳細: `['messages', threadId]` 等。
- パラメータの順序/命名を固定化し、差分に強いキーを維持。

### リスト I/F 標準
- 共通: `offset/limit/q/sort`。
- Repository と API クエリを統一（サーバ I/F と整合）。


