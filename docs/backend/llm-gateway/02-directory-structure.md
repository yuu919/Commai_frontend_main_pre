## ディレクトリ構成（統合版）

```
backend/
  app/
    main.py                  # FastAPI エントリ
    api/
      v1/
        routes/
          chat.py            # POST /api/v1/chat
    services/
      llm_chat_service.py    # ユースケース層
    clients/
      config/
        models.json          # モデル設定（api/上限/canonical）
      llm_bridge/
        core/                # types/schemas/errors/config/registry
        providers/           # openai/anthropic/gemini の実装
        services/
          chat_service.py    # 下位サービス（維持）
        api/                 # （任意）内部用ルータ（外部公開はしない）
```

- temp 時代のルート直下 `llm-bridge/` は廃止。ベンダー配置は `backend/app/clients/llm_bridge/` に統合。
- examples / sample はリポ外の検証リソースへ移行し、本番ビルドには含めない。


