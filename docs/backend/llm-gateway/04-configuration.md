## 設定（統合版）

### 環境変数（.env）
- 置き場所: `backend/.env`（開発）／本番は Secret で注入
- 代表例:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
  - `LLM_DEFAULT_PROVIDER`（例: `openai`）
  - `ENVIRONMENT`（例: `development`）

### モデル設定（公開・非機微）
- 置き場所: `backend/app/clients/config/models.json`
- 役割:
  - `api`: Provider の API 種別（`responses|messages|generate_content`）
  - `max_tokens_param`/`max_tokens`: 上限の差異
  - `canonical_model`: 別名の正規化（例: `ChatGPT-4o -> gpt-4o`, `claude-sonnet-4 -> claude-sonnet-4-5`）

### 運用
- `models.json` はリポ内で管理しつつ、本番では外部マウント/ストレージから読み込む選択も可能。
- 変更時はサーバ再起動で反映。


