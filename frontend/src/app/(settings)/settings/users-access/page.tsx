import { redirect } from 'next/navigation';
import Link from 'next/link';
import Button from '@ui/Button';
import Divider from '@ui/Divider';
import MutedText from '@ui/MutedText';
import { createMockUsersAccessRepo } from '@/features/settings/api/modules/users-access';
import { createServerUsersAccessRepo } from '@/features/settings/api/modules/users-access.server';

type StoresResponse = { items?: Array<{ storeId: string; storeName: string }> };

export default async function UsersAccessIndex() {
  // Determine default platform/store dynamically (Server Component)
  const platformId = 'amazon';
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
  let items: Array<{ storeId: string; storeName: string }> = [];
  try {
    if (useMocks) {
      const mock = createMockUsersAccessRepo();
      const res = await mock.listStores();
      items = res.items || [];
    } else {
      const usersAccess = createServerUsersAccessRepo();
      const res = await usersAccess.listStores();
      items = res.items || [];
    }
  } catch {
    items = [];
  }
  const first = (items || [])[0];
  if (first?.storeId) {
    redirect(`/settings/users-access/${platformId}/${first.storeId}`);
  }
  return (
    <section className="card" style={{ alignSelf: 'start' }}>
      <h2 className="section-card-title">ユーザー権限設定</h2>
      <Divider />
      <div style={{ display: 'grid', rowGap: 8 }}>
        <MutedText>接続されているストアがありません。</MutedText>
        <div>
          <Link href="/settings/connections?modal=connect">
            <Button className="btn-lg">接続ウィザードを開く</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}


