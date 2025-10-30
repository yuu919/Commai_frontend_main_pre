## モック運用 v2（切替/デモ/CI）

- 切替: `.env.local` の `NEXT_PUBLIC_USE_MOCKS=true`。
- Demo メッセージ: `NEXT_PUBLIC_DEMO_MARKDOWN=true`（CI では禁止）。
- 実装: `app/providers.tsx` で Repository を注入切替。UI/ロジックに `if (mock)` を持ち込まない。

補足（本リポジトリ決定事項）:
- CI では `NEXT_PUBLIC_USE_MOCKS=false`, `NEXT_PUBLIC_DEMO_MARKDOWN=false` を固定。


