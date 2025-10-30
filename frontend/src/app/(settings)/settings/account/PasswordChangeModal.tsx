"use client";

import * as React from 'react';
import Modal from '@ui/Modal';
import Input from '@ui/Input';
import Button from '@ui/Button';

export type PasswordChangePayload = { current: string; next: string };

export type PasswordChangeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: PasswordChangePayload) => void;
};

export default function PasswordChangeModal({ isOpen, onClose, onSubmit }: PasswordChangeModalProps) {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');

  function submit() {
    onSubmit({ current, next });
    setCurrent('');
    setNext('');
  }

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="パスワード変更">
      <div style={{ display: 'grid', rowGap: 10 }}>
        <label className="label">現在のパスワード</label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <label className="label" style={{ marginTop: 6 }}>新しいパスワード</label>
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button onClick={onClose}>キャンセル</Button>
          <Button className="btn-lg" onClick={submit}>変更する</Button>
        </div>
      </div>
    </Modal>
  );
}


