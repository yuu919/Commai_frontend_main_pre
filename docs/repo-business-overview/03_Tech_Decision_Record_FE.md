Tech Decision Record — Frontend / BFF / Ops（v1.0）

Doc ID: ECAI-TDR-FE-1.0　/　対象: 本プロジェクト全体の技術判断の正本

0) 基本方針（不変）
	•	言語：TypeScript（strict）
	•	ランタイム：Node 20 LTS / TS 5.x（strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitOverride）
	•	フレームワーク：Next.js（App Router）採用。ただしNext固有機能に過依存しない（Server Actionsに業務ロジックを置かない）
	•	UI：React 18 + Tailwind + shadcn/ui (Radix)
	•	A11y：WCAG 2.2 AA
	•	テレメトリ：PostHog（イベント） / Sentry（FEエラー）
	•	依存管理：pnpm（content-addressable store / workspaces）

1) デザインシステム
	•	デザイントークン：CSS Variables（--color-*/--space-*/--radius-*）＋ Tailwind preset
	•	テーマ：data-theme=light|dark の2系統
	•	アイコン：lucide-react

2) 状態管理・フォーム
	•	サーバ状態：TanStack Query
	•	UI状態：Zustand（開閉/選択/モード等）
	•	フォーム：react-hook-form + zod（UI・実行時検証を両立）

3) URL規約（復元/共有の単一情報源）
	•	形式：/app?thread=:tid&tab=:Inspector|Executor|Tracker|Previewer|Knowledge&panel=:drawer|wide|split
	•	PIIをURLに載せない。微状態は history.replaceState を活用。

4) API契約・エラー・ストリーミング
	•	OpenAPI→型生成（@org/contracts）で契約の単一情報源
	•	エラー：RFC7807 互換でUI統一
	•	ストリーム：SSE（再接続・バックオフ・aria-live）
	•	更新系は Idempotency-Key 必須
	•	監査：x-audit-correlation-id を全APIに付与

5) OpenAI LLM API（公式SDK）
	•	SDK：公式 openai（JavaScript/TypeScript）
	•	ルート：FE → BFF → OpenAI（キーはFEに出さない）
	•	モード：テキストは SSEストリーム、将来的に Realtime(API)へ拡張可能
	•	ガード：BFF側でモデル/温度/トークン上限をホワイトリスト制御

6) CI/CD・認証・Secrets・i18n
	•	CI/CD：GitHub Actions + Vercel Preview（FE）/ BFFは別CI（Node互換でロックイン回避）
	•	Auth：OIDC（Auth0/Clerk/Cognito 等） + BFFセッション（HttpOnly Cookie） + RBAC
	•	Secrets：Doppler or 1Password Secrets（FEの.env は公開前提の値のみ）
	•	i18n：i18next + JSON辞書 + Intl（ja/en開始）

7) Docker（採用／必須ではないが常備）
	•	目的：M&A/別クラウド移送のための実行可能アーティファクトを提供
	•	方針：Next の output: 'standalone' を使う マルチステージDockerfile
	•	Base: node:20-alpine / Corepack 有効化で pnpm
	•	生成物のみコピー、USER node、HEALTHCHECK、PORT 3000
	•	devcontainer：ローカル差異を最小化（任意）

8) 品質・テスト
	•	Lint/Format/Commit：ESLint + Prettier + husky + lint-staged + commitlint
	•	E2E：Playwright（A11y/キーボード含む）
	•	Unit/UI：Vitest + RTL
	•	Storybook：loading/empty/error 状態を揃える
	•	Event Dictionary：PostHogイベント命名とプロパティを別管理

9) セキュリティ・NFR
	•	CSP 初期から導入、Markdownはサニタイズ（DOMPurify）
	•	LCP < 2.5s / 右パネル切替 < 150ms / スクロール60fps をパフォーマンス予算に設定

⸻

変更履歴（本TDR内）
	•	2025-09-20: 初版。i18nを next-intl → i18next に調整、OpenAI SDK/Dockerの方針を明文化。

⸻
