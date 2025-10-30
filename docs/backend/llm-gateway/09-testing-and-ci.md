## テスト / CI（統合）

### ローカル検証
- サーバ起動後、主要モデルで以下を実行
  - OpenAI: gpt-4o, ChatGPT-4o, gpt-4.1, gpt-4.1o, 4o-mini（chat/tool）
  - Gemini: gemini-2.5-pro（chat/tool）
  - Anthropic: claude-sonnet-4-5（chat/tool）
- 期待: いずれも HTTP 200、`content` または `tool_calls` が返る

### CI の最小チェック
- `models.json` の JSON 構文検証
- Provider キーは CI では使用しない（結合テストはステージング専用）
- Lint/型検査/ユニット（事前検証ロジック・正規化ユーティリティ）


