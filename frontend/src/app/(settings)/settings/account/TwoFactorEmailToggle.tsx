"use client";
import Button from '@ui/Button';

type Status = 'enabled' | 'disabled';
type Selected = 'disabled' | 'email';

type Props = {
  status: Status;
  selected: Selected;
  onChangeSelected: (s: Selected) => void;
  onEnable: () => void;
  onDisable: () => void;
};

export default function TwoFactorEmailToggle({ status, selected, onChangeSelected, onEnable, onDisable }: Props) {
  const handleApply = () => {
    if (selected === 'email') {
      onEnable();
    } else {
      // 簡易確認（UIのみ）
      if (window.confirm('二段階認証（メール）を無効にしますか？')) onDisable();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label className="radio-label">
            <input
              type="radio"
              name="twofactor"
              checked={selected === 'disabled'}
              onChange={() => onChangeSelected('disabled')}
            />
            無効にする
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="twofactor"
              checked={selected === 'email'}
              onChange={() => onChangeSelected('email')}
            />
            メール
          </label>
          <span className={`badge ${status === 'enabled' ? 'badge--enabled' : 'badge--disabled'}`}>
            {status === 'enabled' ? '有効' : '無効'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button onClick={handleApply} className="btn-lg">設定</Button>
        </div>
      </div>
    </div>
  );
}



