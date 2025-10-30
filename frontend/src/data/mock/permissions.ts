// Expanded to match legacy richness: multiple stores, users, assignments and attributes used in UI.
export const mockPermissions = {
  platforms: [
    { id: 'amazon', name: 'Amazon', connection: 'ok' },
  ],
  stores: [
    { id: 'amz-jp-1', platformId: 'amazon', name: 'Amazon JP 1', region: 'JP', connection: 'ok', sync: { status: 'done', at: '2025-09-01T10:00:00Z' } },
    { id: 'amz-jp-2', platformId: 'amazon', name: 'Amazon JP 2', region: 'JP', connection: 'ok', sync: { status: 'idle' } },
  ],
  users: Array.from({ length: 24 }).map((_, i) => {
    const id = `u${i + 1}`;
    const name = `User ${i + 1}`;
    const email = `user${i + 1}@example.com`;
    const status = i % 7 === 0 ? 'invited' : i % 11 === 0 ? 'suspended' : 'active';
    return { id, name, email, status };
  }),
  assignments: (() => {
    const roles = ['owner', 'manager', 'general', 'none'] as const;
    const list: any[] = [];
    // org-level
    for (let i = 0; i < 5; i++) {
      list.push({
        id: `a-org-${i + 1}`,
        subject: 'org',
        userId: `u${i + 1}`,
        role: roles[i % roles.length],
        updatedAt: '2025-09-01T00:00:00Z',
        updatedBy: 'system',
      });
    }
    // store-level (first store)
    Array.from({ length: 19 }).forEach((_, idx) => {
      const u = idx + 6;
      list.push({
        id: `a-store-${idx + 1}`,
        subject: 'store',
        subjectId: 'amz-jp-1',
        userId: `u${u}`,
        role: roles[(idx + 1) % roles.length],
        updatedAt: '2025-09-05T00:00:00Z',
        updatedBy: 'u2',
      });
    });
    return list;
  })(),
} as const;


