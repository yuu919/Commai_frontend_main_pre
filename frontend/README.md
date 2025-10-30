# Frontend Next

Backend is developed separately in `backend/`. This app communicates with backend strictly via HTTP APIs (see `src/lib/repositories/*` → `src/lib/api/*`). Server Actions, if any, are thin adapters only when same-origin cookies/CSRF are required.

## パッケージマネージャ

- 本プロジェクトのフロントエンドは **pnpm を前提** とします。
- 初回セットアップ:

```bash
corepack enable
corepack use pnpm@9
pnpm install
```

## 環境変数

以下を `frontend/.env.local` に設定してください。

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_DB_API_URL=http://localhost:8000/api/db
NEXT_PUBLIC_USE_MOCKS=false
```

本番運用では、`ShareResponse.share_url` はバックエンドが `BASE_URL` を用いて完全URLを返します。フロント側でのURL連結は行わず、そのまま表示/コピーしてください。

> 注意: `BASE_URL` はAPIのホストではなく「フロントの公開URL（例: https://app.example.com）」です。

## 開発/ビルド

```bash
# 開発サーバ
pnpm dev  # -p 3001 などでポート指定可

# 本番ビルド
pnpm build

# 本番起動
pnpm start
```

他のパッケージマネージャ（npm/yarn/bun）はサポート対象外です（CI/ドキュメントも pnpm 前提）。

## モック運用（BEなしでもUI検証可能）

- 切替: `.env.local` にて `NEXT_PUBLIC_USE_MOCKS=true`
- 影響: `app/providers.tsx` で各 Repository が `*.mock.ts` に切替（HTTP不要）
- SWR: ネットワーク不要の箇所は `key=null` で抑止（例: users-access の一覧）
- 対応範囲: account / billing / users-access / connections / roles / run-logs / help / contact の主要操作

## OpenAPI（設定系）

- 仕様: `docs/api/openapi.yaml`（設定系エンドポイントを追記済み）
- 運用: BEと合意後、当ファイルを更新 → `src/lib/api/settings/*` に反映（必要ならコードジェン採用検討）

## ドキュメント

- 全体方針/移行/標準: `../docs/main.md`
- 理想ディレクトリ構成（完成版）: `../docs/ideal-directory.md`

## CSS/Stylelint

トークンは `src/styles/tokens.css` に集約しています。共有/アップロード進捗の配色・フォーカスリングは以下のトークンを使用します。

- `--chat-upload-track` / `--chat-upload-bar` / `--chat-upload-text-muted` / `--chat-upload-focus`

Stylelintは recommended + standard + tailwindcss を採用しています。

```bash
pnpm stylelint
```

## 認証モジュールの使い分け

- クライアント専用: `src/lib/auth.client.ts`（トークン取得・ヘッダー構築・Client用フック）
- Server専用: `src/lib/server/auth.server.ts`（Cookieからのヘッダ生成 / Server Components 用）

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Threads のモックモード（UI向け）

バックエンドが未接続でも UI と遷移を仕上げられるよう、Threads はモックに切替可能です。

1) `.env.local` で切替

```
NEXT_PUBLIC_USE_MOCKS=true  # モックON（メモリ上のダミーデータ）
```

2) 仕組み
- `ThreadsRepository` 抽象（list/create/rename/delete/move）
- 実API: `lib/repositories/threads.server.ts`
- モック: `lib/repositories/threads.mock.ts`
- 注入: `app/providers.tsx` で `NEXT_PUBLIC_USE_MOCKS` を見て選択
