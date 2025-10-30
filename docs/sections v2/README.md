## sections v2 ドキュメント群

本ディレクトリは、frontend の最終ディレクトリ構造・設計原則・運用規約の最新版（v2）です。v1 と矛盾しない共通部分は引き継ぎつつ、層構造・依存規律・API 契約の単一化をより厳密に定義します。

### 目次
- overview.md（全体像/前提/最終構造/対応マッピング）
- architecture_principles.md（層構造/依存規律/契約の単一点）
- ui-components-policy.md（UI 原子/トークン/禁止事項/CI ガード）
- implementation_gap.md（現状→最終のギャップと実装ガイド）
- migration_plan.md（移行手順/チェックリスト/DoD）
- data_comm_auth.md（データ/通信/認証/Server Actions 境界）
- perf_cache.md（SWR/キャッシュ/キー設計）
- errors.md（エラーマトリクス/標準文言/再試行）
- mock_mode.md（モック運用/切替/CI）
- share_route_spec.md（共有閲覧ルート仕様）
- styling_tokens.md（トークンとCSS移行ポリシー）
- risks_env.md（環境/リスク/ロールバック）
- documentation_rules.md（ドキュメント維持運用）
- qa.md（よくある質問と回答）

v1 の同名ファイルが存在する場合、本 v2 を正とし、v1 は段階的に廃止します。

補足（本リポジトリ決定事項）:
- 段階 PR での導入（UI → tokens/Stylelint → Repository → SSE → docs v1 廃止）。
- 詳細な移行粒度・禁止ルール・DoD は `migration_plan.md` の「決定事項」を参照。


