## UIコンポーネント厳格ポリシー v2（tokens.css / src/ui 準拠）

v1 を引き継ぎ、UI 原子の責務と tokens の SSOT をより厳密化する。以降は本番運用で `src/ui` を唯一の配置とし、既存の `components/ui` は移行後に廃止する（併用不可）。インポートは `@ui/*` を標準とする。

### 1) デザイントークン運用（不変）
- 定義源は `src/styles/tokens.css` のみ（light/dark）。
- ページ/feature からの `var(--token)` 直接参照は禁止。UI 原子でのみ消費。
- Tailwind はレイアウト/余白中心。色/枠/影/半径/高さは `var(--token)` を埋め込む。

### 2) UI 階層と責務
- `src/ui/atoms/*`: Button/Input/Badge/Card/Divider/Modal/RowMenu/Table/Text/MutedText/Hr など。
  - props のみ入力。外部状態・API 呼び出し禁止。
- `src/ui/molecules/*`: FormField/SectionTitle など原子の合成。副作用なし。
- `src/features/<domain>/components/*`: ドメイン固有 UI（ピュア制約なし、ただし tokens 直参照は禁止）。

### 3) API 標準（不変・補足）
- `size`: `sm|md|lg`（既定: md）
- `variant`: `primary|ghost|danger|outline|...`（既定: primary）
- `className` は拡張用の逃げ道。基本は `size/variant` で完結。
- CVA 等で分岐管理を一元化（任意だが推奨）。

### 4) 禁止事項（不変）
- ページ/feature からの tokens 直参照。
- 固定色（hex/rgba）、`!important`、深い子孫セレクタ、グローバル CSS の追加（reset/typography 以外）。

### 5) CI/自動チェック（更新）
- tokens 直参照の禁止（v1を更新）:
```bash
rg -n "var\(--" frontend/src/app frontend/src/features \
  --glob '!**/ui/**' --glob '!**/styles/**' && echo 'Tokens direct reference found' && exit 1 || echo 'OK'
```
- ハードコード色の禁止:
```bash
rg -n "#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b" frontend/src \
  --glob '!**/styles/tokens.css' --glob '!**/*.md'
```
- rgba/hsla の禁止（tokens.css 以外）:
```bash
rg -n "rgba?\s*\(" frontend/src \
  --glob '!**/styles/**' --glob '!**/*.md' && exit 1 || true
rg -n "hsla?\s*\(" frontend/src \
  --glob '!**/styles/**' --glob '!**/*.md' && exit 1 || true
```
- Stylelint（tokens 以外での `color-mix` 禁止、a11y ルール）を継続。

### 6) a11y/フォーカス（不変）
- WCAG AA を満たす。フォーカスリングは `--accent` を既定。
- Modal/RowMenu のフォーカストラップ・ショートカットは UI 原子で提供。

補足（本リポジトリ決定事項）:
- フォーカスリングは 2px/solid/`--accent` に固定。
- 既定ショートカット: Esc/Enter/Arrow を原子側実装。グローバルは Cmd/Ctrl+K（Palette）, Cmd/Ctrl+F（検索）, Cmd/Ctrl+Enter（送信）を順次導入。

### 7) 移行・最終化
- 新規/変更は必ず `src/ui/*` に実装し、インポートは `@ui/*` に統一（`tsconfig.json` の `paths` で定義）。
- 既存 `components/ui/*` は移行フェーズのみ一時参照可。移行完了後にフォルダごと削除（併用禁止）。
- 具体的コマンドとタイムラインは `sections v2/migration_plan.md` を参照（置換/削除の一括コマンドを記載）。

補足（本リポジトリ決定事項）:
- `--surface-accent-soft` を tokens.css に追加し、`Table.highlight="accent"` で使用。
- `Surface` に `elevated?: boolean` を標準 API として追加（影付与をページ側で直接指定しない）。
- `Button` の追加 variant（outline 等）は後続 PR で段階追加。

### 8) DoD（完了定義）
- すべての新規/更新 UI は tokens 準拠、`size/variant` API を提供。
- ページ/feature からの tokens 直参照は CI でゼロ。
- スクリーンショット（light/dark）で視覚回帰を確認（任意: Storybook/Chromatic）。

### 9) 拡張API（標準化済み）
- Surface: `elevated?: boolean` で影を付与（例: `shadow-[var(--ui-shadow-sm)]` 相当）。影指定はページ/機能側で直接指定しない。
- Table: `highlight?: "accent"|"warn"|"success"|"error"|"info"` を `Table.Tr/Th/Td` で受け、`bg-[var(--surface-*-soft)]` を適用。強調背景をページ/機能で `rgba()/hsla()` 直指定することを禁止。

補足（本リポジトリ決定事項）:
- `color-mix()` は `styles/tokens.css` のみ許可。UI/feature では tokens 経由の class に限定。

### 10) ファイル構成/エクスポート規約
- 1 原子 = 1 ファイル（default + named を提供可）。
- `src/ui/index.ts` から集約エクスポートし、呼び出しは `@ui` エイリアス経由に統一。
- 依存の向き: `app/features → ui → styles/tokens`（逆方向は禁止）。


