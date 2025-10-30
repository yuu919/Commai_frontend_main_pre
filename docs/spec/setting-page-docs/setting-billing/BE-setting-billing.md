### バックエンド引き継ぎ（/settings/billing — プラン・請求管理 最小構成）

- 前提（共通）
  - 認証: OIDC（Cookie/Bearer）。更新系は `Idempotency-Key` 必須、`x-audit-correlation-id` 付与。
  - エラー: RFC7807 互換（title/detail/status/type）。422 は入力不正、401/403 は権限系。
  - 監査: actor_id, action, resource(before/after), ts, ip, ua を記録。
  - レスポンスは JSON。タイムスタンプは ISO8601/UTC。

---

## 1) 現在のプラン（CurrentPlanCard）
- UI: プラン名／更新周期（月/年）／次回請求日／ステータス（trial/active/canceledAtPeriodEnd）
- 必要API
  - GET `/billing/current`
    - 200:
      ```json
      {
        "planName": "Pro",
        "period": "monthly",
        "nextBillingDate": "2025-10-01",
        "status": "active"  // trial | active | canceledAtPeriodEnd
      }
      ```
  - POST `/billing/plan/cancel`
    - headers: `Idempotency-Key`
    - 200: `{ "scheduledAtPeriodEnd": true }`
  - POST `/billing/plan/upgrade`
    - headers: `Idempotency-Key`
    - body: `{ "targetPlan": "plus" | "pro" }`
    - 200: `{ "ok": true }`
- 備考
  - 実課金/変更処理は Stripe 側に寄せる計画だが、解約スケジュールフラグやUI反映のためのメタ情報は返却が望ましい。

## 2) 請求の管理（ManageBillingCard）
- UI: 説明文＋［請求を管理する］ボタン（押下で Stripe Portal へ遷移）
- 必要API（BFF）
  - POST `/api/billing/portal`
    - Request: `{ "returnPath": "/settings/billing" }`
    - Response: `{ "url": "https://billing.stripe.com/..." }`
- BFF 実装（参考）
  ```ts
  // /api/billing/portal
  import { stripe } from "../clients/stripe";

  export async function POST(req: Request) {
    const { returnPath } = await req.json();
    const origin = new URL(req.url).origin;
    const stripeCustomerId = await resolveStripeCustomerIdFromSession();

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: origin + (returnPath || "/settings/billing"),
    });

    return Response.json({ url: session.url });
  }
  ```
- 備考
  - 将来、特定タブ（invoices 等）を初期表示したい場合は `flow_data` を活用。

---

## 非機能/共通仕様
- レート制限（推奨）: `/billing/plan/*` と `/api/billing/portal` に IP+actor ベースの制限
- 監査: 重要イベント（解約スケジュール設定/解除、Portal 起動）を記録
- 国際化: 現状 ja 固定。将来 en を想定する場合は `Accept-Language` を考慮

---

## FE からの呼び出しイベント（現在のUI実装と対応）
- CurrentPlanCard.onOpenUpgrade → （必要なら）`/billing/plan/upgrade`（または Portal 側遷移のみ）
- CurrentPlanCard.onOpenCancel → `/billing/plan/cancel`
- ManageBillingCard.openPortal → `/api/billing/portal`（戻り先は `/settings/billing`）

以上で、Stripe Portal を中心とした最小構成の BE 連携要件は満たせます。
