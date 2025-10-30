## フロントエンド移管ドキュメント（完成版 / インデックス）

本ドキュメントは本移行の「唯一の判断基準」となるインデックスです。詳細は各セクションを参照し、重要変更は本書に要約を必ず反映します。

### 目次（sections/）
- 概要/構造/対応マッピング/ルーティング: [sections/overview.md](sections/overview.md)
- 統一ルール/設計原則（何を/なぜ/どう運用）: [sections/architecture_principles.md](sections/architecture_principles.md)
- デザイントークン/スタイル移行/Stylelint: [sections/styling_tokens.md](sections/styling_tokens.md)
- UIコンポーネント厳格ポリシー: [sections/ui-components-policy.md](sections/ui-components-policy.md)
- データ/通信/認証/Server Actions 境界: [sections/data_comm_auth.md](sections/data_comm_auth.md)
- 段階導入/タスク/チェックリスト/DoD: [sections/migration_plan.md](sections/migration_plan.md)
- 共有閲覧ルート仕様 `/share/{token}`: [sections/share_route_spec.md](sections/share_route_spec.md)
- 環境/ビルド と リスク/ロールバック: [sections/risks_env.md](sections/risks_env.md)
- ドキュメント分割ルール（維持管理）: [sections/documentation_rules.md](sections/documentation_rules.md)
 - 実装ギャップ定義（完全版）: [sections/implementation_gap.md](sections/implementation_gap.md)
- Next側での追加実装・差分: [sections/next_specific_implementations.md](sections/next_specific_implementations.md)

### ゴールと対象（要約）
- ゴール: 指定の最終ディレクトリ構造で、Next.js 15.5 + React 19 + Node 22 LTS + App Router（RSC/Server Actions）を採用したメインアプリ（LLMOpsは対象外）を稼働させる。
- 設定ページ群はフロントエンド（`frontend/`）へ統合済みで本書の対象に含まれる。バックエンド（FastAPI）は現行のまま利用（将来BFFへの移行余地は残す）。

## 技術スタックと前提（要約）
- Next.js: 15.5 系（App Router）
- React: 19 系
- Node.js: 22 LTS
- RSC/Server Actions: 導入（段階的）
- Tailwind CSS: 既存ユーティリティは併用しつつ、CSS カスタムプロパティ（トークン）へ段階置換
- バックエンド: FastAPI（/api, /api/db）を継続利用。SSE は当面クライアント直叩き
- 認証: まず Legacy（Auth0 は後段）

### フロント/バックエンドの切り分け方針（追記）
- 当面のUI開発では、フロントエンドはダミーデータ（モック）やServer Actionsを仮実装として利用して良い。ただし実運用時はバックエンドが同等のデータ契約で実APIを提供し、フロントは環境切替のみで接続先を変更する。
- 切替方式: リポジトリ抽象（Repository Pattern）を採用し、UIは抽象にのみ依存。実装は「実API版」と「モック版」を `app/providers.tsx` で注入切替する（例: `NEXT_PUBLIC_USE_MOCKS`）。
- 将来構成: フロントは `frontend/` 単体で自立運用し、バックエンドは別リポジトリ **backend/** で管理（HTTP 契約のみ）。契約は **OpenAPI 3.0** をソースオブトゥルースとし、ルート `docs/api/openapi.yaml` を参照、CI で契約差分（diff）をチェックする。

## 将来構成（フロント単体・バック独立）
- フロント（`frontend/`）: 静的/Edgeでホスティング。依存は HTTP 契約と OpenAPI のみ。
- バック（`backend/`）: FastAPI/SSE/ワーカーを含む。`/api` 配下に公開 API を集約し、認証・レート制御を一元化。
- 型/契約同期: `frontend/docs/api/openapi.yaml` と `backend/openapi.yaml` を CI で検証。

### OpenAPI 契約差分のCI検証
フロントとバックの契約整合性を自動で検証します。`commai-backend` の `openapi.yaml` と本リポの `docs/api/openapi.yaml` を比較し、破壊的変更があればビルドを失敗させます。

GitHub Actions（例）:

```yaml
name: openapi-diff
on:
  pull_request:
    branches: [ main ]
jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          path: frontend
      - name: Checkout backend repo
        uses: actions/checkout@v4
        with:
          repository: your-org/commai-backend
          ref: main
          path: backend
      - name: Run oasdiff (Docker)
        run: |
          docker run --rm \
            -v "$GITHUB_WORKSPACE:/work" \
            ghcr.io/tufin/oasdiff:latest \
            diff \
            --fail-on-breaking \
          /work/backend/openapi.yaml \
            /work/docs/api/openapi.yaml
```

運用ルール:
- 破壊的変更（必須フィールド追加、型変更、レスポンス縮退など）は PR で検出し、双方の合意なしにマージ不可。
- 非互換を避けるため、追加は後方互換（optional フィールド追加・新エンドポイント追加）を基本とする。

### 反復防止: モック運用ルール（要約）
- 切替は「Provider注入 + 環境変数」のみで行い、UI層に `if (mock)` の分岐を持ち込まない。
  - 例: `NEXT_PUBLIC_USE_MOCKS` → `app/providers.tsx` で `Repository` をモック/実装に差替。
- Read系はモック時に「SWRキー=null」でネットワークを停止する（CORSや503を回避）。
  - 例: `useSWR(mock ? null : ["projects"], fetcher)`、`useSWR(mock ? null : ["messages", id], fetcher)`
- SSRの存在確認（`serverFetchThreadExists` 等）はモック時にスキップして404を回避。
- Next 15の `params` は Promise 仕様。動的ルートでは必ず `const { threadId } = await params;` と書く。
- ポート/Origin整合: UI(3000)とAPI(8000)の分離を前提とし、モック時は実APIへの全呼出を停止することでCORSを発生させない。

## 最終ディレクトリ構造（要約）
```
src/
  app/
    layout.tsx
    page.tsx
    (app)/
      layout.tsx
      threads/
        [threadId]/
          page.tsx
          actions.ts
          schema.ts
    (settings)/ ...  # 本スコープ外

  features/
    shell/
      Header.tsx
      PlatformStorePicker.tsx
      ThreadsRail.tsx
      InspectorDock.tsx
    threads/
      ThreadItem.tsx
      ThreadsList.tsx
      ThreadsPanel.tsx
      HeaderShell.tsx
      AccountActions.tsx
      ProjectCreateLauncher.tsx
      ProjectCreateLauncherClient.tsx
      ThreadsControllerClient.tsx
      menus/
        ThreadsRowMenu.tsx
        MoveToProjectMenu.tsx
      dialogs/
        ConfirmDeleteDialog.tsx
      logic/
        useThreadsController.ts
      types.ts
      _examples/
    chat/
      MessageItem.tsx
      Timeline.tsx
      Composer.tsx
      logic/
        useChatController.ts
      types.ts
    inspector/
      InspectorHeader.tsx
      DocumentList.tsx
      panels/
        EvidencePanel.tsx
        KnowledgePanel.tsx
        VisualizePanel.tsx
      types.ts

  components/
    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      Textarea.tsx
      Badge.tsx
      Modal.tsx
      Card.tsx
      RowMenu.tsx
      FilterChip.tsx
      SortButton.tsx
      Toast.tsx
      index.ts

  styles/
    globals.css
    tokens.css
    settings.css  # 設定画面用

  lib/
    cx.ts
    keyboard.ts
    a11y.ts
    fetcher.ts

  types/
    roles.ts
    permissions.ts
    connections.ts
    run-logs.ts
    threads.ts

  data/
    mock/
      permissions.ts

  server/
    services/
      audit.ts
      connections.ts
      contact.ts
      me.ts
      permissions.ts
      roles.ts
      runLogs.ts
    repos/
    clients/
    telemetry/
    webhooks/
    workflows/
```

## 現行 → 最終の対応マッピング（要約）

### エントリ/枠
- `frontend/src/app/AppContainer.tsx` → `src/app/(app)/layout.tsx`（枠の責務を分離: Header + ThreadsRail | Chat | Inspector）
- `frontend/src/app/layout/MainLayout.tsx` → `features/shell/ThreadsRail.tsx`（左器）+ `features/shell/InspectorDock.tsx`（右器）+ `features/shell/Header.tsx`
- `frontend/src/main.tsx` / `index.html` → `src/app/layout.tsx`（html/lang/theme/body tokens）
- 既定リダイレクト: `src/app/page.tsx` は「新規作成→/threads/[id] へ redirect」

### Threads（旧 Sidebar/Projects/Chats 一体を再編）
- 一覧表示/行UI:
  - `features/sidebar/components/MainSidebar.tsx` の一覧UI → `features/threads/ThreadsList.tsx` + `ThreadItem.tsx`
  - 上部差込 → `features/threads/HeaderShell.tsx`
- 状態/操作:
  - `useProjectState`, `useChatState` 等の一覧/選択/移動/削除/改名を集約 → `features/threads/logic/useThreadsController.ts`
- メニュー/ダイアログ:
  - 行末メニュー → `features/threads/menus/ThreadsRowMenu.tsx`
  - MoveToProject → `features/threads/menus/MoveToProjectMenu.tsx`
  - 削除確認 → `features/threads/dialogs/ConfirmDeleteDialog.tsx`
- 型再整理:
  - `features/project/types/project.ts`, `features/chat/types/chatHistory.ts` の統合 → `features/threads/types.ts`
- （任意）RSC 薄皮 → `features/threads/ThreadsPanel.tsx`

### Chat（旧 ChatArea を水平分割）
- 表示（履歴）: `features/chat/components/ChatMessages.tsx` + `MessageItem.tsx` → `features/chat/Timeline.tsx` + `MessageItem.tsx`
- 入力: `features/chat/components/ChatInput.tsx` + `FileUploadDisplay.tsx` → `features/chat/Composer.tsx`
- ロジック集約: `useStreamingResponse.ts` + `useChatMessages.ts` → `features/chat/logic/useChatController.ts`（送信/停止/再生成/添付/保存/SSE 正規化）

### Inspector（Evidence を右ペインへ移設）
- 器（右ペイン）: `features/shell/InspectorDock.tsx`
- 中身（Evidence）: `features/inspector/panels/EvidencePanel.tsx`
- 上部（タブ/フィルタ）: `features/inspector/InspectorHeader.tsx`

### 共通/ユーティリティ
- API 叩きは当面 `lib/fetcher.ts`（内部で `/api`, `/api/db` をそのまま fetch）。Server Actions はミューテーションから段階導入
- UI 原子を `components/ui/*` へ抽出（Button/Input/...）し tokens を適用
- CSS トークン: `styles/tokens.css` を新設し `styles/globals.css` から取り込む

## ルーティング/情報設計（要約）
- 既定リダイレクト: `src/app/page.tsx` で「新規スレッド作成 → その `threadId` へ即 `redirect()`」
- `threadId` は現行チャットID（UUIDv7）を踏襲（Thread ≒ Chat で統一）
- プロジェクト専用 URL は作らない
  - 所属/移動/新規作成は Threads の行末メニューから完結
  - 所属は行バッジ/上部フィルタで表現
  - URL 空間は `/threads/[threadId]` へ一本化

## Threads と Projects の扱い（要約）
- Thread は単独チャット/プロジェクト配下チャットを包含する統一概念
- MoveToProject:
  - 候補: 全プロジェクト + 検索（タイプアヘッド）
  - 選択で即移動（UIは楽観更新）。メニュー内で「新規プロジェクト作成」→作成直後にそのまま移動まで完了
  - 一連の操作を一覧上で完結（別画面遷移なし）

## Chat（要約）
- Timeline: 初期から仮想スクロール採用（例: react-virtuoso）。SSE 増分にも強く、大量履歴で安定
- Composer: 最小機能で開始（送信/停止/添付）。将来は下書き保存/テンプレ/引用/ショートカット等を段階追加
- 送信/停止/添付/再生成/保存のロジックは `useChatController.ts` に集約。UI は薄い制御に留める

## スタイリング/トークン（要約）
- プレフィックス方針
  - ベース（セマンティック）: 接頭辞なし（`--bg`, `--fg`, `--border`, `--surface-*`）
  - 役割（ドメイン）: `--threads-*`, `--chat-*`, `--inspector-*`
  - 横断 UI（寸法/半径/陰影等）: `--ui-*`（例: `--ui-control-h-md`, `--ui-radius-sm`）
  - フレーム寸法のみ `--app-*`（必要時に限定）
- 分類の意味
  - layout: 寸法/余白（例: `--ui-control-h-md`, `--app-header-h`）
  - surface: 背景層（ベース/面レイヤ: `--surface-1/2`）
  - fg: 前景（本文/セカンダリ/ミュート）
  - border: 枠/区切り（濃淡の階調）
  - roles: 状態/意味・ドメイン強調（例: `--threads-accent`, `--chat-reply-bg`）
- 適用順序（破綻しない運用）
  1) UI 原子 → 2) 器（Header/ThreadsRail/InspectorDock）→ 3) 中身（threads/chat/inspector）
  4) ダーク/roles のコントラスト調整

## CSS移行ポリシー（要約）
- 現行CSSの扱い
  - 既存のグローバルCSSは `styles/legacy.css` に集約し、Next 側では一括 import のみに留める（新規のグローバル追加は禁止）
  - 既存の見た目は維持しつつ、以降の変更・追加は必ずトークン経由＋コンポーネント局所化で行う
- 新規実装ルール
  - 色/余白/影/境界/半径/高さなどのデザイン値はすべて `styles/tokens.css` の CSS変数（var(--token)）経由
  - Tailwind は `bg-[var(--surface-1)]` など var(--token) と併用（必要に応じて tailwind.config で bridge）
  - スタイルは UI原子または各コンポーネントのスコープ内（CSS Modules or Tailwind）。グローバル要素上書きは reset/typography 以外禁止
- 置換と整理（段階実施）
  - `styles/responsive-menu.css` の機能は Tailwind のレスポンシブユーティリティ or コンポーネント内スタイルへ移植
  - `!important` と深い子孫セレクタ（特異性の高いセレクタ）を撤廃し、役割クラス＋ユーティリティへ移行
  - ダークモードは `[data-theme='dark']` で tokens を切替（コンポーネント側は色値を持たない）
  - z-index / opacity / shadows などもトークン化（`--ui-shadow-*`, `--z-*` 等）し、magic number を排除
  - Stylelint を導入（recommended + a11y）し、違反を修正
  - Dead CSS スイープ（Coverage/Tailwind content scan）で未使用ルールを削除
- CSSのDefinition of Done
  - `!important` なし、深い子孫セレクタなし、reset/typography を除くグローバル要素上書きなし
  - 色/間隔/影/枠/半径/高さは全て tokens 由来（ハードコード禁止）
  - ダーク/ライト双方でコントラスト基準を満たす（本文/見出し/境界/ホバー/フォーカス/選択を実機確認）

## データ/通信/認証（要約）
- FastAPI を継続利用。`/api`（推論/SSE/モデル）, `/api/db`（チャット/プロジェクト/ユーザー）
- SSE: 当面クライアント直叩き（ヘッダー統一: Authorization/X-Workspace-ID を踏襲）
- 認証: Legacy を継続（Auth0 は後段）。Next のガードは Middleware もしくは page guard で追加
  - 現状の運用: `(app)/layout.tsx` のクライアント側ガードで未認証時は `/login` へ遷移（初回のServer描画は未保護）。
  - 中長期の方針: Middleware による SSR ガードへ格上げし、初回描画から保護する（導入時は `db.server.ts` でCookie → ヘッダー解決へ集約）。
- Server Actions: ミューテーション（create/rename/delete/move/markRead）から段階導入。Read は後段

## 段階導入（要約）
1) UI/枠/ルーティングの Next 化（Server Actions 未導入）
2) Threads/Chat/Inspector の中身を Next 側へ移植（fetch は `lib/fetcher.ts` 経由）
3) Server Actions をミューテーション系から導入（Zod で payload/params バリデーション、楽観更新）。共有リンク（発行/失効）は当面はクライアントfetchで運用し、Next移行安定後に Server Actions へ格上げする（既存API契約固定済みのため再配線は最小）。
4) 必要に応じて Read 系も BFF 化（キャッシュ/再検証戦略を設計）

### Server Actions 境界（共有 発行/失効・要約）
- 現状運用: フロント（Client Fetch）→ DB API（Bearer + `X-Workspace-ID`）。契約は固定済み（POST/DELETE `/api/db/chats/{chat_id}/share`）。
- 格上げ対象: 発行/失効（副作用 + 監査ログ + レート制御）。Server Actions へ移行することで SSR/RSC との一貫運用と秘匿Cookieの活用が可能。
- 格上げの判断材料（満たした時点で移行）
  - セッション管理を Next 側で統一できること（HttpOnly Cookie、`SameSite=Lax` 既定、必要時は CSRF 対策: ダブルサブミット/Origin検証）。
  - API ゲートの認可ロジックとサーバ上の `workspace_id/user_identifier` 解決が安定（ヘッダー抽出→Cookie抽出へ移行）
  - 監査ログ・レート制御（slowapi 相当）の Next 側実装/可観測性（構造化ログ・metrics）が用意できること。
- 運用指針
  - フェーズA（現状）: ヘッダー運用を継続（Bearer + `X-Workspace-ID`）。フロントは `lib/db.ts` のラッパを使用。BASE_URL はサーバ設定から付与される `share_url` をそのまま表示（フロントでの連結禁止）。
  - フェーズB（格上げ後）:
    - Next Server Action で発行/失効をラップし、HttpOnly Cookie から認証/ワークスペースを解決。
    - Zod で引数（`visibility`, `expires_in_hours`）を検証し、失敗時はUI一貫のエラー正規化で返却。
    - CSRF 対策が不要な同一オリジンPOSTのみ許容。クロスオリジンが必要な場合はヘッダー運用継続を選択。
    - API契約は維持（DB APIへの内部呼び出し）。クライアントは Server Action 経由でのみ実行（直叩きは閉じる）。
  - 注意: ヘッダー運用とCookie運用は混在させない。切替タイミングで `lib/auth.client.ts` / `lib/db.ts` を同時更新。


## 環境変数とビルド/起動（要約）
- 環境変数（例）
  - `NEXT_PUBLIC_API_URL`（旧 `VITE_API_URL`）
  - `NEXT_PUBLIC_DB_API_URL`（旧 `VITE_DB_API_URL`）
  - フィーチャーフラグは `NEXT_PUBLIC_FEATURE_FLAGS`（JSON）
  - サンプル: `frontend/.env.example` を `.env.local` にコピーし、環境に合わせて編集（本ファイルはリポに含める）
    - `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
    - `NEXT_PUBLIC_DB_API_URL=http://localhost:8000/api/db`
    - `NEXT_PUBLIC_FEATURE_FLAGS={"sse":true}`
- 代表コマンド（例）
```bash
pnpm install
pnpm dev      # next dev（ポートは環境に合わせる）
pnpm build
pnpm start
```

## タスクリスト（要約）
- リポ/環境
  - [ ] `frontend/` を作成（内部は最終 `src/` 構成で開始）
  - [ ] Next 15.5 + React 19 + Tailwind 導入、Node 22 LTS 想定
  - [ ] `.env` の `VITE_*` → `NEXT_PUBLIC_*` 置換（API/SSE URL）

- スタイル/トークン
  - [ ] `styles/tokens.css` 作成（light/dark の :root / [data-theme='dark']）
  - [ ] `styles/globals.css` に tokens を import
  - [ ] `components/ui/*` へ tokens 適用（Button/Input/Select/Textarea/Badge/Card/RowMenu/Modal/Toast）
  - [ ] 器（Header/ThreadsRail/InspectorDock）→ 中身（threads/chat/inspector）の順で適用
  - [ ] ダーク/roles のコントラスト調整

- UI 原子/ユーティリティ
  - [ ] `components/ui/index.ts` 整備
  - [ ] `lib/cx.ts`, `lib/keyboard.ts`, `lib/a11y.ts` 用意（必要時）

- シェル（器）
  - [ ] `features/shell/Header.tsx`
  - [ ] `features/shell/ThreadsRail.tsx`
  - [ ] `features/shell/InspectorDock.tsx`

## ドキュメントの役割（要約）
- 本書（main.md）: 本移行の目的・完了条件（DoD）・方針・最終ディレクトリ構造・段階導入・運用ガイドの「中核ドキュメント」。最新の計画と進捗判断は本書を第一の参照とする。
- implementation_gap.md: 既存SPA（frontend-original）とNext（frontend）の「現状 vs 理想」の詳細ギャップ、移行対象ファイルの対応先、受け入れ基準（DoD）を機能別に網羅した実装ガイド。タスク粒度での実装指針・受け入れ基準の参照元。
- 統合方針: 重要項目は本書に要約を取り込み、完全版は付録（本書末尾）として同梱する。implementation_gap.md も併存し、編集差分は両者を同期（本書側が優先）。

## 差分と補完タスク（要約）
- Chat（添付/共有/思考/スクロール）
  - 添付UI/ロジック（FileUploadDisplay/CompactFileList、useFileUpload、utils/fileUploadUtils）
  - 共有（ShareButton/ShareModal）、思考可視化（SimplifiedThinkingDisplay/ThinkingProcessDisplay）
  - スクロール制御（ScrollToBottomButton、useMessageScroll）
- Threads/Projects
  - サイドバー下部ナビ/アカウント（AccountMenu、WorkspaceBadge、ログアウト）
  - Projects UI（List/View/Chats/Header）と /projects ルート
- Evidence/Inspector
  - EvidencePanel の tabs/*, components/*、SourcesBlock、useEvidenceData/evidenceApi
    - 進捗: Evidence APIクライアント（byId/byMessage/byChat）と SWR フックを実装し、EvidencePanel を Flow（思考プロセス）単独で配線済み（loading/error/empty 対応）。Documents/Data/Code は未移管
  - SSEの evidence_id 連携による詳細表示
    - 進捗: SSE受信の evidence_id を EvidencePanel に連動（受信で自動フェッチ・Flowへリセット）
- 認証
  - Legacy/Auth0 の切替実装、2FA/TOTP/メール検証/プロフィール UI、API群
- 通信/エラー/Read最適化
  - グローバル通知（errorNormalizer 相当）
  - SWR再検証・Cache-Control チューニング、ReadのBFF化検討
  - 共有の可視範囲/期限/失効/閲覧ルート: 可視範囲は public/workspace を採用。workspace の場合は閲覧ページで認証必須。期限は時間指定（任意）で失効。閲覧ルートは `/share/{token}` に統一（バックエンドは `/api/db/shares/{token}` でメタ提供）。

### 共有閲覧ルート `/share/{token}` の表示仕様・ログ・期限UX
- 目的: 共有リンクの閲覧を単一路径に統一し、public/workspace で挙動を分岐。
- データ取得: RSC で `getShareInfoByToken(token)` を呼び、`visibility/chat_title/message_count/created_at/expires_at` を取得。
- 表示仕様
  - public:
    - 画面: タイトル、メッセージ件数、作成日時、（任意）期限日時を表示。
    - 操作: 「自分のチャットにインポート」（将来実装）ボタン表示。
    - 認証: 不要。
  - workspace:
    - 画面: 「ワークスペース限定です。閲覧にはログインが必要」メッセージのみ（タイトル等は非表示）。
    - 操作: ログイン導線（/login）。ログイン後は通常の権限判定で閲覧可否を決定。
    - 認証: 必須（トークンの存在確認はするが、内容メタは最小化）。
- 期限UX
  - 期限切れ（`expires_at < now`）: 404相当の画面（期限切れメッセージ＋ホームへ）を表示。リンクは無効。
  - 期限間近（例: 24h 未満）: バナーで警告（「まもなく期限切れ」）。再発行は発行者のみ可能（閲覧側は不可）。
- ログの扱い（最低限の監査）
  - 発行/失効: 既存どおり `user_security_logs` に `event_type=share_link_create|share_link_deactivate` を記録（`workspace_id/chat_id/token(一部)/ip/user_agent`）。
  - 閲覧（public）: 個人特定しない集計ログを想定（メトリクス/アクセス数）。PII不要。必要時のみIPを一時保持（ポリシー準拠）。
  - 閲覧（workspace）: 認証ユーザーの `user_identifier/workspace_id` を含めて `view` 系イベントを任意で記録可能。
  - いずれも、アプリのプライバシーポリシー/保持期間に従う。

- a11y/キーボード
  - Modal/RowMenu のフォーカストラップ、Esc/Enter/Arrow、ショートカット
- スタイリング/トークン
  - 既存CSSの tokens/Tailwind 置換（responsive-menu.css 等）。コントラスト最終調整
- Next設定/環境
  - `turbopack.root` 設定で lockfile 警告抑止
  - Docsに 503 リトライ/起動手順追記

### 実施ステップ（優先度順・合意）
1. Chat周辺UI（添付/共有/スクロール/思考可視化）
2. EvidencePanel配下のタブ/コンポーネント移植＋SSE証跡連動
3. サイドバー下部ナビ/アカウント導線復元（ログアウト含む）
4. Projects UI と `/projects` ルーティング
5. 認証差替（Legacy→Auth0切替を見据え抽象化）＋ガード
6. a11y/キーボード標準化（Modal/RowMenu/ショートカット）
7. Read最適化（SWR/Cache-Control）＋エラー通知統合
8. tokens微調整/コントラスト、responsiveメニューの置換
9. next.config.ts に `turbopack.root` 追加、Docs更新
10. 旧 `frontend/` 停止と命名統合

## 追加タスクリスト（統合版）
<!-- 完了タスクを [x] に変更）。 -->
- Chat
  - [x] 添付UI/ロジック（FileUploadDisplay/CompactFileList、useFileUpload、utils/fileUploadUtils）
  - [x] 共有UI（ShareButton/ShareModal）
  - [x] 思考可視化UI（SimplifiedThinkingDisplay/ThinkingProcessDisplay）
  - [x] スクロール制御（ScrollToBottomButton、useMessageScroll）
- Threads/Projects
  - [x] サイドバー下部ナビ/アカウント（AccountMenu、WorkspaceBadge、ログアウト）
  - [ ] Projects UI（List/View/Chats/Header）
  - [x] `/projects` ルーティング
- Evidence/Inspector
  - [x] Evidenceデータフック/api配線＋EvidencePanelのタブ/状態管理（loading/error/empty）
  - [x] SSE evidence_id 連動（受信→自動読み込み/タブリセット）
  - [ ] EvidencePanel components/Sources（詳細UIの実装とレイアウト仕上げ）
- 認証
  - [ ] Legacy/Auth0 切替、2FA/TOTP/メール検証/プロフィール UI/ API
- 通信/エラー/Read
  - [x] グローバル通知統合（errorNormalizer相当）
  - [x] SWR再検証・Cache-Control チューニング／Read BFF化検討
- a11y/キーボード
  - [ ] Modal/RowMenu フォーカストラップ/キー操作、ショートカット
- スタイリング
  - [ ] responsive-menu 等の tokens/Tailwind 置換、コントラスト最終調整
- 環境
  - [x] next.config.ts に `turbopack.root` 追加
  - [x] Docs に 503 リトライ/起動手順追記

## 実装同期チェックリスト（境界/契約/UI/ドキュメント）
- 境界/Providers
  - [x] `lib/db.server.ts` 導入と `threads/[threadId]/page.tsx` / `share/[token]/page.tsx` 差し替え（Server-safe）
  - [x] `app/providers.tsx` 新設（Client）＋ `app/layout.tsx` を純Server化
  - [x] `app/(app)/projects/page.tsx` を `ProjectsList.client.tsx` へ分離（Server/Client境界の明確化）
- SSE/アップロード/契約
  - [x] `useChatController.ts` 中断時の部分保存スコープ修正（ID置換/SWR再検証、トースト文言統一）
  - [x] `lib/uploads.ts` 契約修正（同期ヘッダー、`parseSseLines` 直import、`threadId` 明文化、型厳格）
  - [x] アップロードSSEの `onChunk`/`onProgress` を `createRafCoalescer` で節流
  - [ ] `Composer`→`uploadWithSse` に `threadId` を配線（呼び出し側の未配線）
- 共有機能
  - [x] `/share/[token]` を Server 安全fetchに統一（workspaceは最小情報表示）
  - [x] ShareModal の取得フロー簡素化（発行/失効を明示操作に限定、返却 `share_url` を表示）
  - [ ] 取得専用API（GET `/api/db/chats/{chat_id}/share`）のサーバ実装（任意だが推奨）
- UI/トークン
  - [x] UI原子（Select/Textarea/Modal/RowMenu/Badge/SortButton/FilterChip）で hover/active/focus/disabled をトークン準拠化
  - [ ] 残りUI（Card 等の細部）のトークン徹底（必要であれば適用）
- エラー/ドキュメント
  - [x] `normalizeHttpError` → `MESSAGES` 参照で文言統一（SWR onError / fetcher 共通）
  - [x] 認証ガード方針を本書へ追記（現状: クライアントガード、将来: Middleware SSR ガード）
  - [ ] Middleware によるSSRガード導入（実装）
- 型/契約の単一化
  - [ ] 共通型 `lib/db.types.ts` 作成と採用（`ChatRow/MessageRow/ProjectRow/Share*`）
  - [ ] 共有の Server Actions 格上げ（フェーズB：Cookieベース、Zod検証、CSRF方針）

---

## 付録A: 移行ギャップ定義（完全版 / implementation_gap.md の内容を同梱）

## フロント移行ギャップ定義（現状 vs 理想・実装ガイド）

本書は `frontend/`（Vite SPA）から `frontend/`（Next.js App Router）への完全移行に向け、現状と理想（`Transfer document/main.md`）の差異を機能別に明確化し、必要な実装内容・ファイル対応・受け入れ基準を定義する。

### 前提
- 既に実装済（要QA含む）: スレッド新規作成/遷移、スレッドCRUD（rename/delete/move）、Chat SSE（送信/停止/再生成/保存/タイトル生成）、Inspectorの骨子、UI原子（`components/ui/*`）、デザイントークン（`styles/tokens.css`）。
- 未完全: 既存SPAにある周辺UI/補助機能（添付、共有、思考可視化、エビデンスの全タブ群、アカウント/ログアウト、認証本実装、プロジェクトUI群、ファイルアップロード、a11y/キーボード、Read最適化 等）。

---

## 1) Chat（チャット）

### 1-1. 既存SPAにありNext側に未移植のUI/ロジック
- UIコンポーネント（frontend/src/features/chat/components）
  - ChatInput.tsx（高度な入力UI）
  - FileUploadDisplay.tsx / CompactFileList.tsx（添付表示/管理）
  - ScrollToBottomButton.tsx（スクロール制御）
  - ShareButton.tsx / ShareModal.tsx（共有導線）
  - SimplifiedThinkingDisplay.tsx / ThinkingProcessDisplay.tsx（思考可視化）
- フック/ユーティリティ
  - hooks: useFileUpload.ts / useMessageScroll.ts / useShareChat.ts / useTextInput.ts
  - utils: fileUploadUtils.ts
  - types: fileUpload.ts / thinkingProcess.ts

### 1-2. Next側の対応方針
- 配置先
  - UI: `frontend/src/features/chat/` 以下に新規作成（既存 `Composer/Timeline/MessageItem` と統合）
  - ロジック: 可能な限り `useChatController.ts` に集約し、周辺フックは `features/chat/hooks/` として分離
- SSEとの整合
  - 思考可視化（ThinkingDisplay）は `useChatController` のSSE受信型（thinking_statusなど）を増分対応
  - 共有（Share）連携時は `/api` 側の既存エンドポイントに合わせ、Server Actionの導入可否を検討
- 受け入れ基準（DoD）
  - 送信/停止/再生成に加え、添付の追加/プレビュー/削除が可能
  - 長尺履歴でスクロールが安定（下端ボタン/自動スクロール/フォーカス制御）
  - 共有モーダルが機能し、リンク生成/コピーが可能
  - 思考可視化の表示/非表示切替が可能

---

## 2) Threads/Projects（スレッド/プロジェクト）

### 2-1. 既存SPAにありNext側に未移植のUI/ロジック
- サイドバー下部のナビ/アカウント：
  - `features/auth/components/AccountMenu.tsx`, `common/components/WorkspaceBadge.tsx` ほか
- プロジェクトUI群：
  - `features/project/components/ProjectList.tsx / ProjectView.tsx / ProjectChatList.tsx / ProjectHeader.tsx`
  - `features/project/hooks/*`（useProjects/useProjectManagement 等）
- ルーティング：
  - Next側は `/projects` のページ未実装（`app/(app)/projects/actions.ts` は仮）

### 2-2. Next側の対応方針
- 配置先
  - `/projects` 配下ページ: `frontend/src/app/(app)/projects/page.tsx` ほか
  - コンポーネント: `frontend/src/features/projects/` を新設し既存機能を移植
- スレッドとの連携
  - `useThreadsController` と `useProjects`（SWR）を連携し、MoveToProject の動線統合
- 受け入れ基準（DoD）
  - プロジェクト一覧/詳細/所属チャット一覧が表示
  - スレッドのプロジェクト移動/解除/新規作成が一連で行える
  - サイドバー下部にアカウント/ログアウト/ワークスペース情報の導線

---

## 3) Evidence（エビデンス/インスペクタ）

### 3-1. 既存SPAにありNext側に未移植のUI/ロジック
- EvidencePanel配下（tabs/components）:
  - `features/evidence/components/EvidencePanel/tabs/*`（6ファイル）
  - `features/evidence/components/EvidencePanel/components/*`（複数）
  - `features/evidence/components/SourcesBlock.tsx`
- データ/フック/型
  - `features/evidence/api/evidenceApi.ts`
  - `features/evidence/hooks/useEvidenceData.ts`, `useChatMessages.ts`
  - `features/evidence/components/EvidencePanel/types.ts`, `features/evidence/types/evidence.ts`

### 3-2. Next側の対応方針
- 配置先
  - UI: `frontend/src/features/inspector/` にタブ/コンポーネントを移植
  - API/フック: `frontend/src/features/inspector/api|hooks` を新設
- SSE/証跡との統合
  - `useEvidence` と EvidencePanel を整理し、SSEの evidence_id 受信をトリガにロード/表示
- 受け入れ基準（DoD）
  - 既存の全タブが表示/切替可能、モック→実データへの差替え
  - Sourcesや詳細ビューがチャットと連動

---

## 4) 認証（Auth）

### 4-1. 既存SPAにありNext側に未移植のUI/ロジック
- コンテキスト/プロバイダ
  - `features/auth/contexts/AuthContext.tsx`, `LegacyAuthProvider.tsx`, `Auth0AuthProvider.tsx`
- UI/フロー
  - 2FA/TOTP/メール検証/プロフィール/パスワード再設定 などのコンポーネント群
- API群
  - `features/auth/api/*`（login/register/verify/totp 等）

### 4-2. Next側の対応方針
- 段階差替え
  - 現行のダミー `useAuth` を、Legacy→（後段で）Auth0 切替の実装へ置換
  - Server Action/Route Handler を最小限導入し、安全にセッションクッキー/トークンを扱う
- 受け入れ基準（DoD）
  - ログイン/ログアウト/プロフィール取得が安定
  - 2FA/TOTP/メール検証UXがSPAと同等
  - SSR/RSCでのガード（認証必須ページ）

---

## 5) ファイルアップロード

### 5-1. 既存SPAにありNext側に未移植のUI/ロジック
- API/ユーティリティ
  - `common/api/uploadsClient.ts`, `features/chat/utils/fileUploadUtils.ts`
- UI
  - `FileUploadDisplay.tsx`, `CompactFileList.tsx`
- フック
  - `hooks/useFileUpload.ts`

### 5-2. Next側の対応方針
- 配置先
  - API: `frontend/src/lib/uploads.ts`（または `features/chat/api`）
  - UI: `features/chat/` 配下に表示/管理コンポーネント
- 受け入れ基準（DoD）
  - 添付の追加/削除、アップロード進捗、送信時の紐付け

---

## 6) a11y / キーボード

### 6-1. 不足点
- Modal/RowMenu のフォーカストラップ、Esc/Enter/Arrow操作の標準化
- ショートカット（送信、停止、再生成、検索フォーカス 等）

### 6-2. 方針
- `frontend/src/lib/a11y.ts`, `lib/keyboard.ts` を実装（現状はスタブ）
- `components/ui/Modal.tsx`, `RowMenu.tsx` に共通のa11y振る舞いを導入

---

## 7) スタイリング/トークン整合

### 7-1. 不足点
- 既存SPAの `styles/index.css`, `responsive-menu.css` の細かい見た目を Next 側 tokens/Tailwind に置換未完

### 7-2. 方針
- 既存グローバルCSSは `styles/legacy.css` に集約し、段階的にtokensへ置換（`main.md` 方針に準拠）
- コントラスト/アクセント/余白を目視QAで詰める
  - `--accent` を tokens に追加し、focus/outline の一貫性を担保（light/darkでprimaryに追随）

---

## 8) 通信/エラー/Read最適化

### 8-1. 現状
- `lib/fetcher.ts` に `apiUrl`/`dbUrl`、SWR fetcherあり
- SSEは `useChatController` に集約、エラー正規化/タイトル自動更新/保存まで実装
- 503 warm-up 時のリトライ: `createThreadAction` に指数バックオフ導入

### 8-2. 未実装/改善
- `common/utils/errorNormalizer.ts` 相当のグローバル通知統合（Toast統合）
- Read BFF化: threads/messages/projects の再検証間隔/Cache-Control指針の明文化

### 8-3. 方針
- Toast通知の共通化（ToastProvider + SWR onError）、失敗リトライの閾値/UX定義
- SWRの `dedupingInterval=1000ms` / `revalidateOnFocus=true` を既定に設定。ミューテーション後は該当キーの `mutate()` を徹底

---

## 9) Next設定/環境

### 9-1. 警告抑止
- lockfile重複による `turbopack.root` 警告 → `next.config.ts` に `experimental.turbopack.root` を設定済み（解消）

### 9-2. 環境変数
- `.env.example` をリポに含め、`.env.local` へコピー（`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DB_API_URL`, `NEXT_PUBLIC_FEATURE_FLAGS`）
- ドキュメントに 503 リトライ/起動手順を明記

### 9-3. 認証UI導入
- `/login` を追加（Legacy Auth: username/password + 2FA モーダル）。成功時はトークン保存後に `/` へ遷移
- `(app)/layout.tsx` で未認証時は `/login` へガード（クライアント側ガード）。将来はMiddlewareに格上げ


---

## 10) 旧SPA機能 → Nextへの対応マッピング（抜粋）

- Chat components（frontend-original → frontend）
  - ChatInput.tsx → features/chat/ChatInput.tsx（新規）
  - FileUploadDisplay.tsx / CompactFileList.tsx → features/chat/File*（新規）
  - ScrollToBottomButton.tsx → features/chat/ScrollToBottomButton.tsx（新規）
  - ShareButton.tsx / ShareModal.tsx → features/chat/Share*（新規）
  - SimplifiedThinkingDisplay.tsx / ThinkingProcessDisplay.tsx → features/chat/Thinking*（新規）

- Threads/Projects
  - ProjectList.tsx / ProjectView.tsx / ProjectChatList.tsx / ProjectHeader.tsx → features/projects/*（新規）
  - /projects ルーティング → app/(app)/projects/page.tsx 他
  - AccountMenu.tsx / WorkspaceBadge.tsx → features/auth/components/* または shell 配下へ組込み

- Evidence
  - EvidencePanel/tabs/*, components/* → features/inspector/tabs|components/*（新規）
  - evidenceApi.ts / useEvidenceData.ts → features/inspector/api|hooks/*（新規）

- Auth
  - contexts/AuthContext/LegacyAuthProvider/Auth0AuthProvider → lib/auth + features/auth/contexts/*（Next向け再設計）
  - 2FA/TOTP/メール検証/プロフィール UI → features/auth/components/*（新規）

---

## 11) 実施ステップ（優先度順）
1. Chat周辺UI（添付/共有/スクロール/思考可視化）を段階実装
2. EvidencePanel配下のタブ/コンポーネントを移植、SSE証跡と連動
3. サイドバー下部ナビ/アカウント導線の復元、ログアウト実装
4. Projects UI（一覧/詳細/所属チャット）と `/projects` ルーティング導入
5. 認証差替（Legacy→Auth0切替を見据えた抽象化）、ガード導入
6. a11y/キーボード操作の標準化（Modal/RowMenu/ショートカット）
7. Read最適化（SWR/Cache-Control）、エラー通知の統合
8. tokens微調整/コントラスト最終調整、responsiveメニューの置換
9. next.config.ts に `turbopack.root` 追加、Docsに 503/起動/環境を追記
10. 旧 `frontend/` の停止と命名統合

---

## 12) 受け入れ基準（総合）
- 画面/操作はSPAと同等以上（添付/共有/思考表示/エビデンス全タブ/プロジェクト/アカウント/ログアウト）
- SSEストリーム、停止/再生成、証跡連動、メッセージ保存が安定
- 認証（Legacy/2FA/検証）とガードが機能
- a11y（フォーカストラップ/ショートカット）が実装
- Read再検証/キャッシュが安定
- tokens準拠、ダーク/ライトのコントラスト合格
- `frontend/` 単体で運用開始し、旧SPAを停止

- Threads（中身）
  - [ ] `features/threads/types.ts`（型の再整理）
  - [ ] `features/threads/logic/useThreadsController.ts`（一覧/activeId/rename/delete/move/検索/楽観更新）
  - [ ] `features/threads/ThreadsList.tsx`, `ThreadItem.tsx`, `HeaderShell.tsx`, `FooterShell.tsx`
  - [ ] `features/threads/menus/ThreadsRowMenu.tsx`, `menus/MoveToProjectMenu.tsx`, `dialogs/ConfirmDeleteDialog.tsx`
  - [ ] （任意）`features/threads/ThreadsPanel.tsx`

- Chat（中身）
  - [ ] `features/chat/Timeline.tsx`（仮想スクロール採用）
  - [ ] `features/chat/MessageItem.tsx`
  - [ ] `features/chat/Composer.tsx`（送信/停止/添付の最小）
  - [ ] `features/chat/logic/useChatController.ts`（SSE送信/中断/保存/再生成/添付）

- Inspector（中身）
  - [ ] `features/inspector/InspectorHeader.tsx`
  - [ ] `features/inspector/panels/EvidencePanel.tsx`（Evidenceのみ先行）

- App/ルーティング
  - [ ] `src/app/layout.tsx`（html/lang/theme/body tokens）
  - [ ] `src/app/page.tsx`（新規作成→redirect）
  - [ ] `src/app/(app)/layout.tsx`（枠の合成）
  - [ ] `src/app/(app)/threads/[threadId]/page.tsx`（Timeline/Composer 合成）
  - [ ] `src/app/(app)/threads/[threadId]/actions.ts`（create/rename/delete/move/markRead）
  - [ ] `src/app/(app)/threads/[threadId]/schema.ts`（Zod）

- API/BFF/通信
  - [ ] `lib/fetcher.ts`（共通フェッチラッパ）
  - [ ] Server Actions をミューテーションから導入
  - [ ] SSE は直叩きで安定化（タイムアウト/中断/再試行の確認）

- QA/回帰
  - [ ] 新規作成→redirect 動作
  - [ ] SSE ストリーム（増分/停止/再生成/保存）
  - [ ] rename/delete/move（楽観更新 + 失敗ロールバック）
  - [ ] プロジェクト検索/新規作成
  - [ ] Inspector 開閉/リサイズ、ダークモード
  - [ ] tokens 適用の視認性/コントラスト

- 切替/廃止
  - [ ] メイン導線完成後、旧実装を停止→アーカイブ
  - [ ] ルートは `frontend/`（フロント）と `backend/`（サーバ）および `docs/`（共通ドキュメント）の並列構成を恒久運用とする

## リスクとロールバック
- RSC/Server Actions の導入タイミングによるデバッグ負荷
  - 対策: UI/枠/中身の移植完了後、ミューテーションから段階導入
- スタイリング破綻（tokens 置換時）
  - 対策: UI 原子→器→中身の順。小さく適用し PR ごとに視覚確認
- SSE 安定性（ネットワーク/中断）
  - 対策: タイムアウト/Abort/リトライ戦略を `useChatController` に集約
- 互換/並行運用
  - 対策: `frontend/` と旧 SPA を当面併存。切替スイッチを用意し段階停止

## 完了条件（Definition of Done）
- 指定の最終ディレクトリ構造で Next アプリが稼働
- `/` → 新規作成 → `/threads/[threadId]` に即遷移
- Threads 一覧で rename/delete/move/新規作成が完結（プロジェクト検索/作成含む）
- Chat で SSE によるストリーミング、停止/再生成/保存が安定
- Inspector（Evidence）の表示/開閉/リサイズが機能
- tokens が UI 原子/器に適用され、ダーク/roles のコントラストが実機で合格
- 旧 `frontend/` を停止し、`frontend/` を最終命名へ統合（リポ直下 `src/`）


