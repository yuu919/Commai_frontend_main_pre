# LLM Bridge — 統合バックエンド向けドキュメント

本ディレクトリは、`backend/` に統合された LLM ブリッジの運用に必要な最小ドキュメントを提供します。

- 01-architecture.md … 統合アーキテクチャ（Router/Service/Clients/Config）
- 02-directory-structure.md … 最終ディレクトリ構成（temp の直下配置は廃止）
- 03-api-spec.md … POST `/api/v1/chat` のI/F（共通スキーマ）
- 04-configuration.md … `.env` / `models.json` の配置と運用
- 05-providers-and-models.md … Provider 特性とモデル正規化
- 06-function-calling.md … ツールコール最小契約
- 07-error-handling.md … 共通エラーモデル/マッピング/事前検証
- 08-provider-extraction.md … Provider 抽象化と追加手順（ベンダー配置）
- 09-testing-and-ci.md … ローカル検証と最小CI
- 10-operations-and-security.md … 運用・セキュリティの要点

temp 時代の記述は排除し、統合後に必要な内容のみを残しています。


