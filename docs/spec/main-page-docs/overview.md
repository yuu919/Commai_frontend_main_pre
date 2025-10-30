## 目的

- **本ドキュメントの対象**: メインページ着手前に、現状の `src` ディレクトリ構造・実装方針を事実ベースで把握し、Next.js の定石と将来の保守性観点から改善指針を整理する。
- **原則**: docs/Strict_coding_principles.md に準拠（推測禁止／事実と解釈の分離／小さく安全に）。

## 事実（リポジトリから確認できた内容）

- 技術スタック
  - Next.js 15, React 19, TypeScript 5.6（Node >= 20.10）
  - `tsconfig.json` に `noUncheckedIndexedAccess: true`、`paths` エイリアス（`@/components/*` など）定義
- グローバル構成
  - `src/app/layout.tsx` が `globals.css` を読み込み、`<html lang="ja" data-theme="dark">`
  - App Router を採用し、`layout.tsx` / `page.tsx` でページを構成
- ルートグループと設定エリア
  - `src/app/(app)/layout.tsx`（クライアント）
  - `src/app/(app)/settings/layout.tsx` とサイドナビ（`/settings/*` を一括でラップ）
  - `src/app/(app)/settings/page.tsx` は `/settings/account` へリダイレクト
  - 設定配下のページ: account, billing, connections, contact, help, roles, run-logs, users-access（いずれも存在）
- Users-Access（権限）
  - `src/app/(app)/settings/users-access/page.tsx`: `getStores()` で最初のストアを取得し、`/settings/users-access/amazon/{storeId}` へ遷移
  - `src/app/(app)/settings/users-access/[platformId]/[storeId]/page.tsx`: クライアント実装（フィルタ・一覧・編集・招待・一括操作 UI）。データは `@/data/mock/permissions` を元に `src/server/services/permissions.ts` が in-memory で提供
- サービス層（モック中心）
  - `src/server/services/permissions.ts`: 役割解決／割当／招待／一括操作／剥奪（in-memory, DEV想定）
  - `src/server/services/connections.ts`: ストア・サービス接続の一覧／認可 URL 生成／同期ジョブなど（モック）
  - `src/server/services/roles.ts`: リソース定義の列挙、しきい値変更の見積／保存（モック）
  - `src/server/services/runLogs.ts`: スレッド・ラン一覧のモック生成
  - `src/server/services/me.ts`, `contact.ts`: モック
- API Route Handlers（モック）
  - `src/app/api/(mock)/*` 配下に permissions / connections / roles / run-logs / me / contact を配置（`route.ts` 単位で分割済み）
- UI/スタイル
  - 汎用 UI: `src/components/ui/*`（Button, Card, Input, Modal, Select, Toast など）
  - スタイル: `src/styles/globals.css`, `src/styles/tokens.css`, `src/styles/settings.css`（設定画面のクラス群）
- 型・データ
  - 型: `src/types/{permissions,roles,connections}.ts`
  - モック: `src/data/mock/permissions.ts`（DEV-ONLY の注意書きあり）
  - `tsconfig.json` の `paths` は `@/features/*`, `@/shared/*` も定義済（現状は主に `@/components/*` 等を利用）

## 解釈／提案（将来の保守性と Next.js の定石ベース）

前提: 方向性は概ね良い（App Router・設定領域分離・サービス層抽象化・UI コンポーネントの再利用）。以下は将来の拡張に効く「小さく負債を避ける」提案。

1) ルートグループの整理（小〜中）
- 事実: すでに `src/app/(app)/...` を使用。設定は `settings/layout.tsx` で一括ラップ。
- 提案: 設定領域を独立グループとして明示し、将来の並列運用に備える。
  - 例: `src/app/(settings)/settings/...`（URL は現状維持、責務が明確になる）

2) API と Server Actions の使い分け方針を明文化（中）
- 事実: 現状はモック API（Route Handlers）＋サービス層で UI から呼び出し。
- 提案: 内部専用の mutate は Server Actions を優先し、外部公開が必要なものは `app/api/*` を使用。`USE_MOCK`（または `NEXT_PUBLIC_USE_MOCK`）で切替を統一。

3) CSS の段階的モジュール化（中）
- 事実: `settings.css` に設定系 UI が集約。
- 提案: デザイントークンは `tokens.css` に維持しつつ、画面・コンポーネント近傍へ CSS Modules（または局所ユーティリティ）をコロケーション。グローバルはリセット＋トークン中心に。

4) 型の整合性（中）
- 事実: `src/types/roles.ts` の `Role`（general|manager|owner）と、`src/types/permissions.ts` の `Role`（owner|manager|general|none）に差異。
- 提案: 役割種別を単一起点（例: `src/types/authz.ts` など）に集約し、`none` の扱いを含め統一。必要ならマッピング型を用意。

5) features と shared の使い分け（小〜中）
- 事実: `src/features` は将来用、`src/components/ui` にデザインシステム的要素。
- 提案: shared/ui は最小安定 ABI（Button, Card 等の基底）。機能固有の UI・hooks・api は `features/<domain>/` にコロケーション。barrel（`index.ts`）で公開面を管理。

6) 並列ルート（Parallel Routes）の検討（任意）
- 事実: 右ペインやモーダルはクライアント状態で管理しているページがある。
- 提案: 共有・直リンク性を高めたい詳細ペイン（例: プレビュー／エビデンス表示）は `@right` など Parallel Routes で URL 化も選択肢。

7) モックの分離と切替の一貫性（小）
- 事実: `app/api/(mock)` グループ、サービス層でモックを返す実装がある。
- 提案: 「サーバーコードからモック直 import をしない（本番導線）」を徹底。切替は env で一本化し、モックは `data/mock/*` と `app/api/(mock)/*` に閉じ込める。

## 推奨ディレクトリ例（最小変更での整理イメージ）

```text
src/
  app/
    (app)/
      page.tsx
      help/page.tsx
    (settings)/
      settings/
        layout.tsx
        page.tsx
        account/page.tsx
        billing/page.tsx
        connections/page.tsx
        roles/page.tsx
        run-logs/page.tsx
        users-access/[platformId]/[storeId]/page.tsx
    api/
      (mock)/
        connections/authorize/route.ts
        connections/callback/route.ts
        permissions/assign/route.ts
        permissions/bulk/route.ts
        permissions/invite/route.ts
        permissions/users/route.ts
        roles/estimate/route.ts
        roles/resources/route.ts
        roles/save/route.ts
        run-logs/threads/[threadId]/runs/route.ts
    layout.tsx
    page.tsx
  features/
    main/                # メインページ領域（本ドメイン）
      components/
      hooks/
      api/
      types.ts
    management/          # 設定ドメインなどの細分化例
      roles/
      connections/
  components/
    ui/                  # 最小安定 ABI のデザインシステム
  styles/
    globals.css
    tokens.css
    (必要に応じて各機能近傍に CSS Modules)
  data/
    mock/
      permissions.ts
      README.md
  types/
    connections.ts
    permissions.ts
    roles.ts
  lib/
    cx.ts
```

## 可否判定（現状に対する結論）

- 概ね適切。App Router、設定領域の分離、サービス層抽象化は正しい方向。
- ただし、将来の保守性・可用性を高めるために以下を推奨:
  - 設定領域のルートグループ明示（`(settings)`）
  - Server Actions と API の使い分けポリシーの明文化
  - `settings.css` の段階的モジュール化
  - `Role` 型の単一起点化（`none` の扱い統一）
  - features/shared の責務境界を明確化（shared/ui は基底最小）

以上を「小さく適用→確認→必要なら即ロールバック」の運用で進めれば、現時点で新たな技術的負債を作らずにメインページを安全に拡張できる。


