## v2 移行タスクリスト（チェックリスト）

> **凡例**  
> - [x] 完了 (done)  
> - [ ] 未着手／進行中 (todo)
>
> **進捗**: PR-1 ✅ / PR-2 ✅ / PR-3 ✅ / PR-4 ✅

---

## 0. 初期準備 & ドキュメント
### ドキュメント整備
- [x] v2 各ドキュメントの矛盾解消・決定事項追記
- [x] `migration_plan.md` へ詳細フェーズ・タイムライン追加
- [x] 本タスクリストファイル更新 (Phase-A/B/C 対応)
- [x] 後段 PR-6/7/8/9 の拡張タスク明文化

---

## PR-1 : UI レイヤー新設 & 逆流 Lint (T+0d 〜 T+28d)
**状態**: 🟢 完了

### Phase-A : ディレクトリ＆互換レイヤー
- [x] `src/ui/` ディレクトリ作成
- [x] `src/ui/index.ts` を `components/ui` から再エクスポート で作成
- [x] `tsconfig.json` に `@ui/*` パスエイリアス追加
- [x] ESLint `import/no-restricted-paths` ルール追加 (severity: `warn`)
- [x] `pnpm lint && pnpm build` でグリーン確認
- [x] 既存画面表示・機能 OK

### Phase-B : import 置換 & Lint 昇格 (T+7d 頃)
- [x] '@/components/ui' → '@/ui' への一括置換実装
- [x] `rg '@/components/ui' src` で 0 件確認
- [ ] ESLint `import/no-restricted-paths` を severity `error` に昇格
- [ ] `pnpm lint` でエラーなし確認

### Phase-C : 互換削除 (T+28d 以降)
- [x] `@/components/ui` import が確実に 0 件を確認
- [x] `src/components/ui/*` ファイル削除
- [x] `src/components/ui/index.ts` 再エクスポート削除
- [x] `pnpm lint && pnpm build && npm run policy:check` グリーン
- [x] `docs/sections v1/*` ファイル削除

**PR-1 DoD チェック**:
- [x] `src/ui/` と `@ui/*` エイリアス完成
- [x] 再エクスポート互換完備
- [x] ESLint `import/no-restricted-paths` ルール追加 (warn)
- [x] CI green (lint/build)
- [x] Phase-B 完了: '@/components/ui' → '@/ui' 全置換 完了
- [x] Phase-C 完了: 互換削除 (`src/components/ui/*` & `docs/sections v1/*` 削除)
- [x] 全 lint/stylelint/policy/build グリーン確認

---

## PR-2 : tokens / Stylelint / policy 強化 (T+0d 〜 T+7d)
**状態**: 🟢 完了

### Token & Stylelint 設定
- [x] `styles/tokens.css` に `--surface-accent-soft` token 追加 (light/dark 両方)
- [x] Stylelint に `color-no-hex: true` ルール追加
- [x] Stylelint に `color-no-rgba: true` ルール追加
- [x] Stylelint に `color-no-hsla: true` ルール追加
- [x] Stylelint に `function-disallowed-list: ["color-mix"]` ルール追加
- [x] Stylelint `ignoreFiles` に `src/styles/tokens.css` 追加
- [x] `pnpm stylelint src/**/*.css` でグリーン

### Policy Script 拡張
- [x] `package.json` に `policy:rgba-ban` script 追加
- [x] `package.json` に `policy:hsla-ban` script 追加
- [x] `package.json` に `policy:check` script 統合
- [x] `npm run policy:check` でグリーン

### GitHub Actions 統合 (CI/CD)
- [x] `.github/workflows/frontend.yml` 作成 (または既存に追加)
- [x] `lint` step: `pnpm lint` 実行
- [x] `stylelint` step: `pnpm stylelint src/**/*.css` 実行
- [x] `policy` step: `npm run policy:check` 実行
- [x] `build` step: `pnpm build` 実行
- [x] `test` step: `pnpm test --if-present` 実行
- [x] CI で全 step green を確認
- [x] CI test step 追加（`--if-present` で存在時のみ実行）

**PR-2 DoD チェック**:
- [x] tokens / Stylelint ルール全追加完了
- [x] `npm run policy:check` green
- [ ] CI workflow 作成 (ステップ追加)
- [x] 全 UI 表示・機能 OK

---

## PR-3 : Repository 移設 (chat/threads/projects/settings/users/inspector) (T+7d 〜 T+21d)
**状態**: 🟢 完了

### chat Domain
- [x] `features/chat/api/repository.ts` 新設 (内容: `lib/repositories/messages/index.ts` コピー)
- [x] `features/chat/api/repository.mock.ts` 作成
- [x] `features/chat/api/repository.server.ts` 作成
- [x] `lib/repositories/messages/index.ts` を `export * from '@/features/chat/api/repository'` に更新
- [x] `app/providers.tsx` で `messages` import パス切り替え (`@/features/chat/api/repository`)
- [x] mock/server toggle 動作確認

### threads Domain
- [x] `features/threads/api/repository.ts` 新設
- [x] `features/threads/api/repository.mock.ts` 作成
- [x] `features/threads/api/repository.server.ts` 作成
- [x] `lib/repositories/threads/index.ts` を re-export に更新
- [x] call-site import 置換
- [x] mock/server toggle 動作確認

### projects Domain
- [x] `features/projects/api/repository.ts` 新設
- [x] `features/projects/api/repository.mock.ts` 作成
- [x] `features/projects/api/repository.server.ts` 作成
- [x] `lib/repositories/projects/index.ts` を re-export に更新
- [x] call-site import 置換
- [x] mock/server toggle 動作確認

### users Domain (新規)
- [x] `features/users/api/repository.ts` 新設
- [x] `features/users/api/repository.mock.ts` 作成
- [x] `features/users/api/repository.server.ts` 作成
- [x] `lib/repositories/users/index.ts` を re-export に更新 (新規作成)
- [x] call-site import 置換
- [x] mock/server toggle 動作確認

### inspector Domain (evidence)
- [x] `features/inspector/api/repository.ts` 新設
- [x] `features/inspector/api/repository.mock.ts` 作成
- [x] `features/inspector/api/repository.server.ts` 作成
- [x] `lib/repositories/inspector/index.ts` を re-export に更新 (新規作成)
- [x] call-site import 置換
- [x] mock/server toggle 動作確認

### settings Domain (機能別分割)
- [x] `features/settings/api/` ディレクトリ作成
- [x] `features/settings/api/general.ts` 作成 (共通設定)
- [x] `features/settings/api/billing.ts` 作成
- [x] `features/settings/api/roles.ts` 作成
- [x] `features/settings/api/users-access.ts` 作成
- [x] `features/settings/api/account.ts` 作成
- [x] `features/settings/api/connections.ts` 作成
- [x] `features/settings/api/index.ts` 作成 (全機能の集約 export)
- [x] `lib/repositories/settings/` フォルダを re-export に更新
- [x] call-site import 置換
- [x] mock/server toggle 動作確認

### providers.tsx 更新
- [x] `import { createMockMessagesRepository, createServerMessagesRepository } from '@/features/chat/api/repository'` 切り替え
- [x] 同様に threads を切り替え
- [x] 同様に projects を切り替え
- [x] 同様に users を切り替え
- [x] 同様に inspector を切り替え
- [x] 同様に settings を切り替え (複数 repo 注入)
- [x] `useMemos` の初期化を全 domain で確認

### CI 確認
- [x] `rg 'lib/repositories' src` で 0 件を確認
- [x] `rg '@/lib/repositories' src` で 0 件を確認
- [x] `pnpm lint && pnpm build` green

**PR-3 DoD チェック**:
- [x] chat 完了
- [x] threads 完了
- [x] projects 完了
- [x] users 完了
- [x] inspector 完了
- [x] settings 完了
- [x] `lib/repositories` インポート 0 件
- [x] `providers.tsx` 全 domain 新パス切り替え
- [x] mock/server toggle 全 domain 動作確認
- [x] CI green (lint/build)

---

## PR-4 : SSE ファイル集約 + Error 移動 (T+21d 〜 T+28d)
**状態**: 🟢 完了

### SSE ファイル リネーム
#### Phase-A : 新ファイル作成
- [x] `lib/sse.ts` 新設 (旧 `lib/transport/sse.ts` 内容コピー)

#### Phase-B : 暫定互換レイヤー
- [x] `lib/transport/sse.ts` を `export * from '../sse'` に更新

#### Phase-C : import 置換
- [x] `rg 'lib/transport/sse' -l src | xargs sed -i '' 's#lib/transport/sse#lib/sse#g'` で置換
- [x] `rg 'lib/transport/sse' src` で 0 件確認

#### 互換削除
- [x] `rm lib/transport/sse.ts` (Phase-C から +1w 後)

### Error 関数 移動
#### normalizeHttpError 移動
- [x] `lib/error.ts` に `normalizeHttpError` 関数を追加 (旧 `lib/transport/fetcher.ts` から移動)
- [x] `lib/transport/fetcher.ts` で `import { normalizeHttpError } from '../error'` に切り替え
- [x] call-site で `import { normalizeHttpError } from '@/lib/transport/fetcher'` を `@/lib/error` に置換
- [x] `rg 'lib/transport/fetcher.*normalizeHttpError' src` で 0 件確認

### CI 確認
- [x] `rg 'lib/transport/sse' src` で 0 件を確認
- [x] `pnpm lint && pnpm build` green

**PR-4 DoD チェック**:
- [x] `lib/sse.ts` 新設完了
- [x] `lib/transport/sse.ts` → re-export のみ
- [x] `normalizeHttpError` を `lib/error.ts` に移動
- [x] call-site import 置換完了
- [x] `lib/transport/sse` / `lib/transport/fetcher` 参照 0 件
- [x] CI green (lint/build)

---

## PR-5 : v1 ドキュメント & 旧 UI 完全削除 (T+28d 〜 T+30d)
**状態**: ⏳ 保留中 (PR-4 後に実施)

### Phase-B/C 完了確認
- [x] PR-1 Phase-B で `@/components/ui` import 0 件確認済み
- [x] PR-3 Phase-C で `lib/repositories` import 0 件確認済み

### v1 ドキュメント Deprecate
- [ ] `docs/sections v1/` の全ファイル先頭に "⚠️ このドキュメントは v2 に置き換わりました。`docs/sections v2/` を参照してください。" バナー追記

### UI 互換削除
- [ ] `src/components/ui` ディレクトリ削除 (`@/components/ui` import 0 件確認後)
- [ ] `src/ui/index.ts` の再エクスポート確認

### v1 docs 完全削除
- [ ] `git rm -r docs/sections\ v1`

### CI 確認
- [ ] `pnpm lint && pnpm build && npm run policy:check` green
- [ ] 全機能・画面表示 OK

**PR-5 DoD チェック**:
- [ ] `src/components/ui` ディレクトリ削除
- [ ] `docs/sections v1/` ディレクトリ削除
- [ ] CI green (lint/build/policy/stylelint)
- [ ] 全機能 OK

---

## PR-6 : UI 原子 & a11y 拡張 (T+30d 以降)
**状態**: ⏳ 保留中 (PR-5 後に実施)

### PR-6a: hooks レイヤー導入
- [ ] `src/hooks/` ディレクトリ新設（UI 非依存 hooks 用）
- [ ] `lib/keyboard.ts` を `src/hooks/useKeyboardShortcuts.ts` に移動
- [ ] SWR 汎用ヘルパ (`lib/client` 由来) を `src/hooks` に整理
- [ ] ESLint ゾーン更新: hooks は features/ui から参照可・lib も可

### PR-6b: features 内 hooks 統合
- [ ] `features/*/logic` → `features/*/hooks` へリネーム
- [ ] providers 依存を props/DI 方式へ統一

### PR-6c: components/llm 移設
- [ ] `src/components/llm/*` → `src/features/chat/components/llm/*` へ移動
- [ ] UI 原子を `src/ui` へ切り出し（依存逆流禁止）
- [ ] 旧パスに re-export ファイル設置 (PR-7 で削除)

### Surface コンポーネント拡張
- [ ] `src/ui/Surface.tsx` (または `src/components/ui/Surface.tsx`) に `elevated?: boolean` prop 追加
- [ ] `elevated` で `box-shadow` や背景トーンを調整
- [ ] Storybook で light/dark 両テーマで表示確認

### Button コンポーネント拡張
- [ ] `Button` コンポーネント の `asChild` prop を正式サポート
  - 既に暫定実装済み (`src/components/ui/Button.tsx` に `asChild?: boolean` あり)
  - 実装の確認と Storybook 追加
- [ ] 新 variant (`outline`, `secondary` など) を段階的に追加
  - 各 variant は `styles/tokens.css` のトークンで色定義
  - CSS-in-JS ではなく className ベース
- [ ] Storybook に全 variant の stories 追加
- [ ] light/dark テーマで回帰なし確認

### Modal/RowMenu フォーカストラップ
- [ ] `src/components/ui/Modal.tsx` (存在確認後) にフォーカストラップ実装
  - Esc キーで close
  - Tab キーで要素内ループ
- [ ] `src/components/ui/RowMenu.tsx` (またはドロップダウン) にも同様
- [ ] `useEffect` + `useRef` で trap logic 実装
- [ ] a11y テスト (キーボード操作) 手動確認

### グローバルショートカット実装
- [ ] `src/lib/a11y.ts` に以下 shortcut 定義:
  - `Cmd/Ctrl+K`: Command Palette (未実装ならダミー)
  - `Cmd/Ctrl+F`: 検索入力フォーカス
  - `Cmd/Ctrl+Enter`: プライマリ送信ボタン
- [ ] `useEffect` で `window.addEventListener('keydown', ...)` 追加
- [ ] 既存 `src/lib/keyboard.ts` との統合
- [ ] 手動テスト (複数 OS/ブラウザ) で動作確認

### a11y トークン確認
- [ ] `--focus-ring: 2px solid var(--accent)` token 確認 (tokens.css)
- [ ] WCAG AA コントラスト比 4.5:1 確認

**PR-6 DoD チェック**:
- [ ] `Surface.elevated?: boolean` 実装・表示 OK
- [ ] `Button.asChild` 正式サポート・Storybook 追加
- [ ] Button 新 variant 追加・Storybook 表示
- [ ] Modal/RowMenu フォーカストラップ実装・手動テスト OK
- [ ] グローバルショートカット実装・手動テスト OK
- [ ] hooks レイヤー導入・features hooks 統合・LLM 移設
- [ ] Storybook/Chromatic で回帰なし

---

## PR-7 : Auth & SSR 強化 (T+30d 以降)
**状態**: ⏳ 保留中 (PR-6 後に実施)

### Cookie-to-Bearer 実装
- [ ] `lib/server/auth.server.ts` に `extractBearerFromCookie()` 関数実装
  - Auth0 Cookie から JWT token 抽出
  - Bearer token として Backend へ forwarding
- [ ] `middleware.ts` から呼び出し
- [ ] 環境変数 `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID` 設定確認

### 開発用バイパス無効化
- [ ] `lib/server/auth.server.ts` で `/__auth/on|off` エンドポイント本番無効化
  - `process.env.NODE_ENV === 'production'` check
  - 本番では 403 Forbidden
- [ ] Allow リスト (localhost/127.0.0.1) 確認
- [ ] `pnpm build` でプロダクションビルド確認

### 503 自動再試行実装
- [ ] `lib/transport/fetcher.ts` に retry logic 追加
  - 初回 delay: 2s
  - exponential backoff factor: 1.5
  - 最大試行回数: 5
- [ ] retry 対象: HTTP 503, network timeout
- [ ] callback/hook で retry count expose (telemetry 用)
- [ ] 手動テスト (503 mock) で retry 動作確認

**PR-7 DoD チェック**:
- [ ] `lib/server/auth.server.ts` Cookie-to-Bearer 実装
- [ ] 開発用バイパス本番無効化
- [ ] 503 自動再試行 (2s, factor 1.5, max 5) 実装
- [ ] 手動 QA: Auth Guard / SSR 動作 OK

---

## PR-8 : Share & 運用 (T+30d 以降)
**状態**: ⏳ 保留中 (PR-7 後に実施)

### Share リンク期限 Banner
- [ ] `/share/{token}` page で期限チェック
- [ ] **Near Expiry** (24h 未満): 警告 Banner 表示
  - テキスト: "このリンクは XXX で期限切れになります"
  - 色: warning (黄/オレンジ)
- [ ] **Expired**: エラー Banner + 再取得ボタン
  - テキスト: "リンクの有効期限が切れました"
  - ボタン: "新しいリンクをリクエスト" (API 呼び出し)
- [ ] UI: `src/app/share/[token]/page.tsx` に Banner コンポーネント実装
- [ ] 手動テスト (期限設定 mock) で表示確認

### Workspace 限定ログイン
- [ ] Share 時に workspace 限定ログインオプション確認
  - 既存実装がある場合、導線を確認
  - ない場合、簡易ボタン追加 (URL 生成 → 新 tab)
- [ ] 手動テスト

### Telemetry 拡張
- [ ] `lib/telemetry.ts` に以下を追加:
  - API call: `endpoint`, `method`, `status`, `duration`, `retry_count`
  - SSE stream: `event_name`, `payload_size`, `duration`
  - Upload: `file_size`, `progress`, `status`, `duration`
- [ ] イベント定義スキーマ確認 (JSON/TS)
- [ ] Backend telemetry endpoint で receiver 実装確認

**PR-8 DoD チェック**:
- [ ] `/share/{token}` Near Expiry Banner 実装
- [ ] `/share/{token}` Expired Banner + 再取得ボタン
- [ ] Workspace 限定ログイン導線確認
- [ ] Telemetry API/SSE/Upload 三系列ログ拡張
- [ ] 手動 QA OK

---

## PR-9 : Cleanup & 最適化 (T+30d 以降)
**状態**: ⏳ 保留中 (PR-8 後に実施)

### ESLint config 移行
- [ ] `.eslintignore` を `eslint.config.mjs` の `ignores` に統合
- [ ] 既存 ignore pattern 確認・移行
- [ ] `.eslintignore` ファイル削除

### デバッグフラグ削除
- [ ] `window.__messagesRepo` 参照を全削除
  - grep で確認: `rg 'window.__messagesRepo' src`
  - 削除後: 0 件確認
- [ ] TypeScript `global` 型定義削除 (あれば)

### レガシーコード削除
- [ ] `lib/legacy/db.client.ts` 参照を grep で確認
- [ ] 参照がなければ削除
- [ ] 参照があればリファクタ後に削除

### Zod 検証追加
- [ ] 各 Repository (`features/<domain>/api/repository.ts`) に Zod schema 追加
  - 段階的: chat → threads → projects → ...
  - API response validation
  - ネスト型も schema 定義
- [ ] error handling で Zod.ZodError catch
- [ ] Telemetry でスキーマ違反をログ

### 既存 ESLint Warning 対処
- [ ] `no-unused-vars` warning を修正
- [ ] `no-explicit-any` を型で置き換え
- [ ] `react-hooks/exhaustive-deps` 修正
- [ ] `no-img-element` を `Image` コンポーネント置換
- [ ] `pnpm lint` で warning 0 を目指す

**PR-9 DoD チェック**:
- [ ] `.eslintignore` → `eslint.config.mjs` 移行完了
- [ ] `window.__messagesRepo` 参照 0 件
- [ ] `lib/legacy/db.client.ts` 削除
- [ ] Zod 検証追加 (全 repositories)
- [ ] ESLint warning 0
- [ ] CI green

---

## 最終完了判定 (DoD 全体)
### コード品質
- [x] ESLint `import/no-restricted-paths` 逆流依存違反 0
- [x] Stylelint (color/color-mix 関連) 違反 0
- [x] `npm run policy:check` green (tokens/hex/rgba/hsla)
- [ ] TypeScript strict mode 型エラー 0 (PR-9 後確認)
- [ ] `@/components/ui` インポート 0 件 (PR-5 後確認)
- [ ] `lib/repositories` インポート 0 件 (PR-3 後確認)
- [ ] `lib/transport/sse.ts` 参照 0 件 (PR-4 後確認)

### CI/CD
- [ ] GitHub Actions (lint/build/test/policy/stylelint) green
- [ ] pnpm workspace cache 設定済み
- [ ] Deploy ready

### ドキュメント
- [ ] `docs/sections v2/` 全ファイル存在・完全
- [ ] `docs/sections v1/` 削除 (PR-5 後)

### 動作確認
- [ ] SSE ストリーム表示 OK
- [ ] Upload 進捗表示 OK
- [ ] Auth Guard / SSR 動作 OK
- [ ] Share リンク期限 Banner OK
- [ ] UI 全機能 (light/dark) 表示 OK
- [ ] グローバルショートカット動作 OK
- [ ] フォーカストラップ (Modal/RowMenu) OK
- [ ] Storybook/Chromatic 回帰なし (任意)

---

## 後回し検出リスト（発生した漏れ・延期 items）

### Phase-A/B/C の明文化
- [x] UI (PR-1) Phase-A/B/C タイムラインと実施順序の詳細化
- [x] Repository (PR-3) Phase-A/B/C 各 domain の並行実施計画
- [x] SSE (PR-4) Phase-A/B/C と互換削除のガード条件

### PR-3 Repository 実装
- [x] `users` domain 追加（新規）
- [x] `inspector` domain (evidence) 追加（新規）
- [x] `settings` 機能別分割（billing/roles/users-access/account など）
- [x] `providers.tsx` に複数 Repository 新パスで注入

### PR-4 normalizeHttpError 移動
- [x] `lib/error.ts` へ関数移動の詳細ステップ追加
- [x] call-site import 置換の grep コマンド明記

### Auth & SSR 強化
- [x] `lib/server/auth.server.ts` Cookie-to-Bearer 実装タスク化
- [x] 開発用バイパス (`/__auth/on|off`) 本番無効化タスク化

### Share & 運用
- [x] `/share/{token}` 期限 Banner (Near Expiry / Expired) 実装タスク化
- [x] 再取得ボタン実装の詳細化
- [x] Telemetry 三系列（API/SSE/Upload）ログ拡張タスク化

### Cleanup & 最適化
- [x] `.eslintignore` → `eslint.config.mjs` ignores 移行タスク化
- [x] Zod 検証追加の段階的タスク化
- [x] 既存 ESLint warning 対処リスト化

### CI/環境
- [x] GitHub Actions workflow（PR-2 で初検出）のステップ詳細化
- [x] Docker dev container (GNU sed) 互換のタスク化

---

## 進捗サマリ

| PR | フェーズ | 進捗 | 完了予定 |
|----|---------|------|---------|
| PR-1 | Phase-A | 🟢 完 | 完了 |
| PR-1 | Phase-B/C | ⏳ 保留 | T+7-28d |
| PR-2 | All | 🟢 完 | 完了 |
| PR-3 | chat | 🟢 完 | 完了 |
| PR-3 | threads/projects/users/inspector/settings | 🟢 完 | 完了 |
| PR-4 | All | 🟢 完 | 完了 |
| PR-5 | All | ⏳ 保留 | T+28-30d |
| PR-6 | All | ⏳ 保留 | T+30d+ |
| PR-7 | All | ⏳ 保留 | T+30d+ |
| PR-8 | All | ⏳ 保留 | T+30d+ |
| PR-9 | All | ⏳ 保留 | T+30d+ |
