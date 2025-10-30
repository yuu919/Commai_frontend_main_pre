パスワード変更
現在のパスワード / 新パスワード / 確認
パスワード要件表示（長さ・文字種）
変更ボタン（成功トースト）
直近15分再認証済みでない場合は再認証モーダル（パスワード入力）
二段階認証（Email OTP）
トグル：未設定 → 有効化
有効化フロー：
説明文（メールに6桁コード送信）
コード入力（6桁）→ 確定
無効化（再認証モーダル必須）
表示：現在のメール宛に送る旨の注意
メールアドレス変更
現在メールの表示
新メール入力 → 確認メール送信
「確認待ち」バナー（再送 / 取消）
完了時：旧メールにも通知
再認証モーダル（共通）
パスワード入力（必要時のみ）
失敗回数に応じた簡易レート制限


了解。添付の画面イメージを前提に、**v0のみ**（最小実装）で動くように、コンポーネント単位で要件定義します。
対象機能は：①パスワード変更 ②二段階認証（メールOTPのみ） ③メールアドレス変更（任意） ④再認証モーダル（共通）。

---

# 画面: `/settings/security`（ログイン設定 v0）

## ページ構成（レイアウト）

```
<LoginSecurityPage>
  <SectionCard title="プロフィール">
    <ProfileSummary />              // 表示のみ（名前/メール/パスワードマスク）
    <PasswordChangeButton />        // 押下で <PasswordChangeModal />
  </SectionCard>

  <SectionCard title="2段階認証の設定">
    <TwoFactorEmailToggle />        // 無効/メール ラジオ + 説明 + [設定]ボタン
    <TwoFactorEmailVerifyModal />   // 有効化時の6桁入力
  </SectionCard>

  <EmailChangeSection />            // 任意。v0で入れる場合のみ表示
  <ReauthDialog />                  // 高リスク操作時のみ表示（グローバル）
  <ToastArea />                     // 成功/失敗トースト
</LoginSecurityPage>
```

---

## 共通コンポーネント

### `<SectionCard>`

* **Props**: `title: string`
* **Slots**: 本文コンテンツ
* **要件**: 角丸カード / 見出し / 内側余白16px

### `<ReauthDialog>`

* **表示条件**: パスワード変更・2FA無効化・メール変更確定時に**直近15分再認証が無い場合のみ**
* **UI**: パスワード入力1項目 + \[確認] \[キャンセル]
* **イベント**:

  * `onConfirmed(reAuthToken)` / `onCanceled()`
* **バリデーション**: 未入力/誤り→文言は汎用（「認証に失敗しました」）
* **API**: `POST /auth/reauth { password }` → `reAuthToken`
* **DoD**: 成功で元操作に復帰。失敗5回で30秒クールダウン。

### `<ToastArea>`

* 成功例：「正常に保存されました」「2段階認証を有効化しました」
* 失敗例：「処理に失敗しました。しばらくしてから再度お試しください」

---

## 1) プロフィール

### `<ProfileSummary>`

* **表示**:

  * 名前（表示のみ）
  * メールアドレス（表示のみ）
  * パスワード（`************`）＋右に `<PasswordChangeButton/>`
* **アクセシビリティ**: ラベル/値の読み上げ

### `<PasswordChangeButton>` → `<PasswordChangeModal>`

* **モーダル項目**:

  * 現在のパスワード（必須）
  * 新しいパスワード（必須）
  * 新しいパスワード（確認）（必須、一致チェック）
* **パスワード要件**: 8文字以上 / 大文字小文字数字のうち2種以上（v0簡易）
* **フロー**:

  1. 押下 → `ReauthDialog` 必要なら起動
  2. 入力→`POST /auth/password/update { current, next }`
  3. 成功→モーダル閉じる＋成功トースト
* **オプション（v0内 任意）**: 「他の端末からサインアウト」チェック（既定OFF）
* **エラー**: 文言は汎用（「変更できませんでした」）、具体原因は表示しない
* **DoD**: 新PWで再ログイン可能 / 旧PW不可

---

## 2) 二段階認証（メールOTP）

### `<TwoFactorEmailToggle>`

* **UI**:

  * ラジオ：①無効にする ②メール
  * 右側に説明文（ログイン時にメール6桁コードを要求）
  * \[設定] ボタン
  * ステータスラベル：`有効`/`無効`（色分け）
* **状態**:

  * `status: 'enabled' | 'disabled' | 'pending'`
  * `selected: 'disabled' | 'email'`
* **フロー**:

  * **有効化**（無効→メールを選択→\[設定]）

    1. `POST /auth/2fa/email/enable`（コード送信）
    2. `<TwoFactorEmailVerifyModal>` を表示
  * **無効化**（有効→無効にする→\[設定]）

    1. `ReauthDialog` 必要なら起動
    2. `POST /auth/2fa/email/disable` → 成功トースト
* **DoD**: 有効化後の次回ログインでメールOTP入力が必須

### `<TwoFactorEmailVerifyModal>`

* **モーダル項目**: 6桁コード（数値のみ / 自動フォーカス / ペースト対応）
* **操作**: \[確認] \[再送（60秒後）] \[キャンセル]
* **API**: `POST /auth/2fa/email/verify { code }`
* **バリデーション**: 6桁固定 / 5回失敗でクールダウン
* **成功**: モーダル閉 / ステータス`enabled` / 成功トースト
* **失敗**: モーダル内エラー表示（「コードが無効です」）
* **DoD**: 再送間隔・有効期限（5分）を超えた場合は再度 enable からやり直し

---

## 3) メールアドレス変更（任意）

### `<EmailChangeSection>`

* **UI**:

  * 現在メール（表示のみ）
  * 新メール入力 + \[確認メールを送信]
  * 「確認待ち」バナー（再送/取り消し）
* **フロー**:

  1. \[確認メールを送信] → `POST /account/email/change { newEmail }`
  2. ユーザーがメール内リンク押下 → `POST /account/email/confirm { token }`
  3. 完了→旧メールにも通知 / 画面は次ロードで反映
* **バリデーション**: メール形式 / 現メールと同一不可
* **DoD**: 未確認の保留アドレスがある場合、再送/取消が動く

---

## イベント & API まとめ（v0）

* `POST /auth/reauth { password }` → `200 { token }`
* `POST /auth/password/update { current, next }`
* `POST /auth/2fa/email/enable`            // コード送信
* `POST /auth/2fa/email/verify { code }`
* `POST /auth/2fa/email/disable`
* `POST /account/email/change { newEmail }`
* `POST /account/email/confirm { token }`

**HTTPエラー処理**: 4xx/5xxともに画面は汎用メッセージ＋再試行導線。
**CSRF**: 変更系はCSRF対策必須。
**監査ログ**: 誰が/いつ/何を（サーバ側記録）。

---

## アクセシビリティ / i18n

* すべての入力は`label for`/`aria-invalid`を実装
* ラジオはグループラベル「二段階認証方式」
* トーストは`aria-live="polite"`
* 文言は辞書化（JA/EN）

---

## 受け入れ基準（DoD）要約

* パスワード変更が成功し、旧パスワードではログイン不可になる
* 2FA（メール）が有効化され、**次回ログイン時**にメールコードが必須になる
* 2FA無効化は再認証が無いとできない
* メール変更は確認リンクでのみ確定する（旧メールにも通知）
* 重要操作時のみ再認証が発火し、成功/失敗の分岐が正しく動く
* すべての操作で成功/失敗トーストが表示される

---

これが **v0の実装上限**でのコンポーネント別要件定義です。
このままチケット化（各コンポーネント＝1チケット）→API結合→文言/i18n→リリースの順で進められます。


結論：**v0は1ページ内で完結できます。**
設定はすべて「同一ページ＋必要なポップアップ（モーダル）」で処理し、ページ遷移は不要です。メール内リンクの確認だけは外部→同ページに戻す形（URLパラメータ）で完結できます。

---

# 1ページ完結の設計

## ページ構成（固定）

* **/settings/security**（1ページのみ）

  * セクションカード3つ

    1. プロフィール（表示＆「パスワード変更」ボタン）
    2. 2段階認証（メールOTP）ラジオ＋［設定］
    3. メールアドレス変更（任意）
  * トースト領域（成功/失敗）
  * 画面下部でグローバル状態（ロード中/エラー）を処理

## 使うポップアップ（モーダル一覧）

1. **ReauthDialog**（再認証）

   * 起動条件：パスワード変更送信・2FA無効化・メール変更確定など高リスク操作前
   * 入力：現在のパスワード
   * 成否で元処理に復帰／中断

2. **PasswordChangeModal**（パスワード変更）

   * 起動：プロフィールの「パスワード（変更）」
   * 入力：現在／新規／確認
   * 成功後：モーダル閉→成功トースト

3. **TwoFactorEmailVerifyModal**（2FA有効化の6桁コード確認）

   * 起動：2FAで「メール」を選択→［設定］→コード送信成功時
   * 入力：6桁コード・再送（60秒後可）
   * 成功後：status=有効に更新→成功トースト

4. **EmailChangePendingModal（任意）**

   * 起動：新メール送信後に「確認待ち」の詳細を見たい場合
   * 内容：宛先表示／再送／取り消し

> 以上で**ページ遷移なし**に全操作が完了します。

---

# URLと深いリンク（離脱しない工夫）

* **メール確認リンク**は `/settings/security?confirmEmail=token` にリダイレクト

  * ページ読み込み時に `confirmEmail` を検知→即API→トースト→UI更新
  * ユーザーは**同じページに留まる**（成功メッセージだけ表示）

* モーダルを直接開くためのクエリ（便利）

  * `?modal=password` / `?modal=2faVerify` など
  * リロードしても同じ状態を再現可（履歴にも優しい）

---

# 画面内インライン表示（モーダルにしないもの）

* 2FAの現在ステータス（有効/無効）バッジ
* メール変更の「確認待ち」バナー（再送/取消ボタン付き）
* 成功/失敗トースト（`aria-live="polite"`）

---

# 状態マシン（ざっくり）

* **2FA**: `disabled → enabling(codeSent) → enabled`

  * 無効化：`enabled → (reauth) → disabled`
* **Password**: `idle → (reauth?) → updating → success|error`
* **EmailChange**: `idle → pending(confirm) → confirmed|canceled`

---

# エッジケース処理

* **再認証が古い**：ReauthDialogを自動で出す→成功したら元操作を再実行
* **OTP連続失敗**：モーダル内に「一定時間後に再試行」表示（クールダウン）
* **通信失敗**：汎用エラー＋再試行、詳細は出さない（セキュリティ配慮）
* **アクセシビリティ**：モーダルはフォーカストラップ／Esc閉じ、フォームは`label for`/`aria-invalid`

---

# コンポーネントまとめ（v0最小）

* Page: `<LoginSecurityPage />`
* Cards: `<SectionCard />`
* Profile: `<ProfileSummary />`, `<PasswordChangeButton />`, `<PasswordChangeModal />`
* 2FA(Email): `<TwoFactorEmailToggle />`, `<TwoFactorEmailVerifyModal />`
* Email change: `<EmailChangeSection />`（任意）、`<EmailChangePendingBanner />`（任意）
* Global: `<ReauthDialog />`, `<ToastArea />`

---

# できないこと（v0範囲外）

* TOTP/Passkey/SSO／セッション一覧・履歴（v0.1以降）
* 2FAログインフロー（これは**次回ログイン時**の別ページだが、**設定編集自体は本ページで完結**）

---

## まとめ

* **ページは1枚でOK**。
* **必須のやり取りはモーダル**で完了。
* メール確認も**同ページに戻して自動処理**できる設計。
  これで「離れたくない」「ページを増やしたくない」を満たしつつ、v0要件を全部カバーできます。
