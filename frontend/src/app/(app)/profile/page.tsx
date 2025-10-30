"use client";
import React, { useEffect, useState } from "react";
import type { UserDetail } from "@/lib/db.types";
import { Input, Button, Surface } from "@ui";
import { getMyProfile, updateMyProfile, changePasswordLegacy, totpSetup, totpVerifySetup, totpStatus, totpDisable, regenerateBackupCodes } from "@/lib/client/auth.client";
import { useToast } from "@ui/Toast";
import { z } from "zod";

// UserDetail is centralized in lib/db.types.ts

export default function ProfilePage() {
  const { push } = useToast();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [totpInfo, setTotpInfo] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me: unknown = await getMyProfile();
        const u = (me && typeof me === "object") ? (me as UserDetail) : null;
        setProfile(u);
        setDisplayName(u?.profile?.display_name || "");
        const s: unknown = await totpStatus();
        const data = (s && typeof s === "object" && "data" in (s as Record<string, unknown>))
          ? (s as { data?: unknown }).data
          : s;
        setTotpInfo((data && typeof data === "object") ? (data as Record<string, unknown>) : {});
      } catch (e: unknown) {
        push({ message: e instanceof Error ? e.message : "プロフィールの取得に失敗しました", variant: "error" });
      }
    })();
  }, [push]);

  const onUpdateProfile = async () => {
    try {
      const schema = z.object({ displayName: z.string().min(1) });
      schema.parse({ displayName });
      await updateMyProfile({ display_name: displayName });
      push({ message: "プロフィールを更新しました", variant: "success" });
    } catch (e: any) {
      push({ message: e?.message || "更新に失敗しました", variant: "error" });
    }
  };

  const onChangePassword = async () => {
    try {
      const schema = z.object({ currentPw: z.string().min(6), newPw: z.string().min(8) });
      schema.parse({ currentPw, newPw });
      await changePasswordLegacy(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      push({ message: "パスワードを変更しました", variant: "success" });
    } catch (e: any) {
      push({ message: e?.message || "変更に失敗しました", variant: "error" });
    }
  };

  const onSetupTotp = async () => {
    try {
      const r: unknown = await totpSetup();
      const qrCode = (r && typeof r === "object" && "data" in (r as Record<string, unknown>))
        ? (
            (r as { data?: { qr_code?: unknown } }).data?.qr_code
          )
        : undefined;
      setQr(typeof qrCode === "string" ? qrCode : null);
      push({ message: "QRコードをスキャンし、コードで検証してください", variant: "info" });
    } catch (e: any) {
      push({ message: e?.message || "TOTP設定開始に失敗しました", variant: "error" });
    }
  };

  const onVerifyTotp = async () => {
    try {
      const schema = z.object({ totpCode: z.string().min(6) });
      schema.parse({ totpCode });
      await totpVerifySetup(totpCode);
      setQr(null);
      setTotpCode("");
      const s: unknown = await totpStatus();
      const data2 = (s && typeof s === "object" && "data" in (s as Record<string, unknown>))
        ? (s as { data?: unknown }).data
        : s;
      setTotpInfo((data2 && typeof data2 === "object") ? (data2 as Record<string, unknown>) : {});
      push({ message: "TOTPを有効化しました", variant: "success" });
    } catch (e: any) {
      push({ message: e?.message || "TOTP検証に失敗しました", variant: "error" });
    }
  };

  const onDisableTotp = async () => {
    try {
      await totpDisable();
      const s: unknown = await totpStatus();
      const data3 = (s && typeof s === "object" && "data" in (s as Record<string, unknown>))
        ? (s as { data?: unknown }).data
        : s;
      setTotpInfo((data3 && typeof data3 === "object") ? (data3 as Record<string, unknown>) : {});
      push({ message: "TOTPを無効化しました", variant: "success" });
    } catch (e: any) {
      push({ message: e?.message || "無効化に失敗しました", variant: "error" });
    }
  };

  const onRegenCodes = async () => {
    try {
      await regenerateBackupCodes();
      push({ message: "バックアップコードを再生成しました", variant: "success" });
    } catch (e: any) {
      push({ message: e?.message || "再生成に失敗しました", variant: "error" });
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="text-lg font-semibold mb-3">プロフィール</div>
      <div className="space-y-2">
        <Input placeholder="表示名" value={displayName} onChange={(e)=> setDisplayName(e.target.value)} />
        <Button onClick={onUpdateProfile}>更新</Button>
      </div>

      <div className="mt-6">
        <div className="font-semibold mb-2">パスワード変更</div>
        <div className="space-y-2">
          <Input placeholder="現在のパスワード" type="password" value={currentPw} onChange={(e)=> setCurrentPw(e.target.value)} />
          <Input placeholder="新しいパスワード" type="password" value={newPw} onChange={(e)=> setNewPw(e.target.value)} />
          <Button onClick={onChangePassword}>変更</Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="font-semibold mb-2">TOTP（二段階認証）</div>
        {!totpInfo?.totp_enabled ? (
          <div className="space-y-2">
            {!qr && <Button onClick={onSetupTotp}>設定を開始</Button>}
            {qr && (
              <div className="space-y-2">
                <Surface bordered radius="sm" className="inline-block p-2">
                  <img src={qr} alt="QR Code" />
                </Surface>
                <Input placeholder="認証コード" value={totpCode} onChange={(e)=> setTotpCode(e.target.value)} />
                <Button onClick={onVerifyTotp}>検証</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-x-2">
            <Button variant="ghost" onClick={onRegenCodes}>バックアップコード再生成</Button>
            <Button variant="ghost" onClick={onDisableTotp}>無効化</Button>
          </div>
        )}
      </div>
    </div>
  );
}


