## 概要 v2（ゴール/前提/最終構造/対応マッピング）

### ゴール
- Next.js 15 App Router + React 19 において、技術負債を最小化する層構造・依存規律・UI/通信ポリシーを確立する。

### 前提（v1 からの継承）
- Server/Client 厳密分離（`lib/db.server.ts`/`lib/db.client.ts`）。
- tokens.css を UI の唯一の定義源に（ページ/feature からの直参照禁止）。
- SSE/Upload は共通化（`lib/sse.ts`/`lib/uploads.ts`）。

### 最終ディレクトリ構造（v2 正）
```
src/
  app/
  ui/
  hooks/
  features/
    <domain>/components|hooks|api|types.ts|index.ts
  stores/
  api/
  lib/
  constants/
  styles/
  types/
```

### 依存規律
```
app → features → (ui | hooks | stores | api) → lib
             ↘→ (constants | types | styles)
```

### 主要マッピング（例）
- 旧 `components/ui/*` → 新 `src/ui/*`（再エクスポートで互換維持可）
- 旧 `lib/repositories/*` → 各 `features/<domain>/api/repository.ts`
- 旧 feature 内 `logic/*` → `features/<domain>/hooks/*`
- tokens 直参照（features 内） → `src/ui/*` の variant へ吸い上げ

### 受け入れ基準（DoD）
- 逆流依存なし（ESLint）。
- tokens 直参照ゼロ（CI grep）。
- Repository 経由でのみ外部 I/O。
- SSE/Upload の UI 表示がエラーマトリクスに準拠。

補足（本リポジトリ決定事項）:
- `@/components/ui` Import 0 件 / `lib/repositories` 参照 0 件 / `lib/transport/sse.ts` 参照 0 件であること。
- Stylelint による `color-mix` 禁止（tokens.css 除外）、`rgba/hsla` 禁止、`color-no-hex` を CI で強制。


