ECAI_Agent_Amazon_FullScope_Developer_Guide_v1.0

ECAI Agent — Amazonフルスコープ 開発者向け説明書（単一版 v1.0）

方針：Amazon の 提供API・周辺プロダクトを可能な限り網羅し、入出力の機能妥協なしで実装する。
原則：「AIが段取り（LLM計画）× 関数が計算（厳密I/O）× ガードで安全（ポリシー・承認）× 全文監査（再現可能ログ）。

⸻

0) TL;DR
	•	ユーザーは自然言語で依頼（例：「過剰消化を抑えてACOS 25%に」）。
	•	システムは
	1.	データ集約（売上/在庫/価格/競合/広告/ブランド/通知/レポート）→
	2.	**武器関数（Tier-1）＋マクロ（Tier-2）**で計算→
	3.	提案カードとしてDiff提示→承認→実行（Ads/価格/Feeds 等の書き戻し）→
	4.	説明ログに根拠・式・API呼出・レスポンス要約を保存（再現・監査OK）。

1) 目的（Why）
	•	EC運用（広告/価格/在庫/カタログ/補充/検索語/クリエイティブ）を粗利最大化基準で半〜全自動化。
	•	すべての判断と変更に説明責任（データ範囲・式・制約・政策準拠）と再現性を付与。

2) スコープ（Amazonフルカバレッジ）
	•	Selling Partner API（3P/Vendor対応領域含む）
Catalog / Listings Items / Product Type Definitions / Feeds / Pricing & Competitive Pricing / Orders / Buyer Messaging / Solicitations / Reports（全タイプ辞書管理） / Notifications（購読） / Inventory / FBA（Inbound/Outbound/Restock/FC在庫/MCF） / Finances/Fees/Settlements / A+ Content / Brand Registry 関連 / Shipping / Deals/Promotions … 利用可能なものは原則すべて統合。
	•	Amazon Ads API（SP/SB/SD）：ポートフォリオ/キャンペーン/入札/予算/キーワード/ターゲティング/ネガ/プレースメント調整/クリエイティブ、レポート。
可能なら Amazon Marketing Stream / Amazon Marketing Cloud も統合。
	•	周辺・補助：Business Reports、Buy Box 指標、レビュー・評価関連の公式取得、国/MP別差分吸収。

注意：国・MP・権限・アカウント種別で利用可否が変動。機能フラグとディスカバリで自動判定・段階有効化。

3) コア原則・コンセプト
	•	Tier-0（発見系）：list_tables / list_columns / list_metrics_dimensions / resolve_terms → 列名・語彙を正規キーに確定（以後の計算で“列ぶれ”を起こさない）。
	•	Tier-1（武器関数）：filter_rows / select_columns / derive_columns / join_with / time_bucket / aggregate / window_rank_topk / elasticity_estimate / safe_price_band / stockout_risk / buybox_loss_risk …（DataFrame→DataFrame/指標）
	•	Tier-2（マクロ）：kpi_sales / kpi_ad_efficiency / kpi_margin / kpi_buybox / kpi_inventory_health / budget_pacing_report / bid_suggest_calc / keyword_mine / placement_adjustment_plan / markdown_plan / repricing_plan / replenishment_plan / attr_completeness_audit / aplus_improvement_plan …
※内部は必ず Tier-1 に展開可能（ブラックボックス禁止）。
	•	JSON Schema 厳密化：すべての関数入力は additionalProperties:false、enum/oneOf で静的検証。
	•	df_id：すべての中間/最終結果に一意名を付与（再実行・比較・監査が容易）。

4) アーキテクチャ & 実行フロー

[SP-API / Ads API / Stream / AMC]
   ↓（スケジュール＆イベント駆動 ingest：差分・再試行・レート制御）
[Ingest/Staging] → [DQ: 型/欠損/通貨/期間/重複/鮮度/粒度整合]
   ↓
[Core DWH: dim/fact/SCD2 + dfカタログ(列名/型/semantic_type)]
   ↓
[語彙辞書/列マッピング(Tier-0)] → [武器関数(Tier-1) / マクロ(Tier-2)]
                      ↑             ↓
           [Planner LLM：計画DSL生成]  [オーケストレーター：実行→検証→説明ログ]
                      ↓
            [Action Queue（提案/承認/実行/検証/Undo/ロールバック/カナリア）]
                      ↓
      [Write-back：Ads/Prices/Listings/Feeds/A+…（承認・冪等・監査）]

	•	計画DSL（JSON 列）：Tier-0→1→2 の関数呼びを列挙、引数固定。
	•	説明ログ（explain_chain_build）：入力範囲/式/閾値/除外/API呼出/レスポンス要約/決定理由をJSON保存。
	•	ガード：鮮度・在庫/欠品・Buy Box・政策・手数料・リードタイム・上限クリップ・カナリア。
	•	承認：影響額/露出範囲/政策リスクで段階承認。冪等キーとUndoは標準装備。

5) 能力マトリクス（取得 / 提案 / 実行）

5.1 取得（Pull）
	•	売上/注文（MFN/FBA）、在庫（倉庫/ASIN/SKU）、価格/競合価格、Fees/Finances/Settlements
	•	広告（Spend/Clicks/Impr/売上/Attribution）＋ Stream/近RT
	•	カタログ/ブランド（PT定義/属性/画像/A+、バリエーション）
	•	FBA（Inbound/Outbound/Restock/FC在庫/入出荷/ASN）
	•	レポート（全タイプ辞書管理で追加に自動追従）、通知（Notifications購読）

5.2 提案（Analyze/Assist）
	•	入札/予算：目標ACOS/ROAS/収益最大化、プレースメント/時間帯/曜日、キャンペーン/ASIN粒度
	•	価格：弾力性/競合/Buy Box/手数料/最低利益 → safe_price_band と markdown_plan
	•	在庫/補充：販売速度/在庫日数/リードタイム → replenishment_plan（広告抑制連動）
	•	KW/ターゲティング：検索語分析→追加KW/否定語/ASIN・カテゴリターゲティング案
	•	カタログ/A+：属性欠落/品質低下→改善提案、画像/A+/バリエーション整備案
	•	レビュー/リスク：レビュー動向/政策リスク兆候→広告/価格/在庫の抑制案

5.3 実行（Write-back）
	•	Ads：入札/予算/ON-OFF/キーワード/ネガ/ターゲティング/プレースメント/ポートフォリオ
	•	価格：Listings/Prices（政策準拠）
	•	Feeds/Listings：在庫・属性・画像・A+・バリエーション更新（フィード生成～監視まで）
	•	Autopilot：通知/Streamイベントでの自動是正（上限クリップ＋カナリア＋承認ポリシー）

6) データモデル（要点）

参照
	•	dim_store, dim_product, dim_listing, dim_brand, dim_category, dim_asin_variation, dim_pt_definition

取引/日次
	•	fact_order_*, fact_business_reports_daily, fact_ads_metrics_daily（Stream反映）,
fact_inventory_daily, fact_buybox_daily, fact_competitive_price_daily

コスト・価格
	•	fact_fees_finance, fact_settlement, fact_cost_history（SCD2）,
fact_price_history（SCD2）, fact_minmax_policy

FBA・カタログ・ブランド
	•	fact_fba_inbound, fact_fba_outbound, fact_fba_restock, fact_fc_inventory,
fact_catalog_attr_snapshot（SCD2）, fact_aplus_assets,
fact_brand_analytics_search_daily

運用/メタ
	•	dict_vocabulary, dict_metric_key, map_physical_column, report_type_registry,
fn_registry, action_queue, explain_log, dq_violation, connector_state, ingest_job_log

すべての df は df_id と schema(列名/型/semantic_type) を持つ。SCD2で再現性担保。

7) 語彙辞書/列マッピング（Tier-0）
	•	人の言葉 → 正規キー → 物理列。列名変更・多言語・国差分に強い。
	•	曖昧時は上位候補＋理由を保持、閾値未満なら確認質問。
	•	例）「閲覧数/ビュー」→ SESSIONS → business_reports.sessions
　　「広告費/メディア費」→ ADS_COST → ads_daily_v1.spend

8) 武器関数 / マクロ（Tier-1 / Tier-2）

規約（全関数共通）
	•	JSON Schema固定（additionalProperties:false / enum / oneOf）
	•	I/O：DataFrame準拠（df_id返却 + meta.log に式/条件/外れ値処理）
	•	前後バリデーション：件数0/鮮度/期間ズレ/通貨/外れ値/欠損しきい値 → 停止 or 降格提案

例：Tier-1

{
  "tool": "aggregate",
  "arguments": {
    "data": { "df_id": "ads_daily_v1" },
    "group_by": ["date", "entity_id"],
    "metrics": ["spend", "clicks", "impressions"],
    "agg_map": { "spend": "sum", "clicks": "sum", "impressions": "sum" }
  }
}

例：KPI関数
	•	gross_profit(revenue, fba_fees, cogs, ads_cost) → GROSS_PROFIT, GROSS_MARGIN
前提：通貨統一・期間一致・欠損しきい値監視。

例：Tier-2（展開可能テンプレ）
	•	広告：budget_pacing_report / bid_suggest_calc / keyword_mine / placement_adjustment_plan
	•	価格：elasticity_estimate / safe_price_band / markdown_plan / repricing_plan
	•	在庫：stockout_risk / replenishment_plan
	•	カタログ：attr_completeness_audit / aplus_improvement_plan

9) オーケストレーション / 画面連動

sequenceDiagram
  participant U as User
  participant P as Planner LLM
  participant V as Vocabulary Mapper
  participant D as DWH
  participant F as Function Registry
  participant Q as Action Queue
  participant AWS as Amazon APIs

  U->>P: 「利益を最短で上げる打ち手を」
  P->>V: resolve_terms / list_columns
  V-->>P: 正規キー/列の確定
  P->>F: Plan DSL 生成（関数列+引数）
  P->>D: 必要データ抽出
  D-->>P: データ返却
  P->>F: KPI/弾力性/在庫/BuyBox 評価
  F-->>P: 施策案（値上げ/入札/停止）
  P->>Q: 提案カード（リスク採点・承認要否・Diff）
  Q-->>U: 提案表示（根拠/期待効果/安全弁）
  U->>Q: 承認
  Q->>AWS: 実行（Ads/Price/Feeds 更新）
  Q-->>U: 実行報告＋Undo

	•	提案カード（ActionCard）：タイトル/期間/KPIタイル/期待効果/リスク/Diff
	•	Executor：Diff承認→実行→冪等キー→イベント→Undo
	•	Tracker：Run/Task 状態、効果確認（Before/After は Pull）
	•	説明ログ：input_range / functions(式/閾値/除外) / apis_called / decisions

10) FE↔BFF 契約（抜粋・JSON）

// Suggestion（提案カード）
{
  "id":"sg_1","title":"入札微調整","period":"last_7d","state":"ready",
  "comment":"CVRが前週比+12%",
  "diff":[{"id":"d1","field":"bid","before":100,"after":110,"required":true}],
  "templateRef":{"id":"ads_cvr_7d_by_campaign","params":{"mp":"JP"}}
}

// Run
{
  "runId":"run_1","status":"sending|applied|failed",
  "events":[{"t":"2025-09-20T01:23:45Z","type":"apply","note":"OK"}]
}

// EvidenceProcess
{
  "steps":[{"label":"集計: CVR 7d 比較"},{"label":"外れ値除外"}],
  "decisionNote":"CVR上昇のため+10%"
}

エンドポイント（要点）
	•	POST /threads/{id}/messages → { messageId, suggestions?: Suggestion[] }
	•	POST /runs（diff[]）→ { runId, status }（Idempotency-Key 必須）
	•	GET /runs/{id} → Run（イベント時系列）
	•	POST /tasks（提案→追跡）→ { taskId }
	•	GET /evidence?messageId|runId= → EvidenceProcess
	•	GET /outcomes?taskId=&period= → Before/After 指標
	•	全API RFC7807 準拠エラー、全更新系は冪等、x-audit-correlation-id 付与。

11) ガードレール / ポリシー
	•	データ品質：鮮度/欠損/期間ズレ/通貨/外れ値 → 自動抑止 or 確認昇格
	•	在庫/欠品/リードタイム 連動：広告/価格の自動抑制
	•	Buy Box：喪失/脆弱時は価格/広告を抑制
	•	支出上限クリップ・カナリア（限定適用→観測→全体展開）
	•	承認段階：影響額/露出/政策リスクでルール化
	•	ロールバック：直近変更の Undo を標準装備

12) 鮮度・SLA（基準値／環境で上書き可）
	•	Ads：Stream/近RT＋集計 ≤ 4h、レポートは完了即取り込み
	•	売上/注文：T+1 最小保証（イベントで補完）
	•	在庫/価格/競合価格：複数回/日
	•	FBA：入出荷/補充はイベント起点＋周期
	•	失敗率：Ingest < 1%（自動再試行込み）／Write-back 失敗は即アラート

13) セキュリティ / 運用
	•	認証：LWA/OAuth、秘密は KMS/Secret、短命トークン
	•	認可：RBAC（Viewer/Analyst/Approver/Admin/Owner + カスタム）
	•	監査：外部API呼出/設定変更/承認/Undo を一元監査ログへ
	•	PII/決済：最小収集・列レベル暗号化・マスキング
	•	可観測性：SLO/メトリクス/トレース/レート/コスト
	•	地域/規制：国別データ居住・税/VAT/インボイス拡張

14) テスト戦略
	•	関数単体：I/O契約・境界/異常（ゼロ割/欠損/通貨混在/期間ズレ）
	•	回帰：固定スナップショット比較（Tier-2 → Tier-1 展開の一致性）
	•	E2E：提案→承認→実行→観測→Undo→効果確認
	•	負荷/スケジューリング：日次バッチ×対話同時でも SLA 内
	•	権限：RBACごとの UI/実行出し分けの自動テスト

15) ロールアウト（“段階的に導通”だが機能妥協なし）
	1.	データ導通フル：SP-API/Ads/Stream/Reports/Notifications 全接続、dfカタログ/語彙/report_type_registry 完備
	2.	Tier-0/1/2 完備：武器関数・マクロ・スキーマ固定・前後検証・説明テンプレ
	3.	Write-back 完全化：Ads/価格/Listings/Feeds 書戻し＋冪等＋承認＋カナリア＋Undo
	4.	Autopilot ポリシー：通知/Streamで自動是正（上限クリップ/段階承認を外だし定義）
	5.	可観測/監査：explain_chain_build の要約UI、外部APIトレース可視化

16) 代表ユースケース（最短パイプライン）
	•	ACOS 目標収束 & 過剰消化抑制
Stream/直近14d → kpi_ad_efficiency → bid_suggest_calc（Placement/時間帯）→ カナリア適用 → Undo 可
	•	安全値上げ & Buy Box 維持
elasticity_estimate + 競合価格 + 手数料/配送/政策 → safe_price_band → repricing_plan
	•	補充最適化 × 広告連動
販売速度/在庫日数/リードタイム → replenishment_plan → 在庫脆弱ASINは広告抑制同梱
	•	KW拡張 & 否定語提案
検索語×成果 → keyword_mine → ブランド/政策フィルタ → 下書き投入
	•	カタログ整備/A+改善
attr_completeness_audit → 欠落/一貫性/画像基準 → aplus_improvement_plan + フィード生成

17) 開発者チェックリスト（初回完了条件）
	•	SP-API/Ads/Stream/Reports/Notifications 全接続／report_type_registry で全レポートタイプ辞書化
	•	df カタログ（df_id・列名・型・semantic_type）と語彙辞書/列マップ
	•	Tier-0/1/2 ＋ ユーティリティ：explain_chain_build / shape_for_widgets / validate_data / cost_estimate
	•	Action Queue（冪等・承認・カナリア・Undo・一元監査）
	•	FE/BFF 契約（RFC7807/Idempotency/Auditヘッダ）＆ UI（Inspector/Executor/Tracker/Previewer）
	•	SLO/監査/可観測性ダッシュの稼働

付録：サンプル（Filter/Aggregate）

{
  "tool": "filter_rows",
  "arguments": {
    "data": { "df_id": "ads_daily_v1" },
    "where": {
      "and": [
        { "pred": { "col": "date", "kind": "date", "op": "between", "from": "2025-09-01", "to": "2025-09-30" } },
        { "pred": { "col": "entity_type", "kind": "string", "op": "eq", "value": "campaign" } }
      ]
    }
  }
}

{
  "tool": "aggregate",
  "arguments": {
    "data": { "df_id": "ads_daily_v1" },
    "group_by": ["date", "entity_id"],
    "metrics": ["spend", "clicks", "impressions"],
    "agg_map": { "spend": "sum", "clicks": "sum", "impressions": "sum" }
  }
}


⸻
