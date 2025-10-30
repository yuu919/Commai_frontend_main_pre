# Settings Users-Access — Frontend Spec (Updated)

この文書は `/settings/users-access/[platformId]/[storeId]` の現行実装（フロント）の要件を記述します。以前の仕様（タブ/ドロワー/一括編集/CSV）は本バージョンでは撤去済みです（DEV-ONLYのモックは残存）。

## 1. 目的
- 左でスコープ（プラットフォーム/ストア）と簡易フィルタを選択し、右でユーザーのロール編集・招待・解除（このストアから外す）を行う。
- ページ離脱なし、App Router（Client Component）で完結。

## 2. ルート/状態
- ルート: `/settings/users-access/[platformId]/[storeId]`
- Shallow routing: 左ペインのスコープ操作で URL を更新（`router.push`）。
- クエリタブ/ドロワー/モーダルの深リンクは現状未使用。

## 3. レイアウト
- 2カラムグリッド: `368px 1fr`
  - 左: `LeftScopeBar`（フィルター）
  - 右: `RightWorkspace`（ヘッダー＋UserTable＋InviteModal）
- カード上端の揃え: 右カードに `alignSelf: start`、`.card + .card { margin-top }` は削除済み。

## 4. 左ペイン: LeftScopeBar（フィルター）
- プラットフォーム
  - 一覧（検索は廃止）。ボタンは**トグル式**：1回クリックで選択、2回で解除。複数選択可。
- ストア（プラットフォーム依存）
  - typeahead（`placeholder: "検索..."`）。星ボタンでお気に入りトグル。
  - 選択PFが**未選択なら全ストア**、PFが1つ以上選択されていれば**選択PFに属するストアだけ**を候補として表示。
  - ストアも**トグル式**で複数選択可。
- クイックフィルター（一覧に適用）
  - Roles（英ラベル）: Owner / Manager / General / None（内部値: 'owner'|'manager'|'general'|'none'）
    - グループ内は**OR**、未選択なら全通過。
  - Statuses（日本語表示）: 有効(active) / 招待中(invited) / 停止(suspended)
    - グループ内は**OR**、未選択なら全通過。
- 一括対象（プレース）: 全体/プラットフォーム/ストア（UIのみ、動作なし）

## 5. 右ペイン: RightWorkspace
### 5.1 ヘッダー
- パンくず: `<Platform> > <Store>`（日本語ラベル）
- 検索: メールアドレスの**完全一致**検索
  - `type="email"`、`placeholder="user1@example.com"`（サンプルをプレースホルダで表示）
  - 入力時に空白除去、`@` が無い場合はエラー表示（その間は検索無効）
- 招待ボタン: `.btn btn-lg`（紫）。クリックで `InviteUserModal` を開く。

### 5.2 UserTable
- 列: **Scope**｜名前｜メール｜ロール（Select）｜状態｜更新｜操作
  - Scope列: Storeは常時、Platformは**複数PF存在時のみ**表示（現在は自動的に非表示）。
- ロール Select（英ラベル）: Owner / Manager / General / None（内部値はRole型）
- 即時適用 + Undo（30秒）: 変更でフロント反映後、`POST /api/permissions/assign`。Undo クリックで元に戻す。
- 並び替え: ヘッダーアイコンでトグル（降順→昇順→解除）。名前列のみソートなし。
  - メール: localeCompare('ja', {sensitivity:'base'})
  - ロール: None < General < Manager < Owner（昇順）。降順は逆。
  - 状態: suspended < invited < active（昇順）。降順は逆。（表示は日本語）
  - 更新: 最古→最新（ISO/Date）。未定義は常に最後。
- **適用順序**: メール完全一致 → Roles（OR）→ Statuses（OR）→ ソート（ScopedビューではスコープORは適用しない）

### 5.3 InviteUserModal（ユーザー招待）
- 開閉: ヘッダーボタン → モーダル。送信/キャンセル/Esc で閉。
- 入力
  - メール（複数）: 改行/カンマ/空白区切り。重複/空行除去。最大20件。
  - 初期ロール: Select（Owner / Manager / General / None）。デフォルト General。
  - 適用スコープ: 表示のみ（Store ID）。
- 送信: `POST /api/permissions/invite`
  - 成功: モーダル閉→一覧再取得→トースト（ToastArea）
  - 422等: エラーメッセージ表示
- A11y: フォーカストラップ、初期フォーカスはメール入力、Esc 閉、背景スクロールロック。

### 5.4 削除（このストアからアクセスを外す）
- 行の「削除」→ **Confirmダイアログ**（キャンセル/削除）
- 送信: `DELETE /api/permissions/assign`（Body: `{ userId, subject:'store', subjectId: storeId }`）
- 成功後に一覧再取得

## 6. ロール/状態 定義
- Role（内部）: `'owner'|'manager'|'general'|'none'`
- ロール表示（英）: Owner / Manager / General / None
- 状態表示（日本語）: 有効(active) / 招待中(invited) / 停止(suspended)

## 7. API コール（フロント実装に準拠）
- GET `/api/db/permissions/users?platformId=...&storeId=...`
  - 現状: 一覧取得のみ（filters/sort はクエリで未送信）。
- POST `/api/permissions/assign`
  - Body: `{ userId, subject:'store', subjectId: storeId, role }`
- POST `/api/permissions/invite`
  - Body: `{ emails: string[], initialRole: Role, scope: { type:'store', id: storeId } }`
- DELETE `/api/permissions/assign`
  - Body: `{ userId, subject:'store', subjectId: storeId }`

## 8. スタイル/アクセシビリティ
- ボタン: `.btn`（標準）、`.btn-lg`（紫）高さ28px統一
- 入力: `.input`
- カード: `.card`
- アクセシビリティ: モーダルのフォーカストラップ、Esc 閉、`aria-live="polite"` のトースト

## 9. DEV-ONLY
- `mockPermissions` を使用したモックデータ。実API接続後は削除予定。
- 右ドロワー/一括編集/CSV/タブ（users/roles/connections）は現行スコープ外（撤去済み）。
