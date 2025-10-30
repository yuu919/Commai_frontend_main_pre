## Function Calling（統合最小）

- 入力の `tools[]` は JSON Schema（object）で定義。name/parameters 必須。
- `tool_choice`
  - `auto`: Providerに選択委任
  - `none`: ツール無効
  - `required`: ツール必須（toolsが空なら 400）

### Provider 送信ルール
- OpenAI: Responses/Chat いずれも `tools` を送信。Responses では `tools/tool_choice` をAPI仕様に合わせて整形。
- Anthropic: `tools` がある場合のみ `tool_choice:{type:'auto|any|none'}` を送信。
- Gemini: generate_content のツール仕様に合わせて送受信。

### 出力統一
- `tool_calls: [{id?, name, arguments}]` に正規化（Provider依存の ID/構造は吸収）。


