"use client";
import React from 'react';
import Button from '@ui/Button';
import MutedText from '@ui/MutedText';
import Divider from '@ui/Divider';
import SectionTitle from '@ui/SectionTitle';
import Table from '@ui/Table';
import Badge from '@ui/Badge';
import Input from '@ui/Input';
import Select from '@ui/Select';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '@ui/Modal';
import FilterChip from '@ui/FilterChip';
import RowMenu from '@ui/RowMenu';
import { useRunLogsRepo } from '@/app/providers';

const ALL_STATUS = [
  { key: 'completed', label: '完了' },
  { key: 'running', label: '実行中' },
  { key: 'paused', label: '一時停止' },
  { key: 'failed', label: '失敗' },
  { key: 'canceled', label: 'キャンセル' },
] as const;

const ALL_TYPES = [
  { key: 'Ask', label: 'Ask' },
  { key: 'Agent', label: 'Agent' },
] as const;

function useQueryState() {
  const search = useSearchParams();
  const [q, setQ] = React.useState<string>(search.get('q') || '');
  const [from, setFrom] = React.useState<string>(search.get('from') || '');
  const [to, setTo] = React.useState<string>(search.get('to') || '');
  const [statuses, setStatuses] = React.useState<string[]>(() => (search.get('status') || '').split(',').filter(Boolean));
  const [types, setTypes] = React.useState<string[]>(() => (search.get('type') || '').split(',').filter(Boolean));
  const [sort, setSort] = React.useState<string>(search.get('sort') || 'updatedAt desc');
  const [limit, setLimit] = React.useState<string>(search.get('limit') || '50');
  const [view, setView] = React.useState<string>(search.get('view') || 'threaded');
  return { q, setQ, from, setFrom, to, setTo, statuses, setStatuses, types, setTypes, sort, setSort, limit, setLimit, view, setView };
}

// Types expected from the mock API
interface ThreadSummary {
  threadId: string;
  title: string;
  owner: { id: string; name: string };
  visibility: 'private' | 'team-ro' | 'link-ro';
  updatedAt: string;
  firstRunAt: string;
  lastRunAt: string;
  okCount: number;
  failCount: number;
  scope: { platform: string; store: string; platformId?: string; storeId?: string };
  evidenceCount?: Partial<Record<'table' | 'image' | 'pdf' | 'link', number>>;
}

// Repo returns a simplified item (createdAt), while UI may render richer fields.
type SimpleRun = { id: string; threadId: string; status: string; createdAt: string };
type RichRun = { id: string; ts: string; status: 'completed' | 'running' | 'paused' | 'failed' | 'canceled'; question: string; answerSummary?: string; type: 'Ask' | 'Agent'; evidenceCount?: Partial<Record<'table' | 'image' | 'pdf' | 'link', number>> };
type RunEntry = SimpleRun | RichRun;

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error';
function statusToBadgeVariant(status: string | undefined): BadgeVariant {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'primary';
    case 'paused':
      return 'warning';
    case 'canceled':
    default:
      return 'neutral';
  }
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

function head(text: string | undefined, maxChars = 24) {
  const s = (text || '').trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + '…';
}

function useAllowedQueryString(search: ReturnType<typeof useSearchParams>) {
  // Pick only allowed keys to pass to API
  const usp = new URLSearchParams();
  const keys = ['q', 'from', 'to', 'status', 'type', 'sort', 'limit', 'platformIds', 'storeIds', 'userIds'];
  keys.forEach((k) => {
    const v = search.get(k);
    if (v) usp.set(k, v);
  });
  return usp.toString();
}

function EvidenceInline({ e }: { e?: Partial<Record<'table' | 'image' | 'pdf' | 'link', number>> }) {
  if (!e) return null;
  const parts = Object.entries(e).map(([k, v]) => `${k}×${v}`);
  if (parts.length === 0) return null;
  return <MutedText>{parts.join(' ')}</MutedText>;
}

// Minimal modal shell with focus trap + scroll lock
function ModalShell({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </Modal>
  );
}

// Modal stubs (unchanged)
function ReRunModal({ isOpen, onClose, runId }: { isOpen: boolean; onClose: () => void; runId: string }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="再実行">
      <MutedText className="block">Run {runId} を同条件で再実行します（スタブ）。</MutedText>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button onClick={onClose}>閉じる</Button>
        <Button className="btn-lg" onClick={() => { console.log('rerun', { runId }); onClose(); }}>実行</Button>
      </div>
    </ModalShell>
  );
}
function ErrorDetailModal({ isOpen, onClose, runId }: { isOpen: boolean; onClose: () => void; runId: string }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="エラー詳細">
      <MutedText className="block">Run {runId} のエラー詳細（スタブ）。</MutedText>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button className="btn-lg" onClick={onClose}>閉じる</Button>
      </div>
    </ModalShell>
  );
}
function EvidenceListModal({ isOpen, onClose, targetId, targetType }: { isOpen: boolean; onClose: () => void; targetId: string; targetType: 'run' | 'thread' }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="エビデンス一覧">
      <MutedText className="block">{targetType} {targetId} のエビデンス一覧（スタブ）。</MutedText>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button className="btn-lg" onClick={onClose}>閉じる</Button>
      </div>
    </ModalShell>
  );
}
function ForkModal({ isOpen, onClose, runId, threadId }: { isOpen: boolean; onClose: () => void; runId?: string; threadId?: string }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="別スレッドとしてコピー">
      <div style={{ display: 'grid', rowGap: 8 }}>
        <MutedText className="block">
          対象：{runId ? `Run ${runId}` : `Thread ${threadId}`} をもとに、<strong>新しいスレッド</strong>を作成します。
        </MutedText>
        <div style={{ fontSize: 13 }}>
          ・元のスレッドは<strong>変更されません</strong><br />
          ・別案の検証や比較検討を<strong>安全に分岐</strong>できます<br />
          ・所有者は<strong>あなた</strong>になります（閲覧権限は元スレッドの設定に従う場合があります）
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button onClick={onClose}>キャンセル</Button>
        <Button className="btn-lg" onClick={() => { console.log('fork', { runId, threadId }); onClose(); }}>新しいスレッドを作成</Button>
      </div>
    </ModalShell>
  );
}
function HandoffModal({ isOpen, onClose, threadId }: { isOpen: boolean; onClose: () => void; threadId: string }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="引き継ぎ">
      <MutedText className="block">Thread {threadId} を別ユーザーに引き継ぐ（スタブ）。</MutedText>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button onClick={onClose}>キャンセル</Button>
        <Button className="btn-lg" onClick={() => { console.log('handoff', { threadId }); onClose(); }}>実行</Button>
      </div>
    </ModalShell>
  );
}

// RowMenu is provided by shared/ui/RowMenu

function ThreadTable() {
  const runLogsRepo = useRunLogsRepo();
  const search = useSearchParams();
  const router = useRouter();
  const [items, setItems] = React.useState<ThreadSummary[]>([]);
  const [nextCursor, setNextCursor] = React.useState<number | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [expanded, setExpanded] = React.useState<Record<string, { open: boolean; loading: boolean; error?: string; items: RunEntry[]; nextCursor?: number }>>({});

  const [menu, setMenu] = React.useState<null | { kind: 'thread' | 'run'; threadId: string; runId?: string }>(null);
  const [rerunId, setRerunId] = React.useState<string | null>(null);
  const [errorId, setErrorId] = React.useState<string | null>(null);
  const [evidenceTarget, setEvidenceTarget] = React.useState<null | { type: 'run' | 'thread'; id: string }>(null);
  const [forkTarget, setForkTarget] = React.useState<null | { runId?: string; threadId?: string }>(null);
  const [handoffThread, setHandoffThread] = React.useState<string | null>(null);

  // Flat view state
  const [flatRuns, setFlatRuns] = React.useState<{ run: RunEntry; thread: ThreadSummary }[]>([]);
  const [flatCursors, setFlatCursors] = React.useState<Record<string, number | undefined>>({});
  const [flatLoading, setFlatLoading] = React.useState(false);
  const [flatVisible, setFlatVisible] = React.useState(100);
  const [flatLastFetchedAt, setFlatLastFetchedAt] = React.useState<number | null>(null);

  const queryString = useAllowedQueryString(search);

  async function fetchThreads(cursor?: number) {
    setLoading(true);
    setError(null);
    try {
      // Repository経由（一覧APIは簡易応答: itemsのみ）
      const data = await runLogsRepo.list();
      setItems(data.items as unknown as ThreadSummary[]);
      setNextCursor(undefined);
    } catch (e: any) {
      setError(e?.message || 'fetch error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRuns(threadId: string, cursor?: number) {
    setExpanded((prev) => ({
      ...prev,
      [threadId]: { open: true, loading: true, items: prev[threadId]?.items || [], nextCursor: prev[threadId]?.nextCursor },
    }));
    try {
      const data = await runLogsRepo.byThread(threadId);
      setExpanded((prev) => ({
        ...prev,
        [threadId]: {
          open: true,
          loading: false,
          items: (data.items as RunEntry[]),
          nextCursor: (data as any).nextCursor as number | undefined,
        },
      }));
    } catch (e: any) {
      setExpanded((prev) => ({
        ...prev,
        [threadId]: { open: true, loading: false, items: prev[threadId]?.items || [], nextCursor: prev[threadId]?.nextCursor, error: e?.message || 'fetch error' },
      }));
    }
  }

  function toggleExpand(threadId: string) {
    setExpanded((prev) => {
      const cur = prev[threadId];
      const nextOpen = !cur?.open;
      const next = { ...prev, [threadId]: { ...(cur || { items: [] as RunEntry[] }), open: nextOpen, loading: false } } as typeof prev;
      if (nextOpen && (!cur || (cur.items.length === 0 && !cur.loading))) {
        fetchRuns(threadId);
      }
      return next;
    });
  }

  React.useEffect(() => {
    setItems([]);
    setNextCursor(undefined);
    setExpanded({});
    fetchThreads(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const hidePlatform = React.useMemo(() => {
    const s = new Set(items.map((i) => i.scope.platform).filter(Boolean));
    return s.size <= 1;
  }, [items]);

  // Client-side filters and sort
  const filtered = React.useMemo(() => {
    const q = (search.get('q') || '').trim().toLowerCase();
    const platformIds = (search.get('platformIds') || '').split(',').filter(Boolean);
    const storeIds = (search.get('storeIds') || '').split(',').filter(Boolean);
    const sort = search.get('sort') || 'updatedAt desc';

    let rows = items;

    if (q) {
      rows = rows.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (platformIds.length > 0) {
      rows = rows.filter((t) => {
        if (t.scope.platformId) return platformIds.includes(t.scope.platformId);
        // fallback: name includes
        return platformIds.some((pid) => t.scope.platform.toLowerCase().includes(pid.toLowerCase()));
      });
    }

    if (storeIds.length > 0) {
      rows = rows.filter((t) => {
        if (t.scope.storeId) return storeIds.includes(t.scope.storeId);
        // fallback: name includes
        return storeIds.some((sid) => t.scope.store.toLowerCase().includes(sid.toLowerCase()));
      });
    }

    rows = [...rows].sort((a, b) => (sort === 'updatedAt asc' ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt)));

    return rows;
  }, [items, search]);

  // Incremental rendering for threaded view (threads list)
  const [visibleCount, setVisibleCount] = React.useState(100);
  React.useEffect(() => {
    setVisibleCount(Math.min(100, filtered.length));
    if (filtered.length <= 100) return;
    let cancelled = false;
    function tick(next: number) {
      if (cancelled) return;
      setVisibleCount((prev) => {
        const val = Math.min(filtered.length, Math.max(prev, next));
        return val;
      });
      if (next < filtered.length) {
        setTimeout(() => tick(next + 100), 0);
      }
    }
    setTimeout(() => tick(200), 0);
    return () => { cancelled = true; };
  }, [filtered]);

  function openChat(threadId: string) {
    console.log('open chat (stub)', { threadId });
  }

  const view = search.get('view') || 'threaded';

  async function loadFlatFirstPages() {
    if (flatLoading) return;
    setFlatLoading(true);
    try {
      const threads = filtered;
      const limit = Math.min(5, threads.length);
      const queue = [...threads];
      const merged: { run: RunEntry; thread: ThreadSummary }[] = [];
      const cursors: Record<string, number | undefined> = {};

      async function worker() {
        while (queue.length) {
          const t = queue.shift()!;
          try {
            const data = await runLogsRepo.byThread(t.threadId);
            data.items.forEach((r) => merged.push({ run: r, thread: t }));
            cursors[t.threadId] = undefined;
          } catch {
            cursors[t.threadId] = undefined;
          }
        }
      }

      await Promise.all(Array.from({ length: limit }).map(() => worker()));

      function getTs(r: RunEntry): string { return (r as any).ts ?? (r as any).createdAt ?? ""; }
      merged.sort((a, b) => getTs(b.run).localeCompare(getTs(a.run)));
      setFlatRuns(merged);
      setFlatCursors(cursors);
      setFlatVisible(Math.min(100, merged.length));
      setFlatLastFetchedAt(Date.now());
      if (merged.length > 100) {
        let cancelled = false;
        function tick(next: number) {
          if (cancelled) return;
          setFlatVisible((prev) => Math.min(merged.length, Math.max(prev, next)));
          if (next < merged.length) setTimeout(() => tick(next + 100), 0);
        }
        setTimeout(() => tick(200), 0);
        return () => { cancelled = true; };
      }
    } finally {
      setFlatLoading(false);
    }
  }

  async function loadFlatMore() {
    if (flatLoading) return;
    setFlatLoading(true);
    try {
      const results = await Promise.all(filtered.map(async (t) => {
        try {
          const data = await runLogsRepo.byThread(t.threadId);
          return { thread: t, data } as const;
        } catch {
          return { thread: t, data: { items: [] as RunEntry[] } } as const;
        }
      }));
      const merged = [...flatRuns];
      const cursors: Record<string, number | undefined> = { ...flatCursors };
      results.forEach(({ thread, data }) => {
        (data.items as RunEntry[]).forEach((r) => merged.push({ run: r, thread }));
        cursors[thread.threadId] = (data as any).nextCursor as number | undefined;
      });
      function getTs(r: RunEntry): string { return (r as any).ts ?? (r as any).createdAt ?? ""; }
      merged.sort((a, b) => getTs(b.run).localeCompare(getTs(a.run)));
      setFlatRuns(merged);
      setFlatCursors(cursors);
      setFlatVisible((prev) => Math.min(merged.length, Math.max(prev, prev + 100)));
      setFlatLastFetchedAt(Date.now());
    } finally {
      setFlatLoading(false);
    }
  }

  // Auto-load only on entering flat view initially (do not auto refetch on every filter change)
  React.useEffect(() => {
    if (view === 'flat' && flatRuns.length === 0 && !flatLoading) {
      void loadFlatFirstPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  if (view === 'flat') {
    // Apply run-level filters (status/type/q/from/to) on flatRuns
    const selectedStatuses = (search.get('status') || '').split(',').filter(Boolean);
    const selectedTypes = (search.get('type') || '').split(',').filter(Boolean);
    const qRun = (search.get('q') || '').trim().toLowerCase();
    const from = (search.get('from') || '').trim();
    const to = (search.get('to') || '').trim();
    const fromTs = from ? Date.parse(`${from}T00:00:00+09:00`) : undefined;
    const toTs = to ? Date.parse(`${to}T23:59:59+09:00`) : undefined;

    const filteredFlat = (flatRuns.length > 0 ? flatRuns : []).filter(({ run, thread }) => {
      const runStatus = (run as any).status as string | undefined;
      const runType = (run as any).type as string | undefined;
      if (selectedStatuses.length > 0 && (!runStatus || !selectedStatuses.includes(runStatus))) return false;
      if (selectedTypes.length > 0 && (!runType || !selectedTypes.includes(runType))) return false;
      if (qRun) {
        const hay = thread.title.toLowerCase();
        if (!hay.includes(qRun)) return false;
      }
      const ts = Date.parse(((run as any).ts || (run as any).createdAt) as string);
      if (fromTs !== undefined && ts < fromTs) return false;
      if (toTs !== undefined && ts > toTs) return false;
      return true;
    });

    const flatRows = filteredFlat.slice(0, flatVisible);
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <MutedText className="block">
            全スレッドのRunを一覧表示します。
            {flatLastFetchedAt ? (
              <span style={{ marginLeft: 10, fontSize: 12 }}>
                最終取得: {new Date(flatLastFetchedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </MutedText>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button className="btn-lg" onClick={loadFlatFirstPages} disabled={flatLoading}>{flatLoading ? '読み込み中…' : '最新Runを取得'}</Button>
            <Button className="btn-lg" onClick={loadFlatMore} disabled={flatLoading || (Object.values(flatCursors).every((v) => v === undefined))}>{flatLoading ? '読み込み中…' : 'さらに読み込む'}</Button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table size="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>スコープ</Table.Th>
                <Table.Th>スレッド</Table.Th>
                <Table.Th>ステータス</Table.Th>
                <Table.Th>時刻</Table.Th>
                <Table.Th>指示・質問</Table.Th>
                <Table.Th>回答</Table.Th>
                <Table.Th>タイプ</Table.Th>
                <Table.Th>Evidence</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {flatRows.map(({ run, thread }) => (
                <Table.Tr key={run.id}>
                  <Table.Td>
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <Badge size="sm" variant="neutral"><MutedText>{thread.scope.platform}</MutedText></Badge>
                      <Badge size="sm" variant="primary">{thread.scope.store}</Badge>
                    </span>
                  </Table.Td>
                  <Table.Td>{thread.title}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant={statusToBadgeVariant((run as any).status)}>
                      {ALL_STATUS.find((s) => s.key === (run as any).status)?.label || (run as any).status}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(((run as any).ts || (run as any).createdAt) as string)}</Table.Td>
                  <Table.Td title={(run as any).question as string | undefined}>{head((run as any).question as string | undefined)}</Table.Td>
                  <Table.Td>{(run as any).answerSummary || '-'}</Table.Td>
                  <Table.Td>{(run as any).type || '-'}</Table.Td>
                  <Table.Td><EvidenceInline e={(run as any).evidenceCount} /></Table.Td>
                </Table.Tr>
              ))}
              {flatRuns.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8}><MutedText>Runが読み込まれていません。「最新Runを取得」を押してください。</MutedText></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    );
  }

  const rowsToRender = filtered.slice(0, visibleCount);
  return (
    <div onClick={() => setMenu(null)}>
      {error && (
        <MutedText variant="error">読み込みに失敗しました: {error}</MutedText>
      )}
      <div style={{ overflowX: 'auto' }}>
        <Table size="sm" role="treegrid" aria-rowcount={rowsToRender.length} onClick={() => setMenu(null)}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>スレッド</Table.Th>
              <Table.Th>オーナー</Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>更新</Table.Th>
              <Table.Th>スコープ</Table.Th>
              <Table.Th aria-label="actions">…</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rowsToRender.map((t) => {
              const ex = expanded[t.threadId];
              const isOpen = !!ex?.open;
              const isThreadMenu = menu?.kind === 'thread' && menu.threadId === t.threadId;
              const regionId = `runs-${t.threadId}`;
              return (
                <React.Fragment key={t.threadId}>
                  <Table.Tr aria-expanded={isOpen}>
                    <Table.Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Button
                          aria-label={isOpen ? '折りたたむ' : '展開する'}
                          aria-expanded={isOpen}
                          aria-controls={regionId}
                          onClick={() => toggleExpand(t.threadId)}
                        >
                          {isOpen ? '▼' : '▶︎'}
                        </Button>
                        <span style={{ fontWeight: 600 }}>{t.title}</span>
                      </div>
                      <MutedText className="block" style={{ fontSize: 12, marginTop: 2 }}>
                        <EvidenceInline e={t.evidenceCount} />
                      </MutedText>
                    </Table.Td>
                    <Table.Td>{t.owner.name}</Table.Td>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(t.updatedAt)}</Table.Td>
                    <Table.Td>
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {!hidePlatform && (<Badge size="sm" variant="neutral"><MutedText>{t.scope.platform}</MutedText></Badge>)}
                        <Badge size="sm" variant="primary">{t.scope.store}</Badge>
                      </span>
                    </Table.Td>
                    <Table.Td style={{ position: 'relative' }}>
                      <Button className="btn-sm" onClick={(e) => { e.stopPropagation(); setMenu(isThreadMenu ? null : { kind: 'thread', threadId: t.threadId }); }}>…</Button>
                      <RowMenu
                        isOpen={isThreadMenu}
                        onClose={() => setMenu(null)}
                        className=""
                      >
                        <div role="menuitem" tabIndex={0} className="w-full text-left px-3 py-2 text-sm rounded" onClick={() => setForkTarget({ threadId: t.threadId })}>
                          別スレッドとしてコピー…
                        </div>
                      </RowMenu>
                    </Table.Td>
                  </Table.Tr>
                  {isOpen && (
                    <Table.Tr>
                      <Table.Td id={regionId} colSpan={5} style={{ padding: 8 }}>
                        <div style={{ overflowX: 'auto' }}>
                          {ex?.error && <div>子行の取得に失敗しました: {ex.error}</div>}
                          <Table size="sm">
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>ステータス</Table.Th>
                                <Table.Th>時刻</Table.Th>
                                <Table.Th>指示・質問</Table.Th>
                                <Table.Th>回答</Table.Th>
                                <Table.Th>タイプ</Table.Th>
                                <Table.Th>Evidence</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {(ex?.items || []).map((r) => {
                                const isRunMenu = false;
                                return (
                                  <Table.Tr key={r.id}>
                                    <Table.Td>
                                      <Badge size="sm" variant={statusToBadgeVariant((r as any).status)}>
                                        {ALL_STATUS.find((s) => s.key === (r as any).status)?.label || (r as any).status}
                                      </Badge>
                                    </Table.Td>
                                    <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(((r as any).ts || (r as any).createdAt) as string)}</Table.Td>
                                    <Table.Td title={(r as any).question as string | undefined}>{head((r as any).question as string | undefined)}</Table.Td>
                                    <Table.Td>{(r as any).answerSummary || '-'}</Table.Td>
                                    <Table.Td>{(r as any).type || '-'}</Table.Td>
                                    <Table.Td><EvidenceInline e={(r as any).evidenceCount} /></Table.Td>
                                  </Table.Tr>
                                );
                              })}
                              {!ex?.loading && (ex?.items?.length || 0) === 0 && (
                                <Table.Tr>
                                  <Table.Td colSpan={6}><MutedText>子行はありません。</MutedText></Table.Td>
                                </Table.Tr>
                              )}
                            </Table.Tbody>
                          </Table>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                          {ex?.nextCursor !== undefined ? (
                            <Button className="btn-lg" onClick={(e) => { e.stopPropagation(); fetchRuns(t.threadId, ex.nextCursor); }} disabled={!!ex?.loading}>
                              {ex?.loading ? '読み込み中…' : '子行をもっと見る'}
                            </Button>
                          ) : (
                            <MutedText style={{ fontSize: 12 }}>{ex?.loading ? '読み込み中…' : '以上です'}</MutedText>
                          )}
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </React.Fragment>
              );
            })}
            {!loading && rowsToRender.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}><MutedText>結果がありません。</MutedText></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        {nextCursor !== undefined ? (
          <Button className="btn-lg" onClick={() => fetchThreads(nextCursor)} disabled={loading}>
            {loading ? '読み込み中…' : 'もっと見る'}
          </Button>
        ) : (
          <MutedText style={{ fontSize: 12 }}>{loading ? '読み込み中…' : '以上です'}</MutedText>
        )}
      </div>

      {/* Modals mount here */}
      <ReRunModal isOpen={!!rerunId} onClose={() => setRerunId(null)} runId={rerunId || ''} />
      <ErrorDetailModal isOpen={!!errorId} onClose={() => setErrorId(null)} runId={errorId || ''} />
      <EvidenceListModal isOpen={!!evidenceTarget} onClose={() => setEvidenceTarget(null)} targetId={evidenceTarget?.id || ''} targetType={(evidenceTarget?.type || 'run')} />
      <ForkModal isOpen={!!forkTarget} onClose={() => setForkTarget(null)} runId={forkTarget?.runId} threadId={forkTarget?.threadId} />
      <HandoffModal isOpen={!!handoffThread} onClose={() => setHandoffThread(null)} threadId={handoffThread || ''} />
    </div>
  );
}

export default function ExecutionLogsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const state = useQueryState();

  function toggle(list: string[], v: string) {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  function apply() {
    const usp = new URLSearchParams(search.toString());
    const { q, from, to, statuses, types, sort, limit, view } = state;
    function setOrDelete(key: string, val: string) {
      if (val) usp.set(key, val); else usp.delete(key);
    }
    setOrDelete('q', q.trim());
    setOrDelete('from', from.trim());
    setOrDelete('to', to.trim());
    setOrDelete('status', statuses.join(','));
    setOrDelete('type', types.join(','));
    setOrDelete('sort', sort);
    setOrDelete('limit', limit);
    setOrDelete('view', view);
    router.push(`/settings/run-logs?${usp.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.push('/settings/run-logs', { scroll: false });
  }

  return (
    <div>
      <section className="card" style={{ alignSelf: 'start' }}>
        <SectionTitle>実行ログ</SectionTitle>
        <MutedText className="block">スレッド単位で実行履歴を参照できます。</MutedText>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <SectionTitle level={3}>フィルター</SectionTitle>
        <div style={{ display: 'grid', rowGap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 180px 120px 120px', gap: 12 }}>
            <Input placeholder="スレッド名で検索" value={state.q} onChange={(e) => state.setQ(e.target.value)} />
            <Input placeholder="開始日 (YYYY-MM-DD)" value={state.from} onChange={(e) => state.setFrom(e.target.value)} />
            <Input placeholder="終了日 (YYYY-MM-DD)" value={state.to} onChange={(e) => state.setTo(e.target.value)} />
            <Select value={state.sort} onChange={(v) => state.setSort(v)}>
              <option value="updatedAt desc">更新 新→旧</option>
              <option value="updatedAt asc">更新 旧→新</option>
            </Select>
            <Select value={state.limit} onChange={(v) => state.setLimit(v)}>
              <option value="50">50件</option>
              <option value="100">100件</option>
              <option value="200">200件</option>
            </Select>
            <Select value={state.view} onChange={(v) => state.setView(v)}>
              <option value="threaded">Threaded</option>
              <option value="flat">Flat</option>
            </Select>
          </div>

          {state.view === 'flat' && (
            <>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ステータス</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_STATUS.map((s) => (
                    <FilterChip key={s.key} pressed={state.statuses.includes(s.key)} onClick={() => state.setStatuses((prev) => toggle(prev, s.key))}>{s.label}</FilterChip>
                  ))}
                </div>
              </div>

              <div>
                <div className="label" style={{ marginBottom: 6 }}>タイプ</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_TYPES.map((t) => (
                    <FilterChip key={t.key} pressed={state.types.includes(t.key)} onClick={() => state.setTypes((prev) => toggle(prev, t.key))}>{t.label}</FilterChip>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={clearAll}>クリア</Button>
            <Button className="btn-lg" onClick={apply}>適用</Button>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <SectionTitle level={3}>ログ一覧</SectionTitle>
        <ThreadTable />
      </section>

      {/* Toasts are handled by shared ToastProvider in settings layout */}
    </div>
  );
}


