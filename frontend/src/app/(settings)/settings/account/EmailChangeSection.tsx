"use client";
import { useState } from 'react';
import Button from '@ui/Button';
import Input from '@ui/Input';
import { useAccountRepo } from '@/app/providers';
import { useToast } from '@ui/Toast';
import MutedText from '@ui/MutedText';

type Props = {
  currentEmail: string;
  pendingEmail?: string | null;
  onSend: (newEmail: string) => void;
  onResend: () => void;
  onCancel: () => void;
};

export default function EmailChangeSection({ currentEmail, pendingEmail: initialPending, onSend, onResend, onCancel }: Props) {
  const accountRepo = useAccountRepo();
  const { push } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(initialPending ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const ok = /.+@.+\..+/.test(newEmail);
    if (!ok) { setError('メール形式が正しくありません'); return; }
    setError(null);
    try {
      await accountRepo.requestEmailChange({ newEmail });
      onSend(newEmail);
      setPendingEmail(newEmail);
      push({ message: '確認メールを送信しました', variant: 'info' });
    } catch (err) {
      push({ message: err instanceof Error ? err.message : String(err), variant: 'error' });
    }
  };

  const handleResend = async () => {
    try {
      await accountRepo.confirmEmailChange();
      onResend();
      push({ message: '確認メールを再送しました', variant: 'success' });
    } catch (err) {
      push({ message: err instanceof Error ? err.message : String(err), variant: 'error' });
    }
  };
  const handleCancel = async () => {
    try {
      await accountRepo.cancelEmailChange();
      onCancel();
      setPendingEmail(null);
      push({ message: '変更を取り消しました', variant: 'success' });
    } catch (err) {
      push({ message: err instanceof Error ? err.message : String(err), variant: 'error' });
    }
  };

  if (pendingEmail) {
    return (
      <div className="pending-banner" aria-live="polite">
        <MutedText style={{ fontSize: 13 }}>
          確認待ち: <span>{pendingEmail}</span> に確認メールを送信しました。
        </MutedText>
        <Button onClick={handleResend}>再送</Button>
        <Button onClick={handleCancel}>取消</Button>
      </div>
    );
  }

  return (
    <div className="email-grid">
      <div>
        <MutedText style={{ fontSize: 12, marginBottom: 4 }}>現在メール</MutedText>
        <div style={{ fontWeight: 600 }}>{currentEmail}</div>
      </div>
      <div>
        <MutedText style={{ fontSize: 12, marginBottom: 4 }}>新しいメールアドレス</MutedText>
        <Input
          type="email"
          value={newEmail}
          onChange={(e)=>setNewEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {error && <MutedText style={{ fontSize: 12, marginTop: 4 }} variant="error">{error}</MutedText>}
      </div>
      <Button className="btn-lg btn-send" onClick={handleSend} disabled={!/.+@.+\..+/.test(newEmail)}>確認メールを送信</Button>
    </div>
  );
}


