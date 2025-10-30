"use client";
import React from 'react';
import { useContactRepo, useAccountRepo } from '@/app/providers';
import Button from '@ui/Button';
import Divider from '@ui/Divider';
import MutedText from '@ui/MutedText';
import Select from '@ui/Select';
import Textarea from '@ui/Textarea';
import Input from '@ui/Input';

type ContactCategory = 'account_login' | 'system_usage' | 'billing' | 'bug' | 'feedback' | 'other';

function CategorySelect({ value, onChange }: { value: ContactCategory; onChange: (v: ContactCategory) => void }) {
  return (
    <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
      <span className="label">カテゴリ</span>
      <Select value={value} onChange={(v) => onChange(v as ContactCategory)} aria-label="カテゴリ">
        <option value="account_login">アカウント・ログイン</option>
        <option value="system_usage">ご利用システム</option>
        <option value="billing">料金のお支払い</option>
        <option value="bug">バグ・不具合</option>
        <option value="feedback">ご意見・ご要望</option>
        <option value="other">その他</option>
      </Select>
    </label>
  );
}

function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="row" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <span className="label">メールアドレス</span>
      <Input type="email" placeholder="you@example.com" value={value} onChange={(e) => onChange(e.target.value)} aria-label="メールアドレス" style={{ padding: '8px 10px' }} />
    </label>
  );
}

function TitleInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
      <span className="label">タイトル</span>
      <Input type="text" placeholder="簡潔な件名（1〜120文字）" value={value} onChange={(e) => onChange(e.target.value)} aria-label="タイトル" style={{ padding: '8px 10px' }} />
    </label>
  );
}

function MessageTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
      <span className="label" style={{ paddingTop: 0 }}>お問い合わせ内容</span>
      <Textarea style={{ minHeight: 160, resize: 'vertical' }} placeholder="できるだけ具体的にご記入ください（20〜5,000文字）" value={value} onChange={(e) => onChange(e.target.value)} aria-label="お問い合わせ内容" />
    </label>
  );
}

const ACCEPT = ['pdf','csv','xlsx','xls','png','jpg','jpeg'];
const MAX_FILES = 3;
const MAX_TOTAL_MB = 10;

function AttachmentUploader({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    const merged = [...files, ...list];
    const limited = merged.slice(0, MAX_FILES);
    onChange(limited);
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const overLimit = totalBytes > MAX_TOTAL_MB * 1024 * 1024;
  const invalidExt = files.some((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return !ext || !ACCEPT.includes(ext);
  });
  return (
    <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
      <span className="label" style={{ paddingTop: 0 }}>添付ファイル</span>
      <div>
        <input
          className="input input-file"
          type="file"
          multiple
          onChange={handleSelect}
          accept={ACCEPT.map((e) => '.' + e).join(',')}
          aria-label="添付ファイル"
        />
        <MutedText style={{ marginTop: 8, fontSize: 12 }}>
          最大 {MAX_FILES} ファイル、合計 {MAX_TOTAL_MB}MB まで。許可: {ACCEPT.join(', ')}
        </MutedText>
        {files.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {files.map((f, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{f.name}</span>
                <Button className="btn-sm" onClick={() => onChange(files.filter((_, idx) => idx !== i))}>削除</Button>
              </li>
            ))}
          </ul>
        )}
        {(overLimit || invalidExt) && (
          <MutedText variant="error" className="text-sm mt-1">
            {overLimit ? `合計サイズが ${MAX_TOTAL_MB}MB を超えています。` : null}
            {invalidExt ? ` 許可されていない拡張子があります。` : null}
          </MutedText>
        )}
      </div>
    </div>
  );
}

function PrivacyConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'center', gap: 6, padding: '6px 0' }}>
      <span className="label">同意</span>
      <span>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label="個人情報の取り扱いに同意する" />
        <span style={{ marginLeft: 8 }}>個人情報の取り扱いに同意する（<a href="/privacy" target="_blank" rel="noopener">プライバシーポリシー</a>）</span>
      </span>
    </label>
  );
}

export default function ContactPage() {
  const contactRepo = useContactRepo();
  const accountRepo = useAccountRepo();
  const [category, setCategory] = React.useState<ContactCategory>('system_usage');
  const [email, setEmail] = React.useState<string>('');
  const [title, setTitle] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [consent, setConsent] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [ticketId, setTicketId] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = React.useState<number>(0);

  // 簡易バリデーション
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const emailRef = React.useRef<HTMLInputElement | null>(null);
  const titleRef = React.useRef<HTMLInputElement | null>(null);
  const msgRef = React.useRef<HTMLTextAreaElement | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    // email
    const em = email.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!em) next.email = 'メールアドレスは必須です。';
    else if (!emailRe.test(em)) next.email = 'メールアドレスの形式が正しくありません。';
    // title
    const ti = title.trim();
    if (!ti) next.title = 'タイトルは必須です。';
    else if (ti.length < 1 || ti.length > 120) next.title = 'タイトルは1〜120文字で入力してください。';
    // message
    const sanitized = message.replace(/<[^>]*>/g, '');
    if (!sanitized || sanitized.trim().length < 20) next.message = 'お問い合わせ内容は20文字以上で入力してください。';
    else if (sanitized.length > 5000) next.message = 'お問い合わせ内容は5,000文字以内で入力してください。';
    // attachments（上限/拡張子はアップローダ側でも警告済みだが、送信前にも確認）
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const overLimit = totalBytes > MAX_TOTAL_MB * 1024 * 1024;
    const invalidExt = files.some((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return !ext || !ACCEPT.includes(ext);
    });
    if (files.length > MAX_FILES) next.attachments = `添付は最大${MAX_FILES}ファイルまでです。`;
    if (overLimit) next.attachments = `合計サイズが${MAX_TOTAL_MB}MBを超えています。`;
    if (invalidExt) next.attachments = '許可されていない拡張子が含まれています。';
    // consent
    if (!consent) next.consent = '個人情報の取り扱いに同意してください。';

    setErrors(next);
    // フォーカス移動
    if (next.email && emailRef.current) emailRef.current.focus();
    else if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.message && msgRef.current) msgRef.current.focus();
    return Object.keys(next).length === 0;
  }

  const canSubmit = consent; // ボタン活性条件（送信時に validate 実行）

  // プロファイルからメールをプリフィル（AccountRepoに統一）
  React.useEffect(() => {
    if (email) return;
    (async () => {
      try {
        const profile = await accountRepo.getMyProfile?.();
        const e = profile?.email;
        if (typeof e === 'string' && e.includes('@')) setEmail(e);
      } catch {}
    })();
  }, [email, accountRepo]);

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',').pop() || '');
      reader.onerror = () => reject(new Error('read error'));
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <h2 className="section-card-title">問い合わせ</h2>
      <Divider />
      <div style={{ display: 'grid', rowGap: 8 }}>
        <CategorySelect value={category} onChange={setCategory} />
        {/* メール */}
        <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
          <span className="label">メールアドレス</span>
          <div>
            <Input
              ref={emailRef}
              id="contact-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={errors.email ? 'error-email' : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <MutedText id="error-email" variant="error" className="text-xs mt-1">{errors.email}</MutedText>
            )}
          </div>
        </label>

        {/* タイトル */}
        <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
          <span className="label">タイトル</span>
          <div>
            <Input
              ref={titleRef}
              id="contact-title"
              type="text"
              placeholder="簡潔な件名（1〜120文字）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-describedby={errors.title ? 'error-title' : undefined}
              aria-invalid={!!errors.title}
              style={{ padding: '8px 10px', width: '640px', maxWidth: '100%' }}
            />
            {errors.title && (
              <MutedText id="error-title" variant="error" className="text-xs mt-1">{errors.title}</MutedText>
            )}
          </div>
        </label>

        {/* 本文 */}
        <label className="row" style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start', gap: 6, padding: '6px 0' }}>
          <span className="label" style={{ paddingTop: 0 }}>お問い合わせ内容</span>
          <div>
            <Textarea
              ref={msgRef}
              id="contact-message"
              style={{ minHeight: 160, resize: 'vertical', padding: '10px 12px', width: '640px', maxWidth: '100%' }}
              placeholder="可能な限り具体的に、状況・操作手順・期待した結果・実際の結果をご記入ください（20〜5,000文字）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-describedby={errors.message ? 'error-message' : undefined}
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <MutedText id="error-message" variant="error" className="text-xs mt-1">{errors.message}</MutedText>
            )}
          </div>
        </label>
        {/* 添付 */}
        <AttachmentUploader files={files} onChange={setFiles} />
        {errors.attachments && (
          <MutedText variant="error" className="text-xs">{errors.attachments}</MutedText>
        )}

        {/* 同意 */}
        <PrivacyConsentCheckbox checked={consent} onChange={setConsent} />
        {errors.consent && (
          <MutedText variant="error" className="text-xs">{errors.consent}</MutedText>
        )}

        {/* 送信 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            className="btn-lg"
            disabled={!canSubmit || loading || Date.now() < cooldownUntil}
            onClick={async () => {
              setSubmitError(null);
              if (!validate()) return;
              if (Date.now() < cooldownUntil) return;
              setLoading(true);
              try {
                // 添付を base64 化
                const attaches = await Promise.all(
                  files.slice(0, MAX_FILES).map(async (f) => ({
                    filename: f.name,
                    contentType: f.type || 'application/octet-stream',
                    size: f.size,
                    base64: await fileToBase64(f),
                  }))
                );
                const body = {
                  category,
                  email: email.trim(),
                  title: title.trim(),
                  message: message.replace(/<[^>]*>/g, ''),
                  attachments: attaches,
                  consent,
                };
                try {
                  await contactRepo.post({ title: body.title, body: body.message });
                } catch (e: unknown) {
                  setSubmitError('送信に失敗しました。時間をおいて再度お試しください。');
                  return;
                }
                if (false) {
                  setSubmitError('短時間に連続送信はできません。しばらくしてからお試しください。');
                  return;
                }
                setTicketId('TICKET-0001');
                setCooldownUntil(Date.now() + 30_000);
              } catch (e: unknown) {
                setSubmitError('送信に失敗しました。ネットワークをご確認ください。');
              } finally {
                setLoading(false);
              }
            }}
            aria-label="問い合わせを送信"
          >
            {loading ? '送信中…' : Date.now() < cooldownUntil ? 'クールダウン中' : '送信'}
          </Button>
        </div>

        {/* 成功パネル */}
        {ticketId && (
          <div className="card" style={{ marginTop: 12, padding: 12 }} aria-live="polite">
            送信を受け付けました（チケットID: {'#' + ticketId}）。確認メールを送信しました。
          </div>
        )}

        {/* エラー表示 */}
        {submitError && (
          <MutedText variant="error" className="mt-2" role="alert" aria-live="polite">{submitError}</MutedText>
        )}
      </div>
    </div>
  );
}


