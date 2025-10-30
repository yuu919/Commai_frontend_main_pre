## エラーマトリクス v2（UI/再試行/正規化）

- 正規化: `lib/error.ts` に `normalizeHttpError`/`MESSAGES` を集約。
- 表示: 軽微は Toast、致命は Banner。503 は指数バックオフで自動再試行可。
- SSE/Upload: 再接続/再試行ポリシーを明記し、Telemetry を送信。

補足（本リポジトリ決定事項）:
- `normalizeHttpError` は `lib/transport/fetcher.ts` から `lib/error.ts` へ移動（API/型は据え置き）。
- 503 再試行既定: 初回 2s、係数 1.5、最大 5 回（変更時は `constants`）。


