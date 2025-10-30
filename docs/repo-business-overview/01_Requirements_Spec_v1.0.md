EC Analysis Agent Requirements Specification (v1.0)

EC分析エージェント 要件定義書（最終版 v1.0）

作成日：2025-09-20（JST）
対象：チャットUIひとつでECデータ分析を実行できるAIエージェント（Slack風ワークスペースの招待制・将来マルチテナント前提)

⸻

更新注記（2025-09-20 追記）
本文はあなたの原稿を一字も省略せず収録しています。
ただし以下の項目は、本プロジェクトの合意済み技術判断に合わせ追記/更新しています（元の記述は保持）。
	•	i18n：next-intl → i18next + JSON辞書 + Intl（将来のフレームワーク変更に強くするため）
	•	OpenAI SDK：公式 openai を採用（BFF経由・SSEストリーム）
	•	Docker：本番用マルチステージDockerfileと.devcontainerを同梱（ベンダーロックイン回避）
	•	URL規約：/app?thread=:tid&tab=:Inspector|Executor|Tracker|Previewer|Knowledge&panel=:drawer|wide|split を正
	•	FE依存：サーバロジックはBFF/BEに集約（Next Server Actions等への過依存を避ける）

⸻

1. 目的
	•	EC事業者/コンサルが自然言語で分析依頼→再現可能なジョブに変換→表/チャート/要約で返す。
	•	M&A視点で移植性・監査性・標準性を重視（買い手にとって読み替えやすい構成）。

2. スコープ / 非スコープ
	•	スコープ：チャット、分析実行、KPI集計、比較、エクスポート、ワークスペース管理、監査・計測。
	•	非スコープ：決済・個人住所など高感度PIIの常時保有、在庫発注オートメーション等の業務オペ代替。

3. 利害関係者/ロール（RBAC）
	•	Owner(tenant)：課金/監査/全WS管理
	•	Admin(workspace)：メンバー・接続管理
	•	Analyst：分析実行・エクスポート
	•	Viewer：閲覧のみ

4. 成功指標（例）
	•	1回の質問から可視化まで p75 < 6s（SSE開始は<1.5s）
	•	初回オンボードから「最初の洞察」まで <15分
	•	再現可能分析（Intent保存→再実行）> 95% 成功

5. アーキテクチャ概要
	•	FE：Next.js(App Router) + React 18 + TypeScript(strict)
	•	Phase 0：Client中心（Next Lite）、SSR/RSCなしで開始
	•	Phase 1：LP/Docsは SSG/ISR、ダッシュボードの初期ペインのみ限定SSR/RSC
	•	BFF：薄い集約/認証中継（Route Handlers or 独立Node）。業務ロジックは置かない
	•	BE(API)：OpenAPI/GraphQL/tRPCいずれかで契約公開。分析・権限・監査の本体
	•	データ：各EC/広告API→正規化データセット（orders/ads/products…）
	•	イベント：SSE/WebSocketでチャット出力を段階配信

更新追記：
	•	OpenAI LLM利用：公式 OpenAI SDK (openai) をBFFで使用し、SSEでFEにストリーム。
	•	URL規約：/app?thread=:tid&tab=:Inspector|Executor|Tracker|Previewer|Knowledge&panel=:drawer|wide|split をUIの単一情報源とする。

6. 技術方針（FE）
	•	言語：TypeScript（strict: true + noUncheckedIndexedAccess 等）
	•	UI：Tailwind + shadcn/ui(Radix)、データグリッドは TanStack Table + Virtualizer
	•	状態：サーバデータ＝TanStack Query、UI局所＝Zustand
	•	フォーム：react-hook-form + zod
	•	i18n：next-intl（ja/ en） → i18next + JSON辞書 + Intl（ja/en）（更新）
	•	A11y：WCAG 2.2 AA、aria-liveでストリーム読み上げ
	•	可観測性：Sentry(エラー/Replay) + PostHog(イベント)、Event Dictionaryでスキーマ管理

更新追記：
	•	OpenAI SDK：フロントからはBFF経由。キーはFEに出さない。
	•	Docker：Nextのstandalone出力を使うマルチステージDockerfileを同梱（本番移送・M&A向け）。
	•	URL復元：スレッド/タブ/パネルは常にURLに反映し、共有・再現を保証。

7. 技術方針（BE/BFF）
	•	認証：OIDC（Auth0等）+ httpOnly Cookie/Authorization Bearer
	•	権限：RBAC（動詞×リソース、例：analysis:run）
	•	契約：OpenAPIを単一情報源、@org/contracts パッケージで型配布
	•	非同期：Jobsキュー（集計/エクスポート）
	•	監査：actor_id, action, resource, before/after, ts, ip, ua

更新追記：
	•	SSEプロキシ：BFFがLLMのトークンストリームをSSEで中継（再接続/バックオフ実装）。
	•	Idempotency-Key を更新系APIで必須化。
	•	x-audit-correlation-id を全APIで付与。

8. マルチテナント / ワークスペース
	•	リソース：tenant_id、workspace_id、member_id（ULID推奨）
	•	招待：POST /workspaces/{id}/invitations → トークン受諾
	•	すべてのAPIは {tenant_id, workspace_id} をコンテキストに評価

9. Intent契約（抽象・汎用）
	•	自然言語は候補。実行はIntent JSONに正規化してから。
	•	スキーマ（要点）：
	•	type: “metric.query” | “metric.compare” | “entity.search” | “explain.kpi” | “export.create”
	•	timeframe: from/to（絶対日付）, granularity, original_phrase(保存のみ)
	•	metrics: [sales,ad_cost,acos…]（Dictionaryでバリデート）
	•	dimensions, filters（field/op/value）
	•	subject（store_ids, asin_list, campaign_ids など）
	•	output（format|limit|sort）
	•	idempotency_key
	•	失敗時：UNPROCESSABLE_ANALYSIS を標準エラーで返す

10. API（代表）
	•	POST /chat/sessions：作成（workspace_id, locale）
	•	POST /chat/sessions/{id}/messages：ユーザ発話→Run発行（Idempotency-Key必須）
	•	GET /chat/runs/{run_id}/events：SSE（delta|tool_call|tool_result|final_answer|error）
	•	GET /dictionary/kpis / /dictionary/synonyms：定義とシノニム
	•	POST /tools/{name}:run|enqueue：同期/非同期ツール呼び出し
	•	POST /exports → Job、完了で download_url
	•	共通：ページング、ソート、X-Trace-Id、レート制限ヘッダ

11. エラー設計（共通形式）

{
  "error": {
    "code": "RESOURCE_NOT_FOUND|VALIDATION_ERROR|UNAUTHORIZED|UNPROCESSABLE_ANALYSIS|RATE_LIMITED|DEPENDENCY_TIMEOUT",
    "message": "…",
    "details": {},
    "retriable": false,
    "trace_id": "…"
  }
}

更新追記：FEは RFC7807 と互換のUIで統一ハンドリング（title/detail/status 変換ロジックを備える）。

12. データ辞書（例）
	•	KPI例：sales(JPY), orders, ad_cost(JPY), acos(%)=ad_cost/attributed_sales_7d*100, roas(x)
	•	次元：date|store_id|asin|campaign_id|channel
	•	シノニム：売上→sales, 広告費→ad_cost, ACOS→acos, ROAS→roas …

13. 非機能要件
	•	性能：初回可視化 p75 < 6s、SSE開始 < 1.5s、表の仮想化必須
	•	可用性：API 99.9%/月、SSE切断時は自動再接続
	•	セキュリティ：CSP/CSRF/XSS対策、SBOM出力、依存監査、秘密はBEのみ
	•	A11y：キーボード操作全経路、コントラスト、読み上げ
	•	i18n/TZ：保存UTC・表示JST、ja/en

14. 分業ルール（FE/BE）

項目	FE	BE/BFF
業務ロジック	❌	✅
取得/キャッシュ	TanStack Query	API集約・権限・整形
入力検証	zod（UI）	スキーマ検証/ビジネスルール
認可判定	表示のみ	本判定＋監査
SSE描画	✅	イベント生成

15. テスト/品質
	•	契約テスト：Pact（破壊的変更をCIで検知）
	•	E2E：Playwright（キーボード操作/A11y含む）
	•	Unit/UI：Vitest + RTL
	•	Storybook：a11y/ビジュアル回帰（Chromatic等）

16. デプロイ/運用
	•	どのクラウドでも動くNode互換を基本（Vercel最適化はオプション）
	•	IaCで環境差分を管理、dev/stg/prod 明確化
	•	ログ/APM：OpenTelemetry、Sentry sourcemap配信

更新追記：
	•	Docker：本番用マルチステージDockerfile + .devcontainer を提供（M&A/他クラウド移送想定）。

17. M&A対策パッケージ
	•	アーキ図・README（1時間でローカル起動手順）
	•	OpenAPI（/openapi.json）・@org/contracts型配布
	•	監査ログ設計、SBOM、依存ライセンス一覧
	•	データ所在/バックアップ方針、権限マトリクス

18. リスクと対策
	•	Next依存過多 → Phase 0はClient中心、Server ActionsはBFF用途限定
	•	テーブル重い → サーバ集計＋仮想化
	•	ライブラリ増殖 → モノレポで@app/schemas|@app/sdk|@app/uiに集約

19. 開発フェーズ
	•	Phase 0（2–4週）：Next Lite + Intent最小 + kpi_summary + SSE配信
	•	Phase 1：比較/トレンド/エクスポート、LPをSSG/ISR化、RSCを“点”で導入
	•	Phase 2：辞書拡充、ジョブ可視化、外部Webhooks、ワークスペース招待UI

20. 付録（抜粋）

20.1 Intent JSON Schema（要点）

{ "type":"object","required":["type","workspace_id","locale","timeframe","metrics"],
  "properties":{
    "type":{"type":"string","enum":["metric.query","metric.compare","entity.search","explain.kpi","export.create"]},
    "tenant_id":{"type":"string"},"workspace_id":{"type":"string"},"locale":{"type":"string"},
    "subject":{"type":"object","properties":{"store_ids":{"type":"array","items":{"type":"string"}},"asin_list":{"type":"array","items":{"type":"string"}},"campaign_ids":{"type":"array","items":{"type":"string"}}},"additionalProperties":false},
    "metrics":{"type":"array","items":{"type":"string"},"minItems":1},
    "dimensions":{"type":"array","items":{"type":"string"}},
    "timeframe":{"type":"object","required":["from","to","granularity"],
      "properties":{"from":{"type":"string","format":"date"},"to":{"type":"string","format":"date"},"granularity":{"type":"string","enum":["day","week","month"]},"timezone":{"type":"string","default":"UTC"},"original_phrase":{"type":"string"}}},
    "filters":{"type":"array","items":{"type":"object","required":["field","op","value"],
      "properties":{"field":{"type":"string"},"op":{"type":"string","enum":["eq","neq","in","gte","lte","between","contains"]},"value":{}},"additionalProperties":false}},
    "compare_to":{"type":"object","properties":{"mode":{"type":"string","enum":["previous_period","previous_year","custom"]},"custom":{"type":"object","properties":{"from":{"type":"string","format":"date"},"to":{"type":"string","format":"date"}}}}},
    "output":{"type":"object","properties":{"format":{"type":"string","enum":["table","series","markdown","chart"]},"limit":{"type":"integer","default":50},"sort":{"type":"string"}}},
    "idempotency_key":{"type":"string"}
}}

20.2 OpenAPI（代表パス）

paths:
  /chat/sessions:
    post: { summary: Create chat session, responses: { '201': { description: Created } } }
  /chat/sessions/{id}/messages:
    post: { summary: Post user message (creates Run), responses: { '202': { description: Accepted } } }
  /chat/runs/{run_id}/events:
    get: { summary: Stream events via SSE, responses: { '200': { description: OK } } }
  /dictionary/kpis:
    get: { summary: List KPI definitions }
  /tools/{name}:run:
    post: { summary: Run tool synchronously }
  /exports:
    post: { summary: Create export job }


⸻

最後に（判断のガイド）
	•	現方針でGO。Phase 0はNext Lite（Client中心）で速く着手し、M&Aに響く部分（契約・監査・分離）を先に固める。
	•	RSC/SSRは必要箇所に限定して段階導入。
	•	“ぶれない”鍵は Intent契約＋辞書＋OpenAPI を単一の正として運用することです。

⸻


