## Q&A v2（よくある質問）

Q1. `src/ui` 直置きは一般的か？
A. 問題なし。境界（ピュアUI）を強調でき、短い import（`@/ui/Button`）が利点。慣習を優先するなら `components/ui` を残し、再エクスポートで併存可。

Q2. なぜ Repository を feature 配下に？
A. ドメインの I/O 契約はドメインが所有するのが自然。型検証/正規化/例外の責務を局所化でき、変更が feature 内で完結する。

Q3. 共通 hooks を必須経由にしない理由は？
A. リアルタイム（SSE/楽観更新）で抽象の窮屈さが負債化しやすい。便利ツールとして提供しつつ、最短は `repository → controller`。

Q4. ストリーム状態はグローバル store に置かない？
A. 原則は feature内 controller。横断指標（ネットワーク健全性など）だけを最小限 store に昇格する。

Q5. tokens をページ/featureで直接使いたい時は？
A. 禁止。必要な表現は UI 原子の `variant/size` へ追加して吸い上げる。

Q6. v1 文書との違いは？
A. 構造と依存規律をより厳密にし、`src/ui` 推奨と Repository の配置を明確化。内容（tokens/SSR ガード/エラーマトリクス等）は継承。

Q7. どこから始めれば良い？
A. 依存規律の ESLint 導入 → tokens 直参照の CI ガード → Repository の再配置 → UI 原子の不足 variant 追加。

Q8. `color-mix()` や rgba/hsla、HEX は使えますか？
A. `color-mix()` は tokens.css のみ許可。HEX/rgba/hsla は禁止（Stylelint/grep で CI Fail）。

Q9. SSE のファイル位置は？
A. 最終は `lib/sse.ts` に集約。移行期間は `lib/transport/sse.ts` から再エクスポートで互換を維持。


