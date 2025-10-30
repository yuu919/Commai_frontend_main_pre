"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input, Button } from "@ui";
import { loginLegacy, verify2faLegacy, setToken, setRefreshToken } from "@/lib/client/auth.client";
import { useToast } from "@ui/Toast";
import { z } from "zod";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" aria-busy>Loading...</div>}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const search = useSearchParams();
  const next = search.get('next') || '/';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const { push } = useToast();

  const onLogin = async () => {
    try {
      const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
      schema.parse({ email, password });
      const res = await loginLegacy(email, password);
      if (res.requires_2fa) {
        setTempToken(res.temporary_token);
      } else {
        // クライアント保存（移行期間）+ サーバCookie（本番）を両対応
        setToken(res.access_token);
        if (res.refresh_token) setRefreshToken(res.refresh_token);
        try {
          await fetch("/api/session/set", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: res.access_token, refresh_token: res.refresh_token }) });
        } catch {}
        window.location.href = next;
      }
    } catch (e: any) {
      push({ message: e?.message || "ログインに失敗しました", variant: "error" });
    }
  };

  const onVerify = async () => {
    if (!tempToken) return;
    try {
      const schema = z.object({ code: z.string().min(6) });
      schema.parse({ code });
      const res = await verify2faLegacy(tempToken, code);
      setToken(res.access_token);
      if (res.refresh_token) setRefreshToken(res.refresh_token);
      try {
        await fetch("/api/session/set", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: res.access_token, refresh_token: res.refresh_token }) });
      } catch {}
      window.location.href = next;
    } catch (e: any) {
      push({ message: e?.message || "二段階認証に失敗しました", variant: "error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="p-4">
        <div className="text-lg font-semibold mb-3">ログイン</div>
        {!tempToken ? (
          <>
            <div className="space-y-2">
              <Input placeholder="メールアドレス" value={email} onChange={(e)=> setEmail(e.target.value)} />
              <Input placeholder="パスワード" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} />
            </div>
            <div className="mt-3">
              <Button onClick={onLogin}>ログイン</Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm mb-2">二段階認証コードを入力してください</div>
            <Input placeholder="認証コード" value={code} onChange={(e)=> setCode(e.target.value)} />
            <div className="mt-3">
              <Button onClick={onVerify}>認証</Button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}


