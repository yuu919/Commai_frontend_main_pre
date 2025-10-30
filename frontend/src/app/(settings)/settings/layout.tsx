'use client';
import React from 'react';
import Link from 'next/link';
import Button from '@ui/Button';
import { useAuth } from '@/lib/client/auth.client';
import { useRouter, usePathname } from 'next/navigation';
import Surface from '@ui/Surface';
// settings.css の依存を段階撤去済み

const NAV = [
  { href: '/settings/account', label: 'ログイン設定' },
  { href: '/settings/billing', label: 'プランと請求' },
  { href: '/settings/users-access', label: 'ユーザー・権限' },
  { href: '/settings/connections', label: '接続' },
  { href: '/settings/roles', label: 'ロール定義' },
  { href: '/settings/run-logs', label: '実行ログ' },
  { href: '/settings/help', label: 'ヘルプ' },
  { href: '/settings/contact', label: '問い合わせ' },
  { href: '/settings/ui-catalog', label: 'UIカタログ' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isBypass =
    process.env.NEXT_PUBLIC_AUTH_DISABLED === '1' ||
    (typeof document !== 'undefined' && document.cookie.includes('auth_disabled=1'));
  React.useEffect(() => {
    if (isLoading || isBypass) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/login?next=${next}`);
    }
  }, [isAuthenticated, isLoading, isBypass, pathname, router]);
  if (!isAuthenticated && !isBypass) return null;
  return (
    <div className="min-h-screen flex" data-theme="dark">
      <aside className="w-[280px]">
        <Surface variant="panel" borderSide="r" className="h-full">
        <div className="px-4 py-4 font-bold">設定</div>
        <nav className="flex flex-col gap-[2px] p-2">
          {NAV.map((item, i) => {
            const q = item.href.indexOf('?');
            const base = q >= 0 ? item.href.slice(0, q) : item.href;
            const active = (pathname ?? '').startsWith(base);
            return (
              <Button key={`${item.href}-${i}`} asChild size="sm" variant={active ? 'primary' : 'ghost'} className="justify-start">
                <Link href={item.href} className="no-underline flex-1">
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
        </Surface>
      </aside>
      <main className="flex-1 p-6">
        <React.Suspense fallback={null}>
          {children}
        </React.Suspense>
      </main>
    </div>
  );
}


