import { redirect } from "next/navigation";
import { createThreadAction } from "./actions";

export default async function NewThreadPage() {
  try {
    const id = await createThreadAction({});
    redirect(`/threads/${id}`);
  } catch {
    // 暖機などの一時的失敗はユーザーに再読込を促す
    return (
      <div style={{ padding: 24 }}>
        <h2>スレッドの作成に失敗しました</h2>
        <p>バックエンドの起動を待機中です。数秒後に再読み込みしてください。</p>
      </div>
    );
  }
}
