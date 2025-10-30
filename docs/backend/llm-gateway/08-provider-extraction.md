## Provider 抽象化 / 抽出（統合）

- 利用者は `llm_chat_service` のみを参照し、Provider 実装差は `app/clients/llm_gateway/*` に閉じ込める。
- Provider 追加/差替は `providers/<name>/client.py` を追加し、`core/registry.py` のフォールバック読み込み対象に含める。
- エントリポイント登録は任意（外部配布時）。本リポではベンダー配置を前提とし、registry のフォールバックで解決する。


