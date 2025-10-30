## フロント移行ギャップ定義 v2（現状 vs 最終・実装ガイド）

### 前提（共通継承）
- 既存: Server/Client 分離・tokens.css・SSE 共通化の骨子は維持。
- 変更: Repository の配置と依存規律、tokens 直参照禁止の強化、`src/ui` 推奨。

---

## 1) Chat
- 配置: `features/chat/{components,hooks,api,types.ts}`
- SSE/Upload: `useChatController` に集約し、`lib/sse.ts`/`lib/uploads.ts` を利用。
- 受入: 送信/停止/再生成/添付/共有/思考可視化が安定。tokens 直参照ゼロ。

## 2) Threads/Projects
- 配置: `features/threads/*`, `features/projects/*`。DnD/改名/移動は controller へ。
- 受入: 一覧/詳細/移動が一貫し、SWR 再検証・楽観更新が安定。

## 3) Inspector/Evidence
- 配置: `features/inspector/{components,tabs,hooks,api}`。
- 受入: 全タブ表示・チャット連動・モック→実API切替が可能。

## 4) 認証
- 配置: `lib/server/auth.server.ts`/`lib/client/auth.client.ts`、将来 Auth0 切替。
- 受入: SSR ガード・ログイン/ログアウト/プロフィール取得。

## 5) a11y/ショートカット
- 配置: `lib/a11y.ts`/`lib/keyboard.ts`、UI 原子に標準挙動を実装。
- 受入: Modal/RowMenu のフォーカストラップ・主要ショートカットが機能。

## 6) スタイリング/トークン
- 配置: `styles/tokens.css`（SSOT）。
- 受入: tokens 直参照の撤去、UI 原子での variant 統一、ライト/ダーク AA 合格。

## 7) 通信/エラー/キャッシュ
- 配置: `lib/transport/fetcher.ts`（または `lib/fetcher.ts`）、`lib/error.ts`、SWR 設定は `app/providers.tsx`。
- 受入: エラーマトリクス準拠、SWR TTL/キー設計の標準化。

---

### 変更マッピング（抜粋）
- `lib/repositories/*` → `features/<domain>/api/repository.ts`
- `features/*/logic/*` → `features/<domain>/hooks/*`
- `components/ui/*` → `src/ui/*`（再エクスポートで互換可）
- `features/*` の tokens 直参照 → `src/ui/*` の variant 追加へ吸い上げ

### DoD（総合）
- 構造/依存規律・UI tokens・Repository 経由・SSE/Upload 規約が満たされること。


