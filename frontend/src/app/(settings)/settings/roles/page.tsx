"use client";
import React from 'react';
import Button from '@ui/Button';
import Divider from '@ui/Divider';
import MutedText from '@ui/MutedText';
import Input from '@ui/Input';
import Modal from '@ui/Modal';
import SectionTitle from '@ui/SectionTitle';
import Table from '@ui/Table';
import { useToast } from '@ui/Toast';
import Surface from '@ui/Surface';
import type { ResourceDef, Role } from '@/types/roles';
import { useRolesRepo } from '@/app/providers';

export default function RolesPage() {
  type Row = ResourceDef & { draft: Role };
  const rolesRepo = useRolesRepo();
  const [items, setItems] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [dirtyCount, setDirtyCount] = React.useState(0); // 次ステップで実値反映
  const [showChangedOnly, setShowChangedOnly] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const { push } = useToast();
  
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await rolesRepo.list();
        const resources = (data.items as unknown as ResourceDef[]) || [];
        setItems(resources.map((r) => ({ ...r, draft: r.threshold })));
        setDirtyCount(0);
      } catch (e: any) {
        setError(e?.message || 'fetch error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  function setDraft(id: string, role: Role) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, draft: role } : r)));
  }

  React.useEffect(() => {
    const dirty = items.filter((r) => r.draft !== r.threshold).length;
    setDirtyCount(dirty);
  }, [items]);

  // beforeunload guard
  React.useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyCount]);

  // Estimate/Save modal (simple inline)
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [estimate, setEstimate] = React.useState<{ changedCount: number; affectedUsers: number; warnings?: { code: string; message: string }[] } | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  async function openEstimate() {
    const changes = items
      .filter((r) => r.draft !== r.threshold)
      .map((r) => ({ resourceId: r.id, threshold: r.draft }));
    try {
      const res = await (rolesRepo as any)?.estimate?.({ changes });
      const affected = Array.isArray(res?.impact)
        ? (res.impact.find((m: any) => m.metric === 'affected_users')?.delta ?? changes.length * 3)
        : changes.length * 3;
      setEstimate({ changedCount: changes.length, affectedUsers: Math.max(0, affected) });
    } catch {
      // フォールバック: 変更件数から概算
      setEstimate({ changedCount: changes.length, affectedUsers: Math.max(0, changes.length * 3) });
    }
    setConfirmOpen(true);
  }

  async function doSave() {
    setSaveError(null);
    const changes = items
      .filter((r) => r.draft !== r.threshold)
      .map((r) => ({ resourceId: r.id, threshold: r.draft }));
    try {
      await (rolesRepo as any)?.save?.({ changes });
      setItems((prev) => prev.map((r) => ({ ...r, threshold: r.draft })));
      setDirtyCount(0);
      setConfirmOpen(false);
      push({ message: `更新しました（変更 ${changes.length} 件）`, variant: 'success' });
    } catch (e: any) {
      setSaveError('保存に失敗しました。ネットワークをご確認ください。');
      setConfirmOpen(false);
    }
  }

  function toggleCollapse(catId: string) {
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Header */}
      <SectionTitle rightSlot={(
        <div style={{ display: 'flex', gap: 8 }}>
          <Button className="btn-lg" disabled={dirtyCount === 0} onClick={openEstimate}>保存</Button>
        </div>
      )}>ロール定義</SectionTitle>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <Input placeholder="検索（名称/説明/カテゴリ/別名）" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="btn" style={{ cursor: 'pointer' }}>
          <input type="checkbox" style={{ marginRight: 8 }} checked={showChangedOnly} onChange={(e) => setShowChangedOnly(e.target.checked)} />変更のみ表示
        </label>
      </div>

      {/* Table skeleton */}
      {error && <MutedText variant="error">{error}</MutedText>}
      <Surface bordered radius="md" className="overflow-x-auto">
        <Table size="sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ padding: '8px 6px' }}>リソース</Table.Th>
              <Table.Th style={{ padding: '8px 6px' }}>説明</Table.Th>
              <Table.Th style={{ padding: '8px 6px' }}>General</Table.Th>
              <Table.Th style={{ padding: '8px 6px' }}>Manager</Table.Th>
              <Table.Th style={{ padding: '8px 6px' }}>Owner</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody onKeyDown={(e) => { if (e.key === '/' && searchRef.current) { e.preventDefault(); searchRef.current.focus(); } }}>
            {items
              .filter((r) => {
                // 検索フィルタ
                if (query) {
                  const q = query.toLowerCase();
                  const match = r.name.toLowerCase().includes(q) ||
                    (r.description || '').toLowerCase().includes(q) ||
                    (r.aliases || []).some((a: string) => a.toLowerCase().includes(q)) ||
                    r.categoryLabel.toLowerCase().includes(q);
                  if (!match) return false;
                }
                // 変更のみ表示フィルタ
                return showChangedOnly ? r.draft !== r.threshold : true;
              })
              .map((r, idx, arr) => {
              // category header row
              const prev = arr[idx - 1];
              const showHeader = !prev || prev.categoryId !== r.categoryId;
              const thr = r.draft;
              // tokens 準拠: セル強調は Table.Td の highlight で表現
              const hGeneral = thr === 'general' ? 'accent' : undefined;
              const hManager = thr !== 'owner' && thr !== undefined && (thr === 'general' || thr === 'manager') ? 'accent' : undefined;
              const hOwner = 'accent';
              const row = (
                <Table.Tr key={r.id} role="row" aria-labelledby={`header-${r.categoryId}`}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      const order: Role[] = ['general','manager','owner'];
                      const cur: Role = thr;
                      let i = order.indexOf(cur);
                      if (e.key === 'ArrowLeft') i = Math.max(0, i - 1); else i = Math.min(order.length - 1, i + 1);
                      setDraft(r.id, order[i] as Role);
                    }
                  }}
                >
                  <Table.Td style={{ padding: '8px 6px', whiteSpace: 'nowrap', paddingLeft: '60px' }}>{r.name}</Table.Td>
                  <Table.Td style={{ padding: '8px 6px' }}><MutedText>{r.description || '-'}</MutedText></Table.Td>
                  <Table.Td style={{ padding: '8px 6px' }} highlight={hGeneral as any}>
                    <input type="radio" name={`thr-${r.id}`} checked={thr === 'general'} onChange={() => setDraft(r.id, 'general')} aria-label={`${r.name} threshold general`} />
                  </Table.Td>
                  <Table.Td style={{ padding: '8px 6px' }} highlight={hManager as any}>
                    <input type="radio" name={`thr-${r.id}`} checked={thr === 'manager'} onChange={() => setDraft(r.id, 'manager')} aria-label={`${r.name} threshold manager`} />
                  </Table.Td>
                  <Table.Td style={{ padding: '8px 6px' }} highlight={hOwner as any}>
                    <input type="radio" name={`thr-${r.id}`} checked={thr === 'owner'} onChange={() => setDraft(r.id, 'owner')} aria-label={`${r.name} threshold owner`} />
                  </Table.Td>
                </Table.Tr>
              );
              return (
                <React.Fragment key={r.id}>
                  {showHeader && (
                    <Table.Tr>
                      <Table.Td colSpan={5} style={{ padding: '8px 6px' }} className="bg-surface-1">
                        <Button className="btn-sm" onClick={() => toggleCollapse(r.categoryId)} aria-expanded={!collapsed[r.categoryId]} aria-controls={`cat-${r.categoryId}`} style={{ marginRight: 8 }}>{collapsed[r.categoryId] ? '▶' : '▼'}</Button>
                        <span id={`header-${r.categoryId}`}>{r.categoryLabel}</span>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {!collapsed[r.categoryId] && row}
                </React.Fragment>
              );
            })}
            {!loading && items.length === 0 && (
              <Table.Tr><Table.Td colSpan={5} style={{ padding: 12 }}><MutedText>項目がありません。</MutedText></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Surface>

      {/* Error alert */}
      {saveError && (
        <Surface bordered radius="md" className="mt-3 p-3" role="alert" aria-live="polite">
          <MutedText variant="error">{saveError}</MutedText>
          <Button className="btn-sm" style={{ marginLeft: 8 }} onClick={() => setSaveError(null)}>閉じる</Button>
        </Surface>
      )}

      {/* Footer sticky */}
      <Surface className="sticky bottom-0 mt-3 pt-2 flex justify-between items-center" variant="panel">
        <MutedText>変更件数: {dirtyCount}</MutedText>
        <Button className="btn-lg" disabled={dirtyCount === 0} onClick={openEstimate}>保存</Button>
      </Surface>

      {confirmOpen && (
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="保存前の確認">
          <MutedText className="block">
            変更件数: {estimate?.changedCount ?? 0}、影響件数: {estimate?.affectedUsers ?? 0}
          </MutedText>
          {estimate?.warnings?.length ? (
            <ul style={{ marginTop: 8 }}>
              {estimate.warnings.map((w, i) => (<li key={i} className="text-fg-warn-strong">⚠ {w.message}</li>))}
            </ul>
          ) : null}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
            <Button className="btn-lg" onClick={doSave}>保存する</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}


