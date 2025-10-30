"use client";
import React, { useState } from "react";
import { Input, Button } from "@ui";
import { registerLegacy, resendVerificationEmailLegacy } from "@/lib/client/auth.client";
import { useToast } from "@ui/Toast";
import { z } from "zod";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sent, setSent] = useState(false);
  const { push } = useToast();

  const onRegister = async () => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      });
      schema.parse({ email, password, firstName, lastName });
      await registerLegacy({ email, password, firstName, lastName });
      setSent(true);
      push({ message: "確認メールを送信しました。メールをご確認ください。", variant: "info" });
    } catch (e: any) {
      push({ message: e?.message || "登録に失敗しました", variant: "error" });
    }
  };

  const onResend = async () => {
    try {
      await resendVerificationEmailLegacy(email);
      push({ message: "確認メールを再送しました。", variant: "info" });
    } catch (e: any) {
      push({ message: e?.message || "再送に失敗しました", variant: "error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="p-4">
        <div className="text-lg font-semibold mb-3">アカウント登録</div>
        <div className="space-y-2">
          <Input placeholder="姓" value={lastName} onChange={(e)=> setLastName(e.target.value)} />
          <Input placeholder="名" value={firstName} onChange={(e)=> setFirstName(e.target.value)} />
          <Input placeholder="メールアドレス" value={email} onChange={(e)=> setEmail(e.target.value)} />
          <Input placeholder="パスワード" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={onRegister}>登録</Button>
          {sent && <Button variant="ghost" onClick={onResend}>再送</Button>}
        </div>
        </div>
      </div>
    </div>
  );
}


