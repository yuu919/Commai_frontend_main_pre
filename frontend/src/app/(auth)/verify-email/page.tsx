"use client";
import React, { useState } from "react";
import { Input, Button } from "@ui";
import { verifyEmailLegacy } from "@/lib/client/auth.client";
import { useToast } from "@ui/Toast";
import { z } from "zod";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { push } = useToast();

  const onVerify = async () => {
    try {
      const schema = z.object({ email: z.string().email(), code: z.string().min(6) });
      schema.parse({ email, code });
      await verifyEmailLegacy(email, code);
      push({ message: "メール認証が完了しました。ログインしてください。", variant: "success" });
      window.location.href = "/login";
    } catch (e: any) {
      push({ message: e?.message || "認証に失敗しました", variant: "error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="p-4">
        <div className="text-lg font-semibold mb-3">メール認証</div>
        <div className="space-y-2">
          <Input placeholder="メールアドレス" value={email} onChange={(e)=> setEmail(e.target.value)} />
          <Input placeholder="認証コード" value={code} onChange={(e)=> setCode(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button onClick={onVerify}>認証する</Button>
        </div>
        </div>
      </div>
    </div>
  );
}


