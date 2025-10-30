## Provider とモデル（統合要点）

### OpenAI
- 既定は Responses API を優先。Responses 未対応のパラメータは送信しない。
- `models.json` に基づき `ChatGPT-4o -> gpt-4o`, `4o-mini -> o4-mini` を正規化。

### Anthropic
- `messages` は `{role, content:[{type:'text', text}]}` 形式で送信。
- `tools` がある場合のみ `tool_choice` を `{type:'auto|any|none'}` で付与。
- モデル可用性差は `canonical_model` で解決（例: `claude-sonnet-4 -> claude-sonnet-4-5`）。

### Gemini
- generate_content を使用。Safety block は 400 へ正規化。
- Tool 呼び出しは function 呼応の往復（必要時のみ）。

### 共通
- `max_tokens_param` と上限は `models.json` に従い、送信前に調整。
- Provider変化は基本的に `models.json` とクライアント層の実装で吸収する。


