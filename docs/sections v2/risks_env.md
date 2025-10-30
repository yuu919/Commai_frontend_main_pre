## 環境/リスク/ロールバック v2

- 起動: `pnpm dev/build/start`。`turbopack.root` 警告は `next.config.ts` で解消。
- CORS/503: モック時は Read 停止（SWR キー null）、実 API は `.env.local` を参照。
- ロールバック: UI → 器 → 中身の順で小さく戻す。SSE は controller に集約しておく。


