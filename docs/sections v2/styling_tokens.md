## スタイリング/トークン v2（SSOT と移行）

- 命名/分類/追加手順/DoD は v1 を継承。
- 直 `color-mix()` は `styles/tokens.css` のみ許可。UI はトークン参照のみ。
- Stylelint と CI grep で違反を Fail。

補足（本リポジトリ決定事項）:
- `--surface-accent-soft` を tokens.css（light/dark）に追加し、Table の `highlight="accent"` が参照。
- `rgba()/hsla()` は原則禁止（`src/styles/` 配下を除く）。grep により CI Fail。


