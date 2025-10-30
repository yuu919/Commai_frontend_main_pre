import Button from '@ui/Button';
import MutedText from '@ui/MutedText';

type Props = {
  name: string;
  email: string;
  onOpenChangePassword: () => void;
};

export default function ProfileSummary({ name, email, onOpenChangePassword }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="profile-row">
        <div>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <MutedText style={{ fontSize: 13 }}>{email}</MutedText>
        </div>
      </div>
      <div className="profile-row">
        <div>
          <div style={{ fontWeight: 600 }}>パスワード</div>
          <MutedText style={{ fontSize: 13 }}>********</MutedText>
        </div>
        <Button onClick={onOpenChangePassword} className="btn-sm">変更</Button>
      </div>
    </div>
  );
}

// style moved to CSS classes (.btn .btn-sm)


