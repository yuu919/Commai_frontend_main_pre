## アーキテクチャ（統合版・最小）

- 目的: LLM 各社 API（OpenAI/Anthropic/Gemini）を単一の HTTP エンドポイントで提供し、UI/他サービスからの呼び出しを統一する。
- 構成:
  - FastAPI (`backend/app/main.py`)
  - ルータ: `backend/app/api/v1/routes/chat.py` — POST `/api/v1/chat`
  - サービス層: `backend/app/services/llm_chat_service.py`（ユースケース統合）
  - クライアント層: `backend/app/clients/llm_gateway/*`（Provider実装／正規化）
  - 公開設定: `backend/app/clients/config/models.json`（モデル別のAPI種別・上限・canonical）

### 責務分離
- Router: 入出力のスキーマ検証と HTTP 変換のみ。
- Service: モデル正規化（canonical）、既定値適用、Provider選択、ユースケース制御。
- Clients: Provider SDK 呼び出し、差分正規化（Responses/Chat、tool_use、Safety 等）。

### リクエスト・レスポンス（要旨）
- ChatRequest: `{ provider?, model, messages[], tools?, tool_choice?, temperature?, top_p?, max_tokens?, response_format? }`
- ChatResponse: `{ provider, model, content?, tool_calls?, finish_reason? }`

### モデル正規化
- `models.json` の `canonical_model` により別名を正規化（例: `ChatGPT-4o -> gpt-4o`, `4o-mini -> o4-mini`, `claude-sonnet-4 -> claude-sonnet-4-5`）。
- `api`/`max_tokens_param`/`max_tokens` を参照し、Provider 送信時のパラメータ差を吸収。

### エラー方針（概要）
- 共通ボディ: `code/message/provider?/detail?`
- HTTP: 400/401/429/502/500 を用途別に使い分け（詳細は 07-error-handling.md）。

### 運用上の前提
- 開発: `backend/.env`（キー類）と `backend/app/clients/config/models.json`（公開設定）で起動。
- 本番: 環境変数注入（Secret Manager 等）＋ `models.json` の外部化も可。


