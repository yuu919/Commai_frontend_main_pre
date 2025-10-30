"use client";
import React from 'react';
import useSWR from 'swr';
import { useUsersAccessRepo } from '@/app/providers';
import { useParams, useRouter } from 'next/navigation';
import { mockPermissions } from '@/data/mock/permissions';
import type { UsersAccessRepo } from '@/features/settings/api/types';
import type { Filters, Role } from '@/types/permissions';
import Button from '@ui/Button';
import Divider from '@ui/Divider';
import MutedText from '@ui/MutedText';
import Input from '@ui/Input';
import Modal from '@ui/Modal';
import Textarea from '@ui/Textarea';
import Select from '@ui/Select';
import Table from '@ui/Table';
import Badge from '@ui/Badge';

function ToastArea() {
  return (
    <div aria-live="polite" style={{ position: 'fixed', right: 16, bottom: 16, width: 360, pointerEvents: 'none' }} />
  );
}

function LeftScopeBar({
  platformId,
  storeId,
  platformName,
  storeName,
  platforms,
  stores,
  filters,
  onChange,
}: {
  platformId: string;
  storeId: string;
  platformName?: string;
  storeName?: string;
  platforms: ReadonlyArray<{ id: string; name: string }>;
  stores: ReadonlyArray<{ id: string; platformId: string; name: string }>;
  filters: Filters;
  onChange: (next: { platformId?: string; storeId?: string; filters?: Filters }) => void;
}) {
  const [storeQuery, setStoreQuery] = React.useState("");
  const [favorites, setFavorites] = React.useState<string[]>([]);

  const selectedPlatformIds = new Set(filters.platformIds || []);
  const selectedStoreIds = new Set(filters.storeIds || []);

  function togglePlatformSelect(id: string) {
    const next = new Set(filters.platformIds || []);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ filters: { ...filters, platformIds: Array.from(next) } });
  }
  function toggleStoreSelect(id: string) {
    const next = new Set(filters.storeIds || []);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ filters: { ...filters, storeIds: Array.from(next) } });
  }

  const filteredPlatforms = platforms;
  const platformFilter = selectedPlatformIds.size > 0 ? selectedPlatformIds : null;
  const filteredStores = stores
    .filter((s) => (platformFilter ? platformFilter.has(s.platformId) : true))
    .filter((s) => s.name.toLowerCase().includes(storeQuery.toLowerCase()) || s.id.includes(storeQuery))
    .sort((a, b) => {
      const fa = favorites.includes(a.id) ? 0 : 1;
      const fb = favorites.includes(b.id) ? 0 : 1;
      return fa - fb || a.name.localeCompare(b.name);
    });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const roles: Role[] = ['owner', 'manager', 'general', 'none'];
  const roleLabelMap: Record<Role, string> = {
    owner: 'Owner',
    manager: 'Manager',
    general: 'General',
    none: 'None',
  };
  type UserStatus = 'active' | 'invited' | 'suspended';
  const statuses: UserStatus[] = ['active', 'invited', 'suspended'];
  const statusLabelMap: Record<UserStatus, string> = {
    active: '有効',
    invited: '招待中',
    suspended: '停止',
  };

  return (
    <aside className="card">
      <h2 className="section-card-title">フィルター</h2>
      <Divider />
      <div style={{ display: 'grid', rowGap: 12 }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>プラットフォーム</div>
          <div style={{ marginTop: 8, display: 'grid', rowGap: 6 }}>
            {filteredPlatforms.map((p) => {
              const pressed = selectedPlatformIds.has(p.id);
              return (
                <Button
                  key={p.id}
                  onClick={() => togglePlatformSelect(p.id)}
                  aria-pressed={pressed}
                  variant={pressed ? 'primary' : 'ghost'}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  {pressed ? '✓ ' : ''}{p.name}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>ストア</div>
          <Input placeholder="検索..." value={storeQuery} onChange={(e) => setStoreQuery(e.target.value)} style={{ width: '100%' }} />
          <div style={{ marginTop: 8, display: 'grid', rowGap: 6 }}>
            {filteredStores.map((s) => {
              const pressed = selectedStoreIds.has(s.id);
              return (
                <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button onClick={() => toggleStoreSelect(s.id)} aria-pressed={pressed} variant={pressed ? 'primary' : 'ghost'} style={{ flex: 1, minWidth: 0, justifyContent: 'flex-start' }}>
                    {pressed ? '✓ ' : ''}{s.name}
                  </Button>
                  <Button aria-label={`お気に入り ${s.name}`} onClick={() => toggleFavorite(s.id)}>
                    {favorites.includes(s.id) ? '★' : '☆'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>クイックフィルター</div>
          <div style={{ display: 'grid', rowGap: 8 }}>
            <div>
              <MutedText style={{ marginBottom: 4 }}>ロール</MutedText>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {roles.map((r) => {
                  const checked = (filters.roles || []).includes(r);
                  return (
                    <label key={r} className="radio-label">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const nextRoles = new Set(filters.roles || []);
                        if (e.target.checked) nextRoles.add(r); else nextRoles.delete(r);
                        onChange({ filters: { ...filters, roles: Array.from(nextRoles) } });
                      }} />
                      <span>{roleLabelMap[r]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <MutedText style={{ marginBottom: 4 }}>ステータス</MutedText>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {statuses.map((s) => {
                  const checked = (filters.statuses || []).includes(s);
                  return (
                    <label key={s} className="radio-label">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const nextStatuses = new Set(filters.statuses || []);
                        if (e.target.checked) nextStatuses.add(s); else nextStatuses.delete(s);
                        onChange({ filters: { ...filters, statuses: Array.from(nextStatuses) } });
                      }} />
                      <span>{statusLabelMap[s]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <MutedText>
          <div><strong>プラットフォーム:</strong> {platformName || platformId}</div>
          <div><strong>ストア:</strong> {storeName || storeId}</div>
        </MutedText>
      </div>
    </aside>
  );
}

function RightWorkspace({ summary, platformName, storeName, platformId, storeId, filters, filtersKey }: { summary: { users: number; assignments: number }; platformName?: string; storeName?: string; platformId: string; storeId: string; filters: Filters; filtersKey: number }) {
  const usersAccessRepo = useUsersAccessRepo();
  const [rows, setRows] = React.useState<Array<{ id: string; name: string; email: string; status: string; role: string; scopeStoreId?: string }>>([]);
  const [undo, setUndo] = React.useState<{ userId: string; prevRole: string } | null>(null);
  const [openInvite, setOpenInvite] = React.useState(false);
  const [queryEmail, setQueryEmail] = React.useState<string>('');
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<{ userId: string; email: string } | null>(null);

  // 初期行を Repo 経由で取得
  React.useEffect(() => {
    (async () => {
      try {
        const data = await usersAccessRepo.listUsers({ platformId, storeId });
        setRows(data.items);
      } catch {
        setRows([]);
      }
    })();
  }, [usersAccessRepo, platformId, storeId]);

  async function changeRole(userId: string, role: string) {
    const prev = rows.find((r) => r.id === userId)?.role || 'none';
    setRows((prevRows) => prevRows.map((r) => (r.id === userId ? { ...r, role } : r)));
    setUndo({ userId, prevRole: prev });
    try {
      await usersAccessRepo.updateRole({ storeId, userId, role });
    } catch {
      // rollback if failed
      setRows((prevRows) => prevRows.map((r) => (r.id === userId ? { ...r, role: prev } : r)));
    }
    // auto clear after 30s
    setTimeout(() => setUndo((u) => (u && u.userId === userId ? null : u)), 30000);
  }

  function undoChange() {
    if (!undo) return;
    changeRole(undo.userId, undo.prevRole);
    setUndo(null);
  }

  function onEmailQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cleaned = raw.replace(/\s+/g, '');
    setQueryEmail(cleaned);
    if (cleaned.length > 0 && !cleaned.includes('@')) {
      setEmailError('有効なメールアドレスを入力してください（@が必要です）');
    } else {
      setEmailError(null);
    }
  }

function UsersView() {
    const [sort, setSort] = React.useState<{ key: 'name'|'email'|'role'|'status'|'updated'; dir: 'desc'|'asc'|'none' }>({ key: 'name', dir: 'none' });

    function nextDir(dir: 'desc'|'asc'|'none'): 'desc'|'asc'|'none' {
      return dir === 'desc' ? 'asc' : dir === 'asc' ? 'none' : 'desc';
    }

    const list = React.useMemo(() => {
      const q = (queryEmail || '').trim();
      let base = (!q || emailError) ? rows : rows.filter((r) => r.email === q);

      // Quick filters: Roles (OR within group), Statuses (OR within group)
      const roleSet = new Set((filters.roles || []).filter(Boolean));
      if (roleSet.size > 0) {
        base = base.filter((r) => roleSet.has(r.role as Role));
      }
      const statusSet = new Set((filters.statuses || []).filter(Boolean));
      if (statusSet.size > 0) {
        base = base.filter((r) => statusSet.has(r.status as any));
      }

      // Store filter (within current page scope). If filters.storeIds is set, narrow by scopeStoreId
      const storeSet = new Set((filters.storeIds || []).filter(Boolean));
      if (storeSet.size > 0) {
        base = base.filter((r) => !r.scopeStoreId || storeSet.has(r.scopeStoreId as string));
      }

      // Scoped view: API already returns rows for the selected platform/store.

      if (sort.dir !== 'none') {
        const dirMul = sort.dir === 'asc' ? 1 : -1;
        const collator = new Intl.Collator('ja', { sensitivity: 'base' });
        const roleOrder: Record<string, number> = { none: 0, general: 1, manager: 2, owner: 3 };
        const statusOrder: Record<string, number> = { suspended: 0, invited: 1, active: 2 };
        base = [...base].sort((a, b) => {
          if (sort.key === 'name') {
            const p = collator.compare(String(a.name || ''), String(b.name || '')) * dirMul;
            if (p !== 0) return p;
            return collator.compare(String(a.email || ''), String(b.email || '')) * dirMul;
          }
          if (sort.key === 'email') {
            return collator.compare(String(a.email || ''), String(b.email || '')) * dirMul;
          }
          if (sort.key === 'role') {
            const av = roleOrder[String((a as any).role || 'none')] ?? 0;
            const bv = roleOrder[String((b as any).role || 'none')] ?? 0;
            return (av - bv) * dirMul;
          }
          if (sort.key === 'status') {
            const av = statusOrder[String((a as any).status || 'active')] ?? 0;
            const bv = statusOrder[String((b as any).status || 'active')] ?? 0;
            return (av - bv) * dirMul;
          }
          const at = (a as any).updatedAt ? Date.parse((a as any).updatedAt) : Number.NaN;
          const bt = (b as any).updatedAt ? Date.parse((b as any).updatedAt) : Number.NaN;
          const aIsNa = Number.isNaN(at);
          const bIsNa = Number.isNaN(bt);
          if (aIsNa && bIsNa) return 0;
          if (aIsNa) return 1;
          if (bIsNa) return -1;
          return ((at - bt) > 0 ? 1 : (at - bt) < 0 ? -1 : 0) * dirMul;
        });
      }
      return base;
    }, [rows, queryEmail, emailError, sort, platformId, storeId, filters]);

    const isMultiPlatform = (mockPermissions.platforms?.length || 0) > 1;

    function SortButton({ col }: { col: 'name'|'email'|'role'|'status'|'updated' }) {
      const active = sort.key === col ? sort.dir : 'none';
      const icon = active === 'desc' ? '▼' : active === 'asc' ? '▲' : '⇅';
      return (
        <Button aria-label={`Sort ${col}`} onClick={() => setSort((s) => ({ key: col, dir: s.key === col ? nextDir(s.dir) : 'desc' }))} style={{ height: 24, padding: '0 8px' }}>{icon}</Button>
      );
    }
    const ariaOf = (col: 'name'|'email'|'role'|'status'|'updated'): 'none'|'ascending'|'descending' => {
      if (sort.key !== col) return 'none';
      return sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none';
    };

    return (
      <div>
        <Table size="sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 'calc((100% - 430px) * 0.25)' }} />
            <col style={{ width: 'calc((100% - 430px) * 0.25)' }} />
            <col style={{ width: 'calc((100% - 430px) * 0.50)' }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 100 }} />
          </colgroup>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ padding: '8px' }}>Scope</Table.Th>
              <Table.Th style={{ padding: '8px' }} sortable aria-sort={ariaOf('name')}>名前</Table.Th>
              <Table.Th style={{ padding: '8px' }} sortable aria-sort={ariaOf('email')}>メール <SortButton col="email" /></Table.Th>
              <Table.Th style={{ padding: '8px', whiteSpace: 'nowrap', width: 120 }} sortable aria-sort={ariaOf('role')}>ロール <SortButton col="role" /></Table.Th>
              <Table.Th style={{ padding: '8px', whiteSpace: 'nowrap', width: 1 }} sortable aria-sort={ariaOf('status')}>状態 <SortButton col="status" /></Table.Th>
              <Table.Th style={{ padding: '8px', whiteSpace: 'nowrap', width: 110 }} sortable aria-sort={ariaOf('updated')}>更新 <SortButton col="updated" /></Table.Th>
              <Table.Th style={{ padding: '8px', whiteSpace: 'nowrap', width: 1 }}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {isMultiPlatform ? <Badge size="sm" variant="neutral">{platformName || platformId}</Badge> : null}
                    <Badge size="sm" variant="primary">{storeName || storeId}</Badge>
                  </span>
                </Table.Td>
                <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Table.Td>
                <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</Table.Td>
                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                  <Select value={r.role} onChange={(v) => changeRole(r.id, v)}>
                    {(['owner','manager','general','none'] as Role[]).map((opt) => (
                      <option key={opt} value={opt}>{opt === 'owner' ? 'Owner' : opt === 'manager' ? 'Manager' : opt === 'general' ? 'General' : 'None'}</option>
                    ))}
                  </Select>
                </Table.Td>
                <Table.Td style={{ whiteSpace: 'nowrap' }}>{r.status === 'active' ? '有効' : r.status === 'invited' ? '招待中' : '停止'}</Table.Td>
                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                  <MutedText>{(() => {
                    const raw = (r as any).updatedAt as string | undefined;
                    if (!raw) return '—';
                    const d = new Date(raw);
                    if (isNaN(d.getTime())) return '—';
                    return d.toLocaleDateString('ja-JP');
                  })()}
                  </MutedText>
                </Table.Td>
                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                  <Button onClick={(e) => { e.stopPropagation(); setConfirm({ userId: r.id, email: r.email }); }}>削除</Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {undo && (
          <div style={{ marginTop: 10 }}>
            <Button onClick={undoChange}>変更を元に戻す（30秒）</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="card" style={{ alignSelf: 'start' }}>
      <h2 className="section-card-title">ユーザー権限設定</h2>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MutedText>{platformName || 'プラットフォーム'} &gt; {storeName || 'ストア'}</MutedText>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            type="email"
            value={queryEmail}
            onChange={onEmailQueryChange}
            placeholder="user1@example.com"
            aria-label="メールアドレスで検索"
            style={{ width: 260 }}
          />
          <Button className="btn-lg" style={{ minWidth: 120 }} onClick={() => setOpenInvite(true)}>招待</Button>
        </div>
      </div>
      {emailError && (
        <MutedText variant="error" className="mb-2"> {emailError} </MutedText>
      )}
      <div style={{ display: 'grid', rowGap: 6 }}>
        <div>ユーザー数: {summary.users}</div>
        <div>割当数（組織/プラットフォーム/ストア合算）: {summary.assignments}</div>
        <UsersView />
      </div>
      <InviteUserModal isOpen={openInvite} onClose={() => setOpenInvite(false)} onSuccess={() => {
        // refresh placeholder (no-op until users list API exists)
      }} storeId={storeId} />
      {confirm && (
        <Modal isOpen={!!confirm} onClose={() => setConfirm(null)} title="このストアからアクセスを外しますか？">
          <MutedText style={{ marginBottom: 12 }}>
            対象ユーザー: {confirm.email}
          </MutedText>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setConfirm(null)}>キャンセル</Button>
            <Button className="btn-lg" onClick={async () => {
              try {
                await usersAccessRepo.disableUser({ storeId, userId: confirm.userId });
              } finally {
                setConfirm(null);
              }
            }}>削除</Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function InviteUserModal({ isOpen, onClose, onSuccess, storeId }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; storeId: string }) {
  const usersAccessRepo = useUsersAccessRepo();
  const [text, setText] = React.useState<string>('');
  const [role, setRole] = React.useState<Role>('general');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const first = focusables.item(0);
        const last = focusables.item(focusables.length - 1);
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (first && active === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (last && active === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      } else if (e.key === 'Enter') {
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return; // avoid unintended submit
      }
    };
    window.addEventListener('keydown', onKeyDown);
    setTimeout(() => textareaRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  function parseEmails(raw: string): string[] {
    const parts = raw
      .split(/[\n,\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(parts));
  }

  function validate(emails: string[]): string | null {
    if (emails.length === 0) return 'メールアドレスを入力してください';
    if (emails.length > 20) return '一度に招待できるのは20件までです';
    const invalid = emails.filter((e) => !/^\S+@\S+\.\S+$/.test(e));
    if (invalid.length > 0) return `無効なメールがあります（例: ${invalid[0]}）`;
    return null;
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    const emails = parseEmails(text);
    const v = validate(emails);
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      // repo 経由（モック対応）: 単一送信に正規化
      for (const email of emails) {
        await usersAccessRepo.inviteUser({ storeId, email, role });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || '招待に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ユーザーを招待">
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', rowGap: 12 }}>
          <label className="label">メールアドレス（複数可）</label>
          <Textarea ref={textareaRef as any} placeholder={'a@example.com, b@example.com\nまたは改行区切り'} value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', height: 96, resize: 'vertical' }} />
          <div>
            <label className="label" style={{ marginRight: 8 }}>初期ロール</label>
            <Select value={role} onChange={(v) => setRole(v as Role)} className="w-[220px] h-[32px]">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="general">General</option>
              <option value="none">None</option>
            </Select>
          </div>
          <MutedText>適用スコープ: ストア（ID: {storeId}）</MutedText>
          {error && <MutedText variant="error">{error}</MutedText>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button type="button" onClick={onClose} disabled={submitting}>キャンセル</Button>
            <Button type="submit" className="btn-lg" disabled={submitting}>{submitting ? '送信中...' : '送信'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersAccessPage() {
  const params = useParams<{ platformId: string; storeId: string }>();
  const platformId = params?.platformId || 'unknown';
  const storeId = params?.storeId || 'unknown';
  const router = useRouter();
  const { platforms, stores, users, assignments } = mockPermissions;
  const plat = platforms.find((p) => p.id === platformId);
  const store = stores.find((s) => s.id === storeId);
  const platformName = plat?.name;
  const storeName = store?.name;
  const summary = {
    users: users.length,
    assignments: assignments.filter((a) => {
      if (a.subject === 'org') return true;
      if (a.subject === 'platform') return a.subjectId === platformId;
      if (a.subject === 'store') return a.subjectId === storeId;
      return false;
    }).length,
  };
  const filtersRef = React.useRef<Filters>({});
  const [filtersKey, setFiltersKey] = React.useState(0);

  const handleChange = (next: { platformId?: string; storeId?: string; filters?: Filters }) => {
    const newPlatformId = next.platformId || platformId;
    const newStoreId = next.storeId || storeId;
    if (next.filters) {
      filtersRef.current = next.filters;
    }
    const href = `/settings/users-access/${newPlatformId}/${newStoreId}`;
    router.push(href, { scroll: false });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <LeftScopeBar
          platformId={platformId}
          storeId={storeId}
          platformName={platformName}
          storeName={storeName}
          platforms={platforms}
          stores={stores}
          filters={filtersRef.current}
          onChange={handleChange}
        />
        <RightWorkspace summary={summary} platformName={platformName} storeName={storeName} platformId={platformId} storeId={storeId} filters={filtersRef.current} filtersKey={(filtersRef.current.platformIds?.length || 0) + (filtersRef.current.storeIds?.length || 0)} />
      </div>
      <ToastArea />
    </div>
  );
}



