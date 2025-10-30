## 理想ディレクトリ構成（完成版）

モノレポの最終形（技術負債ゼロ運用）を以下に定義します。Legacy 構成は保持せず、本書を唯一の正とします。

```
backend/                 # FastAPI（HTTP API, SSE, ワーカー）
frontend/                # Next.js App Router（設定ページ含むUI一式）
docs/                    # 共通ドキュメント（本書・sections・api/openapi.yaml など）
.github/                 # CI（OpenAPI diff ほか）
scripts/                 # 補助スクリプト（マイグレーション/ビルド等）
```

---

### frontend/（Next.js App Router）

```
frontend/
  .env.example
  package.json
  next.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  public/
  src/
    app/
      layout.tsx
      page.tsx
      (app)/
        layout.tsx
        threads/
          [threadId]/page.tsx
        projects/page.tsx
      (settings)/
        settings/
          layout.tsx
          page.tsx
          account/page.tsx
          billing/page.tsx
          connections/page.tsx
          help/page.tsx
          contact/page.tsx
          roles/page.tsx
          run-logs/page.tsx
          users-access/
            page.tsx
            [platformId]/[storeId]/page.tsx
    components/
      ui/                # UI原子（tokens準拠・デフォルトエクスポート統一）
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
    features/
      shell/
      threads/
      chat/
      inspector/
      projects/
    lib/
      a11y.ts
      keyboard.ts
      error.ts
      api/               # HTTPクライアント（fetchラッパ）
      repositories/      # Repository Pattern（client/server/mock の実装を分離）
        settings.*.ts
    data/
      mock/
        permissions.ts
    styles/
      globals.css
      tokens.css
      settings.css
    types/
      roles.ts
      permissions.ts
      connections.ts
      run-logs.ts
      threads.ts
  tests/
  README.md
```

原則:
- UI は `repositories` にのみ依存（実API/モックの切替は `app/providers.tsx`）。
- CSS 値は全て `styles/tokens.css` の変数経由。UI 原子で hover/active/focus/disabled を標準化。
- Route Handlers/Server Actions は薄く（Cookie取扱やCSRF等が必要な箇所のみ）。

---

### backend/（FastAPI）

```
backend/
  pyproject.toml
  README.md
  app/
    main.py
    core/              # 設定/セキュリティ/依存の基盤
      config.py
      security.py
      settings.py
    api/
      deps/
      v1/
        routes/        # 機能別ルータ
          auth.py
          users.py
          roles.py
          connections.py
          run_logs.py
          billing.py
          contact.py
          help.py
          health.py
    services/          # ドメインロジック
      auth_service.py
      roles_service.py
      connections_service.py
      billing_service.py
      run_logs_service.py
      contact_service.py
    repositories/      # DBアクセス/外部I/F抽象
      users_repo.py
      roles_repo.py
      permissions_repo.py
      connections_repo.py
      run_logs_repo.py
    clients/           # 外部APIクライアント
      amazon/
        ads_client.py
        sales_client.py
      http/
        http_client.py
    models/            # SQLAlchemy モデル
      __init__.py
    schemas/           # Pydantic モデル
    db/
      session.py
      base.py
      migrations/      # Alembic
    telemetry/
      logging.py
      metrics.py
      tracing.py
    workers/
      tasks/
    webhooks/
      amazon.py
    middlewares/
    utils/
  tests/
    unit/
    integration/
    e2e/
  openapi.yaml         # 任意（自動生成/エクスポート）
```

原則:
- API 契約は `docs/api/openapi.yaml` を真実源とし、生成/エクスポートで同期（CI で差分検証）。
- ルータは機能単位で分割、サービス層にユースケース、リポジトリ層でデータアクセスを抽象化。
- 認証/認可・監査・レート制限は共通ミドルウェア/サービスで一元化。

---

### docs/

```
docs/
  main.md                 # インデックス（唯一の判断基準）
  sections/               # 方針/設計/運用/移行/エラー/モック/性能 等
  api/
    openapi.yaml          # API 契約（SoT）
  spec/
    main-page-docs/
    setting-page-docs/
  repo-business-overview/
```

---

この構成を完成版とし、以降は本ドキュメントの更新をもって構造変更の合意とする。
