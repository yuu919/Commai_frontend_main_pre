"use client";

import * as React from 'react';
import Modal from '@ui/Modal';
import Input from '@ui/Input';
import Button from '@ui/Button';

export type TwoFactorEmailVerifyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  onResend: () => void;
};

export default function TwoFactorEmailVerifyModal({ isOpen, onClose, onVerify, onResend }: TwoFactorEmailVerifyModalProps) {
  const [code, setCode] = React.useState('');
  function submit() { onVerify(code.trim()); setCode(''); }
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="メール認証コード">
      <div style={{ display: 'grid', rowGap: 10 }}>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6桁コード" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onResend}>再送</Button>
          <Button className="btn-lg" onClick={submit}>認証</Button>
        </div>
      </div>
    </Modal>
  );
}


