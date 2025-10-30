## エラーハンドリング（統合最小仕様）

### 共通ボディ / ステータス
- ボディ: `{ code, message, provider?, detail? }`
- ステータス: 400 / 401 / 429 / 502 / 500

### マッピング（要点）
- OpenAI: Auth→401, Rate→429, BadRequest→400, APIError/他→502
- Anthropic: Auth→401, Rate→429, BadRequest→400, APIError/他→502
- Gemini: Safety/入力不適切→400, Quota/Rate→429, Key/権限→401, 他→502

### 事前検証（サーバ）
- `messages.length <= 256`／`tool schema <= 64KB`／`tool_choice=required`時は `tools` 必須
- 数値域（temperature/top_p/max_tokens）
- モデル別差異の正規化（`models.json` の `canonical_model`／`max_tokens_param`）

### 送信抑止（API差異を吸収）
- OpenAI Responses: 未対応パラメータは送らない
- Anthropic: `messages=[{role, content:[{type:'text',text}]}]`、`tools` がある時のみ `tool_choice` を辞書で付与

### ログ最小
- 構造化: `ts, level, request_id, provider, model, http_status, code, message, detail, latency_ms`
- PII は収集しない（devのみ opt-in）、キーは記録しない

### 代表ケース（期待HTTP）
- 400: スキーマ/数値域違反、モデル未開放、事前検証NG
- 401: APIキー未設定/無効
- 429: レート/クォータ超過
- 502: Provider5xx/SDK内部
- 500: サーバ起因（想定外）

