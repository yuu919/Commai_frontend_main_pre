import type { MessagesRepository } from "@/features/chat/types";
import type { MessageRow as ChatMessage, ChatRole } from "@/lib/db.types";

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomLatency(): number {
  return 120 + Math.floor(Math.random() * 220);
}

// (Note) 以前の初期シードは未使用のため削除しました

export function createMockMessagesRepository(): MessagesRepository {
  const globalAny = globalThis as any;
  const STORE_KEY = "__mockMessagesStore";
  const store: Map<string, ChatMessage[]> = globalAny[STORE_KEY] ?? new Map<string, ChatMessage[]>();
  // In development, ensure edits to markdown immediately reflect by clearing cached store on module reload
  if (process.env.NODE_ENV === "development") {
    store.clear();
  }
  globalAny[STORE_KEY] = store;
  // Allow forcibly disabling chat demo seed independently from global mock usage
  const demoDisabled = typeof process !== "undefined" && process.env.NEXT_PUBLIC_CHAT_DEMO_DISABLE === "true";
  const demoMarkdown = !demoDisabled && (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEMO_MARKDOWN === "true");
  const sampleMd = "# 見出し H1\n本文の段落。デフォルト行間・サイズの確認用テキストです。\n\n## 見出し H2\n- 箇条書き 1\n- 箇条書き 2\n  - ネスト 2-1\n\n### 見出し H3\n1. 番号付き 1\n2. 番号付き 2\n\n#### 見出し H4\n強調: **太字** / *斜体* / \`インラインコード\`\n\n##### 見出し H5\n> 引用ブロックです。段落を挟んだ時の余白も確認。\n\n###### 見出し H6\n区切り線の確認↓\n\n---\n\nリンクの確認: [公式サイト](https://example.com)\n\nコードブロック（言語: ts）\n\n```ts\nexport function add(a: number, b: number) {\n  return a + b;\n}\n```\n\nテーブル\n\n| 列A | 列B | 列C |\n| --- | --- | --- |\n| 1   | A   | α   |\n| 2   | B   | β   |\n| 3   | C   | γ   |\n\nタスクリスト\n\n- [ ] 未完了タスク\n- [x] 完了タスク\n\n画像（代替テキストのみ。実画像は任意）\n![サンプル画像](https://via.placeholder.com/320x180.png)";

  function buildDemoMessages(): ChatMessage[] {
    const m = <T extends string>(role: ChatRole, content: T): ChatMessage => ({ id: crypto.randomUUID(), role, content });
    const mdCode = "コード(TypeScript):\n" +
      "```ts\n" +
      "export function add(a: number, b: number): number {\n" +
      "  return a + b;\n" +
      "}\n" +
      "console.log(add(2, 3));\n" +
      "```";
    const mdTable = "表(GFM):\n| 商品 | 価格 | 在庫 |\n|------|------|------|\n| A    | 100  | 5    |\n| B    | 200  | 0    |\n| C    | 150  | 9    |";
    const mdList = "利点:\n- シンプル\n- 早い\n- 拡張しやすい";
    const mdQuote = "> この行は引用です。";
    const mdLink = "[ドキュメント](https://example.com) と `インラインコード`";
    return [
      m("user", "ダミー会話を開始。要約してください。"),
      m("assistant", sampleMd),
      m("user", "コードのサンプルを示してください。"),
      m("assistant", mdCode),
      m("user", "データを表で出して。"),
      m("assistant", mdTable),
      m("user", "メリットを箇条書きで。"),
      m("assistant", mdList),
      m("user", "引用とリンクの例もください。"),
      m("assistant", `${mdQuote}\n\n${mdLink}`),
    ];
  }

  return {
    async list(threadId: string): Promise<ChatMessage[]> {
      await wait(randomLatency());
      // DEVでは常に最新のサンプルを返し、キャッシュに依存しない
      if (process.env.NODE_ENV === "development" && demoMarkdown) {
        const fresh = buildDemoMessages();
        store.set(threadId, fresh);
        return [...fresh];
      }
      const cached = store.get(threadId);
      if (cached) return [...cached];
      const init = demoMarkdown ? buildDemoMessages() : [];
      store.set(threadId, init);
      return [...init];
    },
    async create(threadId: string, message: { role: ChatRole; content: string }): Promise<ChatMessage> {
      await wait(randomLatency());
      const m: ChatMessage = { id: crypto.randomUUID(), role: message.role, content: String(message.content ?? "") };
      const messages = store.get(threadId) || [];
      store.set(threadId, [...messages, m]);
      return m;
    },
    async edit(threadId: string, messageId: string | number, content: string): Promise<ChatMessage> {
      await wait(randomLatency());
      const list = store.get(threadId) || [];
      const idx = list.findIndex(x => String(x.id) === String(messageId));
      if (idx === -1) throw new Error("not found");
      const updated: ChatMessage = { ...list[idx], content } as ChatMessage;
      list[idx] = updated;
      store.set(threadId, list);
      return updated;
    },
  };
}