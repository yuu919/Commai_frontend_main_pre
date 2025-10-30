# Users & Access — Backend Handover (Current Frontend)

フロント現実装に合わせた BE 仕様（モック→本実装）。RFC7807 互換エラー、認可、監査ポリシーを前提とします。

## 前提・認可
- 認証: `Authorization: Bearer <token>`
- 権限: Owner/Manager 以上がロール変更/招待/解除を実行可能（要件に応じて調整）
- 監査: `actor_id, action, target(type/id), before/after, ts, ip, ua`
- 409/422 系のガードを返却（唯一の Owner ゼロ化、無効入力 等）

## ロール定義（現行）
- Role: `'owner'|'manager'|'general'|'none'`
- 表示ラベル（英）: Owner / Manager / General / None

---

## A) 左ペイン（LeftScopeBar）

### 1. プラットフォーム一覧
- GET `/api/permissions/platforms`
- 200:
```json
[{ "id":"amazon", "name":"Amazon", "connection":"ok" }]
```

### 2. ストア一覧（プラットフォーム別 + typeahead）
- GET `/api/permissions/stores?platformId=amazon&query=&limit=50`
- 200:
```json
[{ "id":"amz-jp-1","platformId":"amazon","name":"Amazon JP 1","region":"JP",
   "connection":"ok","sync":{"status":"done","at":"2025-09-12T10:00:00Z"}}]
```

備考: 左のロール/ステータスのクイックフィルタは現状FEで適用。将来的にBE適用する場合は以下のクエリ対応が望ましい：`roles=general,manager&statuses=active`。

---

## B) 右ペイン（RightWorkspace）

### 3. ユーザー割当の一覧
- GET `/api/db/permissions/users?platformId=amazon&storeId=amz-jp-1`
- 200:
```json
{
  "rows": [
    { "id":"u1","name":"User 1","email":"user1@example.com",
      "status":"active","role":"manager","updatedAt":"2025-09-18T12:00:00Z","updatedBy":"uOwner" }
  ]
}
```

オプションクエリ（将来対応）:
- `roles=owner,general`（OR）
- `statuses=active,invited`（OR）
- `sort=email:asc|updatedAt:desc`（ソート）

### 4. ロール変更（行内）
- POST `/api/permissions/assign`
- Request
```json
{ "userId":"u1","subject":"store","subjectId":"amz-jp-1","role":"manager" }
```
- 201/200（Idempotent）: OK
- 409 `{"code":"OWNER_REQUIRED"}`（唯一のOwner喪失 など）
- 備考: 現行は `subject:'platform'` を送信中。BE側で store 単位に揃えるか互換受容のどちらかを検討。

### 5. 招待（複数）
- POST `/api/permissions/invite`
- Request
```json
{ "emails":["a@ex.com","b@ex.com"],
  "initialRole":"general",
  "scope":{"type":"store","id":"amz-jp-1"} }
```
- 201:
```json
{ "created":[{"email":"a@ex.com","userId":"u100"}],
  "existing":[{"email":"b@ex.com","userId":"u2","note":"already_member"}] }
```
- バリデーション: 形式不正は 422（複数件エラーの配列を推奨）

### 6. 解除（このストアから外す）
- DELETE `/api/permissions/assign`
- Request
```json
{ "userId":"u1", "subject":"store", "subjectId":"amz-jp-1" }
```
- 200: `{ "ok": true }`

---

## C) 将来の拡張（オプション）
- クイックフィルタのBE適用: `GET /api/db/permissions/users?...&roles=general,manager&statuses=active`
- ソートのBE適用: `GET /api/db/permissions/users?...&sort=email:asc`
- ページング: `cursor/limit` 応答に `nextCursor` を含める
- 監査: `GET /api/audit?targetType=user&targetId=u1&scope=store:amz-jp-1&limit=10`

---

## エラーポリシー（共通）
- 400 validation / 401-403 auth / 404 not found / 409 guard / 5xx server
- 本文（RFC7807互換推奨）:
```json
{ "code":"OWNER_REQUIRED", "message":"At least one owner is required", "hint":"Assign another owner before downgrading." }
```

---

## 受け渡しメモ
- フロントは Role 定義（owner/manager/general/none）で統一済み。BE Enum と揃えてください。
- 既存モックは `src/app/api/permissions/*` にあり、BE接続後は削除予定。
- 送信先 `subject` の扱い（platform/store）は BE 側の意図に合わせて調整可能。フロントからは契約に追従します。
