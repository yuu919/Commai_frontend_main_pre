## 統一ルール/設計原則 v2（最終版）

本ドキュメントは v1 の合意事項を引き継ぎつつ、ディレクトリと依存規律を厳密化し、技術負債最小のための最終方針を定義する。

### 0) 目的
- 依存の一方向化と境界の明確化により、循環・密結合・抽象の二重化を排除する。
- API 契約・UI トークン・型の「単一の真実源（SSOT）」を確立する。

---

### 1) 層構造と依存規律（最重要）

```
app → features → (ui | hooks | stores | api) → lib
             ↘→ (constants | types | styles)
```

- 逆流禁止（ESLint で強制）。
- app: ルーティング/配置のみ。API 呼び出し・ビジネスロジックは禁止。
- features: ドメイン完結（UI 特化/内部 hooks/Repository/types）。外部データは必ず Repository 経由。
- ui: ピュアUI（propsのみ、外部状態/API副作用禁止）。トークンはここでのみ消費。
- hooks: UI 非依存の汎用ロジック（DOM/feature 依存禁止）。
- stores: 真に横断的な状態のみ（auth/ui/alert 等）。
- api: OpenAPI 自動生成クライアント（生成物のみ配置）。
- lib: 横断 util（fetcher/sse/error/telemetry/a11y 等）。
- constants/types/styles: 参照自由だが状態や副作用を持たない。

---

### 2) ディレクトリ（最終構造）

```
src/
  app/
  ui/              # atoms/molecules, tokens 消費はここだけ
  hooks/           # UI 非依存の汎用 hooks
  features/
    <domain>/
      components/  # ドメイン固有 UI（ピュア制約なし）
      hooks/       # ドメイン専用 controller 等
      api/         # repository.ts（唯一の外部 I/O 入口）
      types.ts
      index.ts
  stores/          # auth/ui/alert 等の横断状態
  api/             # OpenAPI 生成物
  lib/             # fetcher/sse/error/telemetry/a11y など
  constants/
  styles/          # tokens.css/globals.css
  types/
```

v1 からの継承: Server/Client 分離（`lib/db.server.ts`/`lib/db.client.ts`）, tokens.css の SSOT, SSE 共通化方針。

---

### 3) API 契約と Repository（単一点）
- OpenAPI → `src/api/*` に自動生成（型の SSOT）。
- features/<domain>/api/repository.ts が唯一の外部 I/O 入口。
- ランタイム検証（zod）とエラー正規化（`lib/error.ts`）を Repository に集約。
- UI/feature は生成クライアントを直接参照しない。

---

### 4) UI とトークン（v1 整合）
- トークン定義は `styles/tokens.css` のみ（SSOT）。
- ページ/feature からの `var(--token)` 直接参照は禁止。ui 内でのみ消費。
- Tailwind はレイアウト/余白中心。色/枠/影/半径/高さはトークン経由。

---

### 5) リアルタイム（SSE/Upload）の境界
- SSE 型/判定/節流は `lib/sse.ts` に集約。
- ストリーム接続・楽観更新・再接続戦略は各 feature の controller（`features/<domain>/hooks/`）で保持。
- グローバル store へ昇格するのは「横断で監視すべき指標」のみ（例: ネットワーク健全性）。

---

### 6) 認証/SSR ガード（v1 継承）
- `middleware.ts` で Cookie を検査し SSR から保護。除外ルートは v1 に準拠。
- Server 側ヘッダー解決は `lib/server/auth.server.ts` / `lib/server/db.server.ts` に集約。

---

### 7) エラー/可観測性（v1 継承）
- `lib/error.ts` の `normalizeHttpError`/`MESSAGES` を単一点に。
- Telemetry は `lib/telemetry.ts` で API/SSE/Upload の主要イベントを記録。

---

### 8) Lint/CI ガード
- import 規律: `import/no-restricted-paths` で逆流依存を禁止。
- tokens 直参照検知: v1 の grep を継承し、`ui/` を除外対象に固定。
- Stylelint: `color-no-hex` 等を適用し、tokens.css のみ例外。

- 追加強制事項（本リポジトリ決定事項）
  - `rgba()/hsla()` の使用禁止（`src/styles/` を除外）。grep ベースで CI Fail。
  - `color-mix()` は `styles/tokens.css` のみ許可。Stylelint `function-disallowed-list: ["color-mix"]` を適用。

---

### 10) 移行フェーズの暫定互換（本リポジトリ決定事項）
- 次の互換は移行期間のみ許容し、タイムラインは `migration_plan.md` の T+0/T+7/T+14... に従う。
  - `src/components/ui/*` → `src/ui/*` へ段階移行（当面は再エクスポートで互換）。
  - `src/lib/repositories/*` → `features/<domain>/api/repository.ts` へ段階移設（当面は re-export）。
  - `lib/transport/sse.ts` → 最終は `lib/sse.ts`（一時的に旧パスから再エクスポート）。
  - `docs/sections v1/*` → v2 へ一本化（最終的に v1 を削除）。

---

### 9) DoD（完了定義）
- 依存方向違反なし（ESLint パス）。
- ページ/feature からの tokens 直参照ゼロ（CI パス）。
- Repository 経由でのみ外部 I/O（生成クライアント直参照なし）。
- SSE/Upload は controller に集約、エラー表示はマトリクス準拠。


