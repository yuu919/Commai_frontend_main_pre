# プランと請求（Frontend仕様・改訂版）

最新方針（Stripe Customer Portal への委譲）に基づき、本ページのフロント責務を最小化します。カード番号・請求先・請求履歴などの自前UIは撤廃し、Stripe 側へ遷移して管理します。

---

## ページ構成（/settings/billing）

### 画面内セクション（カード）

1. 現在のプラン（既存）
   - 表示: プラン名／更新周期（月/年）／次回請求日／ステータス（試用中/有効/停止予定）
   - アクション: ［アップグレード］、［プラン解約］
   - 備考: 日割り/次回適用の注記を表示

2. 請求の管理（ManageBillingCard）
   - 説明: 「支払い方法の追加・変更、請求先の編集、請求書の閲覧/ダウンロードはStripeのポータルで行います。」
   - ボタン: ［請求を管理する］
     - クリック時: `POST /api/billing/portal { returnPath: '/settings/billing' }`
     - レスポンス `{ url }` を `window.location.href = url` で遷移
     - ローディング中: disabled（文言「読み込み中…」など）
     - エラー時: トースト「ポータルを開けませんでした」
   - 備考（小）: 「請求履歴はポータル下部に表示されます。」

---

## モーダル / ドロワー

- プラン変更モーダル（2カラム比較）: 画面内で選択UIを提供。最終的な課金・変更は Stripe 側で完結。
- 解約モーダル（最小）: 「月末で解約」などの最小フロー。詳細なアンケート/即時停止は今後拡張。
- それ以外（カード追加/編集、請求先編集、請求書明細など）の自前モーダル/ドロワーは撤廃（Stripe Portal に委譲）。

---

## ルーティングとクエリ

- `?modal=upgrade|cancel`（最小）
- 旧: `addCard|editCard|invoice` などは削除

---

## A11y / UIポリシー

- ボタンは共通クラス（`.btn`, `.btn-lg`）を使用。高さは共通値で統一。
- トースト領域は `aria-live="polite"` を使用。
- テーマは既存のダーク系CSS変数に準拠（globals/settings.css）。

---

## API コントラクト（BFF）

- POST `/api/billing/portal`
  - Request: `{ returnPath: '/settings/billing' }`
  - Response: `{ url: string }`
  - BE（参考実装）:
    ```ts
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: origin + '/settings/billing',
    });
    return { url: session.url };
    ```

---

## 最小→拡張の優先度（改訂）

- v0（必須）
  - 現在のプラン（表示＋アップグレード/解約ボタン）
  - 請求の管理（Stripe Portal 遷移）
  - エラートースト（`aria-live="polite"`）

- v0.1（任意）
  - プラン比較モーダルのビジュアル精緻化
  - Portal 遷移前の軽量ガード（注意表示など）

- 将来（任意）
  - 利用状況メーター、クーポン等（基本は Portal で代替可能）

