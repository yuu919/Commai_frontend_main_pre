import React from "react";
import { apiGetShareInfoByToken } from "@/lib/api/share";
import { Card } from "@ui/Card";
import MutedText from "@ui/MutedText";
import Button from "@ui/Button";
import ViewportMinusHeader from "@ui/ViewportMinusHeader";

interface PageProps {
  params: Promise<{ token: string }>;
}

type ShareInfo = {
  visibility: "workspace" | "public" | string;
  chat_title?: string;
  message_count?: number;
  created_at?: string;
  expires_at?: string;
};

export default async function SharePage({ params: paramsPromise }: PageProps) {
  const { token } = await paramsPromise;
  const res = await apiGetShareInfoByToken(token);

  if (!res?.success || !res.data) {
    return (
      <ViewportMinusHeader className="flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <h1 className="text-lg font-semibold mb-2">共有リンクが無効です</h1>
          <MutedText className="text-sm">リンクの有効期限が切れているか、存在しない可能性があります。</MutedText>
        </Card>
      </ViewportMinusHeader>
    );
  }

  const { visibility, chat_title, message_count, created_at, expires_at } = res.data as ShareInfo;

  if (visibility === "workspace") {
    return (
      <ViewportMinusHeader className="flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <h1 className="text-lg font-semibold mb-2">この共有はワークスペース限定です</h1>
          <MutedText className="text-sm mb-3">閲覧にはログインが必要です。</MutedText>
          <div className="inline-block"><Button size="sm" asChild><a href="/login">ログインへ</a></Button></div>
          <div className="mt-3 text-xs">
            <MutedText level={50}>作成: {created_at ? new Date(created_at).toLocaleString() : "-"}</MutedText>
            {expires_at && <div><MutedText level={50}>期限: {new Date(expires_at).toLocaleString()}</MutedText></div>}
          </div>
        </Card>
      </ViewportMinusHeader>
    );
  }

  return (
    <ViewportMinusHeader className="flex items-center justify-center">
      <Card className="max-w-md w-full p-6">
        <h1 className="text-lg font-semibold mb-2">共有チャット</h1>
        <div className="text-sm">
          <div className="mb-1"><MutedText level={40}>タイトル:</MutedText> {chat_title ?? "(無題)"}</div>
          <div className="mb-3"><MutedText level={40}>メッセージ数:</MutedText> {typeof message_count === 'number' ? message_count : "-"}</div>
          <div className="text-xs">
            <MutedText level={50}>作成: {created_at ? new Date(created_at).toLocaleString() : "-"}</MutedText>
            {expires_at && <div><MutedText level={50}>期限: {new Date(expires_at).toLocaleString()}</MutedText></div>}
          </div>
        </div>
      </Card>
    </ViewportMinusHeader>
  );
}


