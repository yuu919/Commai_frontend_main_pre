export type RunLogThread = {
  id: string;
  threadId: string;
  title: string;
  owner: { id: string; name: string };
  visibility: 'team-ro' | 'private';
  updatedAt: string;
  firstRunAt: string;
  lastRunAt: string | undefined;
  okCount: number;
  failCount: number;
  scope: { platform: string; store: string; platformId: string; storeId: string };
  evidenceCount: { table: number; image: number };
};

export function buildRunLogThreads(count = 25, now = Date.now()): RunLogThread[] {
  const mk = (idx: number): RunLogThread => ({
    id: `th-${idx}`,
    threadId: `th-${idx}`,
    title: idx % 2 === 0 ? `在庫同期ジョブ #${idx}` : `広告日次レポート #${idx}`,
    owner: { id: `u-${(idx % 5) + 1}`, name: `User ${(idx % 5) + 1}` },
    visibility: (idx % 3 === 0 ? 'team-ro' : 'private'),
    updatedAt: new Date(now - idx * 3600_000).toISOString(),
    firstRunAt: new Date(now - (idx + 24) * 3600_000).toISOString(),
    lastRunAt: new Date(now - (idx % 6) * 3600_000).toISOString(),
    okCount: (idx % 7) + 1,
    failCount: idx % 2,
    scope: { platform: 'Amazon', store: idx % 2 ? 'Default Store' : 'JP Store', platformId: 'amazon', storeId: idx % 2 ? 'store-1' : 'store-2' },
    evidenceCount: { table: (idx % 3), image: (idx % 2) },
  });
  return Array.from({ length: count }).map((_, i) => mk(i + 1));
}

export type RunLogItem = {
  id: string;
  ts: string;
  status: 'failed' | 'completed';
  type: 'Ask' | 'Agent';
  question: string;
  answerSummary: string;
};

export function buildRunsForThread(threadId: string, count = 15, now = Date.now()): RunLogItem[] {
  const mkRun = (i: number): RunLogItem => ({
    id: `${threadId}-run-${i}`,
    ts: new Date(now - i * 1800_000).toISOString(),
    status: i % 3 === 0 ? 'failed' : 'completed',
    type: i % 2 === 0 ? 'Ask' : 'Agent',
    question: `質問サンプル ${i}`,
    answerSummary: i % 3 === 0 ? '失敗: タイムアウト' : `回答サマリ ${i}`,
  });
  return Array.from({ length: count }).map((_, i) => mkRun(i + 1));
}


