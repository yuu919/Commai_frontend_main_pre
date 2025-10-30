"use client";
import { useState } from 'react';
import ProfileSummary from './ProfileSummary';
import PasswordChangeModal from './PasswordChangeModal';
import TwoFactorEmailToggle from './TwoFactorEmailToggle';
import TwoFactorEmailVerifyModal from './TwoFactorEmailVerifyModal';
import EmailChangeSection from './EmailChangeSection';
import { useAccountRepo } from '@/app/providers';
import { useToast } from '@ui/Toast';
import Divider from '@ui/Divider';

export default function AccountSettingsPage() {
  const accountRepo = useAccountRepo();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [twofaSelected, setTwofaSelected] = useState<'disabled'|'email'>('disabled');
  const [twofaStatus, setTwofaStatus] = useState<'enabled'|'disabled'>('disabled');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  return (
    <div>
      <div className="card section-card">
        <h2 className="section-card-title">プロフィール</h2>
        <Divider />
        <div style={{ marginTop: 12 }}>
          <ProfileSummary name="山田 太郎" email="taro@example.com" onOpenChangePassword={() => setOpen(true)} />
        </div>
      </div>

      <div className="card section-card" style={{ marginTop: 16 }}>
        <h2 className="section-card-title">2段階認証の設定</h2>
        <Divider />
        <div className="twofa-row">
          <TwoFactorEmailToggle
            status={twofaStatus}
            selected={twofaSelected}
            onChangeSelected={(s)=>setTwofaSelected(s)}
            onEnable={async ()=>{
              try {
                await accountRepo.enableEmail2FA();
                setVerifyOpen(true);
              } catch (e: any) {
                push({ message: '2段階認証の有効化に失敗しました', variant: 'error' });
              }
            }}
            onDisable={async ()=>{
              try {
                await accountRepo.disableEmail2FA();
                setTwofaStatus('disabled');
                push({ message: '2段階認証を無効化しました', variant: 'success' });
              } catch (e: any) {
                push({ message: '無効化に失敗しました', variant: 'error' });
              }
            }}
          />
          <div className="twofa-desc">
            メールで6桁コードを受け取り、ログイン時に入力します。紛失時の復旧手段を必ず用意してください。
          </div>
        </div>
      </div>

      <div className="card section-card" style={{ marginTop: 16 }}>
        <h2 className="section-card-title">メールアドレスの変更</h2>
        <Divider />
        <div style={{ marginTop: 12 }}>
          <EmailChangeSection
            currentEmail="taro@example.com"
            pendingEmail={pendingEmail ?? undefined}
            onSend={(e)=>{ console.log('email.change.send', e); setPendingEmail(e); }}
            onResend={()=>{ console.log('email.change.resend'); }}
            onCancel={()=>{ console.log('email.change.cancel'); setPendingEmail(null); }}
          />
        </div>
      </div>

      <PasswordChangeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={async (p) => {
          try {
            await accountRepo.updatePassword({ currentPassword: p.current, newPassword: p.next });
            push({ message: 'パスワードを変更しました', variant: 'success' });
            setOpen(false);
          } catch (e: any) {
            push({ message: 'パスワード変更に失敗しました', variant: 'error' });
          }
        }}
      />

      <TwoFactorEmailVerifyModal
        isOpen={verifyOpen}
        onClose={()=>setVerifyOpen(false)}
        onVerify={async (code)=>{
          try {
            await accountRepo.verifyEmail2FA({ code });
            setTwofaStatus('enabled');
            push({ message: '2段階認証を有効化しました', variant: 'success' });
            setVerifyOpen(false);
          } catch (e: any) {
            push({ message: '認証に失敗しました', variant: 'error' });
          }
        }}
        onResend={async ()=>{
          try {
            await accountRepo.enableEmail2FA();
            push({ message: '認証コードを再送しました', variant: 'success' });
          } catch {
            push({ message: '再送に失敗しました', variant: 'error' });
          }
        }}
      />
    </div>
  );
}


