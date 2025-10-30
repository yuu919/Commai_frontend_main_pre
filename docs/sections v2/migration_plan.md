## 移行計画 v2（v1 → v2 / 段階導入と廃止手順）

### 1) 方針
- v2 を正とし、v1 と矛盾しない共通部分は完全引継ぎ。矛盾点は v2 規約を優先。
- 依存規律と tokens/Repository の SSOT を CI/Lint で強制。
- **最小変更の原則**：各 PR は 1 つの関心事に集約し、CI グリーン保証。
- **戻り互換**: 削除フェーズまで暫定互換レイヤーを保持し、段階的置換。

### 2) ディレクトリ移行（全体図）
```
Before (v1)                    After (v2)
─────────────────────────────────────────────────────
src/components/ui/*      →    src/ui/*         (新規 + 原子実装)
                         ↓    src/components/ui/* (再エクスポ、暫定)
lib/repositories/*       →    features/<domain>/api/repository.ts
                         ↓    lib/repositories/* (re-export 橋渡し、暫定)
lib/transport/sse.ts     →    lib/sse.ts       (新規)
                         ↓    lib/transport/sse.ts (export * 互換)
lib/transport/fetcher    →    lib/error.ts に normalizeHttpError 移動
                         ↓    lib/transport/fetcher (import 切り替え)
docs/sections v1/        ↓    (deprecated banner 追加 → 削除)
docs/sections v2/        →    (新規 + 正式版)
```

### 3) Lint/CI の強化
- ESLint: `import/no-restricted-paths` で逆流依存禁止（`app → features → (ui|hooks|stores|api) → lib`）。
- grep: tokens 直参照の禁止（`ui/` と `styles/` 以外で `var(--` を検出したら fail）。
- Stylelint: `color-no-hex`, `color-no-rgba`, `color-no-hsla`, `function-disallowed-list: ["color-mix"]`（`styles/tokens.css` は除外）。

---

### 4) フェーズ別 PR 詳細＋タイムライン

#### **PR-1: UI レイヤー新設＋逆流 Lint**  
**タイムライン**: T+0d 〜 T+28d (Phase-A は即座, Phase-B/C は段階的)

| Phase | 作業 | コマンド例 | 詳細 |
|-------|------|----------|------|
| **Phase-A** | 新ディレクトリ + 互換レイヤー | `mkdir -p src/ui && cp src/components/ui/index.ts src/ui/index.ts` | `src/ui` 新規作成。内容は `components/ui` 再エクスポート。`tsconfig.json` に `@ui/*` 追加 |
| | ESLint ルール追加 (warn) | 編集: `eslint.config.mjs` | `import/no-restricted-paths` を追加し、severity は `warn` で開発ブロック回避 |
| | CI グリーン確認 | `pnpm lint && pnpm build` | 既存画面表示 OK, lint warning は許可 |
| **Phase-B** | import 一括置換 | `rg '@/components/ui' -l src \| xargs sed -i '' 's#@/components/ui#@/ui#g'` | 全 import を `@/components/ui` → `@/ui` に置換。Phase-A から +1〜2w |
| | ESLint 昇格 (error) | 編集: `eslint.config.mjs` rules に `error` 設定 | 以降は逆流インポートを厳格に禁止 |
| | `@/components/ui` 参照 0 件確認 | `rg '@/components/ui' src` | 0 件であることを CI で保証 |
| **Phase-C** | 互換削除 | `rm -rf src/components/ui && rm src/components/ui/index.ts` | 再エクスポート削除。`@/components/ui` import が 0 件な状態で実行 |
| | CI グリーン確認 | `pnpm lint && pnpm build` | 全機能 OK |

**PR-1 完了条件 (DoD)**:
- [x] `src/ui/` 作成・再エクスポート互換完備
- [x] `tsconfig.json` に `@ui/*` パス追加
- [x] ESLint `import/no-restricted-paths` ルール追加 (warn)
- [x] CI グリーン (lint/build)
- [x] 既存画面表示・機能 OK

---

#### **PR-2: tokens / Stylelint / policy 強化**  
**タイムライン**: T+0d 〜 T+7d (T+0d は PR-1 と並行可能)

| 項目 | 作業 | コマンド例 | 詳細 |
|------|------|----------|------|
| **Token 追加** | `--surface-accent-soft` 追加 | 編集: `styles/tokens.css` | light/dark 両方で定義。既存 Table highlight に対応 |
| | その他新トークン確認 | `grep 'color-mix' src/styles/tokens.css` | tokens.css のみに color-mix 許可 |
| **Stylelint 強化** | ルール追加 | 編集: `stylelint.config.cjs` | `color-no-hex: true`, `color-no-rgba: true`, `color-no-hsla: true`, `function-disallowed-list: ["color-mix"]` |
| | `ignoreFiles` 設定 | `"ignoreFiles": ["src/styles/tokens.css"]` | tokens 定義は除外 |
| **Policy grep 拡張** | rgba/hsla 検出 script | 編集: `package.json` scripts | `policy:rgba-ban`, `policy:hsla-ban`, `policy:check` を追加 |
| | Lint 実行 | `pnpm run policy:check && pnpm stylelint src/**/*.css` | 違反 0 件を確認 |
| **CI 統合** | GitHub Actions ステップ追加 | 編集: `.github/workflows/frontend.yml` または作成 | lint/stylelint/policy/build/test のステップを追加（test は `--if-present`） |
| | **test** step 追加 | `pnpm test --if-present` | テスト未実装時でも CI が通るように暫定対応 |

**PR-2 完了条件 (DoD)**:
- [x] `--surface-accent-soft` token 追加 (light/dark)
- [x] Stylelint ルール全追加・CI green
- [x] `npm run policy:check` green (rgba/hsla/hex 違反 0)
- [x] GitHub Actions workflow に stylelint/policy step 統合
- [x] 全 UI 表示・機能 OK

---

#### **PR-3: Repository 移設 (chat/threads/projects/settings/users/inspector)**  
**タイムライン**: T+7d 〜 T+21d

| Domain | Phase-A (新設) | Phase-B (橋渡し) | Phase-C (置換) | 詳細 |
|--------|---------------|-----------------|---------------|------|
| **chat** | `features/chat/api/repository.ts` + `.mock.ts` + `.server.ts` | `lib/repositories/messages/index.ts` を `export * from @/features/chat/api/repository` に | call-site import 置換 | 既に PR-3 α で完了 |
| **threads** | `features/threads/api/repository.ts` + `.mock.ts` + `.server.ts` | `lib/repositories/threads/index.ts` を `export *` に | call-site 置換 | 同上 |
| **projects** | `features/projects/api/repository.ts` + `.mock.ts` + `.server.ts` | `lib/repositories/projects/index.ts` を `export *` に | call-site 置換 | 同上 |
| **users** | `features/users/api/repository.ts` + `.mock.ts` + `.server.ts` | `lib/repositories/users/index.ts` を `export *` に | call-site 置換 | 新規: users リポジトリ |
| **inspector** (evidence) | `features/inspector/api/repository.ts` + `.mock.ts` + `.server.ts` | `lib/repositories/inspector/index.ts` を `export *` に | call-site 置換 | 新規: evidence リポジトリ |
| **settings** | `features/settings/api/{general.ts, billing.ts, roles.ts, ...}.ts` + `index.ts` | `lib/repositories/settings/` → 機能別 `export *` | call-site 置換 | 機能別分割: billing/roles/users-access/account など |

**Phase-A/B/C 詳細**:

**Phase-A**: Domain ごとに `features/<domain>/api/repository.ts` 新設
```bash
# chat の例
mkdir -p src/features/chat/api
cat << 'EOF' > src/features/chat/api/repository.ts
// 旧 lib/repositories/messages/index.ts 内容をコピー
import { createMockMessagesRepository } from './repository.mock';
import { createServerMessagesRepository } from './repository.server';
export type { MessagesRepository } from '@/features/chat/types';
export { createMockMessagesRepository, createServerMessagesRepository };
EOF
# .mock.ts, .server.ts も同様
```

**Phase-B**: re-export 橋渡しで暫定互換
```typescript
// lib/repositories/messages/index.ts
export * from '@/features/chat/api/repository';
```

**Phase-C**: call-site 一括置換
```bash
rg 'lib/repositories/(chat|threads|projects|users|inspector|settings)' -l src | \
  xargs sed -i '' -E 's#lib/repositories/(chat|threads|projects|users|inspector|settings)#features/\1/api/repository#g'
```

**providers.tsx 更新**:
```typescript
// 複数 Repository を新パスで注入
import { createMockMessagesRepository, createServerMessagesRepository } from '@/features/chat/api/repository';
import { createMockThreadsRepository, createServerThreadsRepository } from '@/features/threads/api/repository';
// ... 他 domains

const msgRepo = useMemo(
  () => (useMocks ? createMockMessagesRepository() : createServerMessagesRepository()),
  [useMocks]
);
// ... 同様に他 repos
```

**PR-3 完了条件 (DoD)**:
- [x] `features/<domain>/api/repository.ts` 全 domain 完成
- [x] `features/settings/api/{*.ts, index.ts}` 機能別分割完成
- [x] `lib/repositories/<domain>/index.ts` は re-export のみ (Phase-B)
- [x] call-site import 一括置換 (Phase-C)
- [x] `rg 'lib/repositories' src` → 0 件 (grep で CI 確認)
- [x] `providers.tsx` に全 Repository 新パスで注入
- [x] mock/server toggle 動作確認
- [x] 全 UI・API 動作 OK

---

#### **PR-4: SSE ファイル集約 + Error 移動**  
**タイムライン**: T+21d 〜 T+28d

| 作業 | Phase | コマンド例 | 詳細 |
|------|-------|----------|------|
| **SSE リネーム** | Phase-A | `cp lib/transport/sse.ts lib/sse.ts` | 新ファイル作成・内容コピー |
| | Phase-B | 編集: `lib/transport/sse.ts` を `export * from '../sse'` に | 暫定互換: 旧パスからも import 可能 |
| | Phase-C | `rg 'lib/transport/sse' -l src \| xargs sed -i '' 's#lib/transport/sse#lib/sse#g'` | 全 import を新パスへ置換 (T+28d 頃) |
| | 削除 | `rm lib/transport/sse.ts` | Phase-C から +1w 後に旧ファイル削除 |
| **Error 移動** | Phase-A | `cp lib/transport/fetcher.ts lib/error.ts` (部分) | `normalizeHttpError` 関数を `lib/error.ts` へ移動 |
| | Phase-B | 編集: `lib/transport/fetcher.ts` で `import { normalizeHttpError } from '../error'` | 呼び出し側を新パスへ |
| | Phase-C | `rg "from.*lib/transport/fetcher.*normalizeHttpError" -l src \| xargs sed -i '' "s#lib/transport/fetcher#lib/error#g"` | 全 import 置換 |

**PR-4 完了条件 (DoD)**:
- [x] `lib/sse.ts` 新設 (旧内容コピー)
- [x] `lib/transport/sse.ts` は `export *` 互換のみ (Phase-B)
- [x] `normalizeHttpError` を `lib/error.ts` へ移動
- [x] call-site import 置換完了 (Phase-C)
- [x] `rg 'lib/transport/sse' src` → 0 件
- [x] CI green (lint/build/test)

---

#### **PR-5: v1 ドキュメント・UI 完全削除**  
**タイムライン**: T+28d 〜 T+30d (Phase-C 後)

| 作業 | コマンド例 | 詳細 |
|------|----------|------|
| **v1 Deprecate banner** | 編集: `docs/sections v1/*.md` (各ファイル先頭) | "⚠️ このドキュメントは v2 に置き換わりました" バナーを追記 |
| **再エクスポ削除** | `rm src/components/ui/index.ts && rm -rf src/components/ui` | `@/components/ui` import 0 件確認後 |
| **v1 docs 削除** | `git rm -r docs/sections\ v1` | Deprecate 確認後の最終削除 |
| **CI 確認** | `pnpm lint && pnpm build && npm run policy:check` | 全項目 green |

**PR-5 完了条件 (DoD)**:
- [x] `src/components/ui` ディレクトリ削除
- [x] `docs/sections v1/` ディレクトリ削除
- [x] CI green (lint/build/policy/stylelint)
- [x] 全機能・画面表示 OK

---

### 5) 拡張・仕上げ (PR-6 以降)

**PR-6: UI & Hooks & LLM リソース整理**
*サブフェーズ PR-6a〜6c に分割*

**PR-6a: hooks レイヤー導入**
- `src/hooks/` ディレクトリ新設（UI 非依存の共通ロジック用）
- 既存 `lib/keyboard.ts` → `src/hooks/useKeyboardShortcuts.ts` へ移植
- SWR 汎用ヘルパ等を `src/hooks` に移動
- ESLint: `import/no-restricted-paths` ゾーンを `hooks` に追加 (features/ui からの参照のみ許可)

**PR-6b: features 内 hooks 統合**
- `features/*/logic` → `features/*/hooks` へ段階リネーム
- provider 依存を props/引数注入形式へ統一

**PR-6c: components/llm 移設**
- `src/components/llm/*` を `features/chat/components/llm/` へ移動（domain 属のため）
- UI 原子に該当する要素は `src/ui` へ分離、依存逆流禁止を遵守
- 旧パスからの暫定 re-export ファイルを置き、PR-7 で削除予定

---

**PR-7: Auth & SSR 強化**
- `lib/server/auth.server.ts` Cookie-to-Bearer 実装
- 開発用バイパス (`/__auth/on|off`) 本番無効化
- 503 自動再試行 (2s, factor 1.5, max 5) 実装

**PR-8: Share & 運用**
- `/share/{token}` 期限 Banner UI (near expiry/expired)
- 再取得ボタン・Workspace 限定ログイン導線
- Telemetry (`lib/telemetry.ts`) API/SSE/Upload 三系列ログ拡張

**PR-9: Cleanup & 最適化**
- `.eslintignore` → `eslint.config.mjs` ignores 移行
- `window.__messagesRepo` デバッグフラグ削除
- `lib/legacy/db.client.ts` 削除
- Zod 検証を repositories に段階追加

---

### 6) CI/環境設定

**GitHub Actions (`frontend.yml`)** 統合タスク (PR-2 で初検出):
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm stylelint src/**/*.css
      - run: npm run policy:check
      - run: pnpm build
      - run: pnpm test --run
```

**Mac (BSD sed) / Linux (GNU sed) 互換**:
- Docker dev container 使用 (`.devcontainer/Dockerfile` GNU sed 指定)
- CI は Linux (ubuntu-latest) で固定

---

### 7) DoD（全体完了定義）

**コード品質**:
- [ ] ESLint 逆流依存違反 0
- [ ] Stylelint (color/color-mix 関連) 違反 0
- [ ] `npm run policy:check` green (tokens/hex/rgba/hsla)
- [ ] TypeScript strict mode 型エラー 0
- [ ] `@/components/ui` / `lib/repositories` / `lib/transport/sse.ts` インポート 0 件

**CI/CD**:
- [ ] GitHub Actions (lint/build/test/policy/stylelint) green
- [ ] pnpm workspace cache 設定済み
- [ ] Deploy ready

**ドキュメント**:
- [ ] `docs/sections v2/` 全ファイル存在・完全
- [ ] `docs/sections v1/` 削除

**動作確認**:
- [ ] SSE ストリーム表示 OK
- [ ] Upload 進捗表示 OK
- [ ] Auth Guard / SSR 動作 OK
- [ ] Share リンク期限 Banner OK
- [ ] UI 全機能 (light/dark) 表示 OK
- [ ] Storybook/Chromatic 回帰なし（任意）


