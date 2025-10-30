"use client";

import React, { useMemo, useState } from "react";
import { Modal, Button, Input, MutedText, Select } from "@ui";
import { apiIssueShare, apiRevokeShare } from "@/lib/api/share";
import { useToast } from "@ui/Toast";
import { normalizeHttpError } from "@/lib/error";

export default function ShareModal({ open, url, onClose, threadId }: { open: boolean; url: string; onClose: () => void; threadId?: string }) {
  const { push } = useToast();
  const [visibility, setVisibility] = useState<"public" | "workspace">("public");
  const [hours, setHours] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const displayUrl = useMemo(() => shareUrl ?? url, [shareUrl, url]);

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="space-y-3 text-sm p-3">
        <div className="font-medium">共有</div>
        <div>このチャットへのリンクを共有できます。</div>

        <div>
          <label className="block text-xs mb-1"><MutedText level={40}>共有リンク</MutedText></label>
          <Input size="md" value={displayUrl} readOnly />
          {!shareUrl && (
            <div className="text-xs mt-1"><MutedText level={50}>まだ共有リンクは発行されていません。発行後にURLが表示されます。</MutedText></div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs"><MutedText level={40}>可視範囲</MutedText></label>
          <Select value={visibility} onChange={(e: any) => setVisibility(e.target.value as any)}>
            <option value="public">public（URLを知っていれば閲覧可）</option>
            <option value="workspace">workspace（閲覧ページで認証必須）</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs"><MutedText level={40}>有効期限（時間）</MutedText></label>
          <Input size="sm" type="number" placeholder="未設定" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        {error && <div className="text-xs"><MutedText variant="error">{error}</MutedText></div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>閉じる</Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(displayUrl);
                push({ message: "リンクをコピーしました", variant: "info" });
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                push({ message: normalizeHttpError(500, msg).message, variant: "error" });
              }
            }}
            disabled={!displayUrl}
          >
            コピー
          </Button>
          {threadId && (
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true); setError(null);
                try {
                  const expires_in_hours = hours.trim() ? Math.max(1, Number(hours)) : undefined;
                  const res = await apiIssueShare(threadId, { visibility, expires_in_hours });
                  setShareUrl(res.share_url);
                  push({ message: "共有リンクを発行/更新しました", variant: "success" });
                } catch (e) {
                  const msg = e instanceof Error ? e.message : String(e);
                  setError(normalizeHttpError(500, msg).message);
                  push({ message: normalizeHttpError(500, msg).message, variant: "error" });
                } finally { setBusy(false); }
              }}
            >発行/更新</Button>
          )}
          {threadId && (
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true); setError(null);
                try {
                  await apiRevokeShare(threadId);
                  setShareUrl(null);
                  push({ message: "共有リンクを失効しました", variant: "success" });
                } catch (e) {
                  const msg = e instanceof Error ? e.message : String(e);
                  setError(normalizeHttpError(500, msg).message);
                  push({ message: normalizeHttpError(500, msg).message, variant: "error" });
                } finally { setBusy(false); }
              }}
            >失効</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}


