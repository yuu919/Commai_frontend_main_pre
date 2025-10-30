## API 仕様（統合）

### POST /api/v1/chat
- 入力: ChatRequest（要旨）
```json
{
  "provider": "openai|anthropic|gemini"?,
  "model": "string",
  "messages": [{"role":"system|user|assistant|tool","content":"string"}],
  "tools": [{"name":"string","description":"string?","parameters":{}}]?,
  "tool_choice": "auto|none|required"?,
  "temperature": number?,
  "top_p": number?,
  "max_tokens": number?,
  "response_format": "text|json"?
}
```
- 出力: ChatResponse（要旨）
```json
{
  "provider": "openai|anthropic|gemini",
  "model": "string",
  "content": "string?",
  "tool_calls": [{"id":"string?","name":"string","arguments":{}}]?,
  "finish_reason": "string?"
}
```

### エラー
- 本文: `{ code, message, provider?, detail? }`
- ステータス: 400/401/429/502/500（07-error-handling.md参照）

### 備考
- モデルの別名は `models.json` の `canonical_model` で正規化される。
- Provider毎のAPI差異（Responses/Chat 等）はサーバ側で吸収するため、クライアントは統一形で送る。


