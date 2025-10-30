export type ConnectionService = {
  type: 'sp_ads' | 'dsp' | 'vendor' | string;
  status: 'ok' | 'failed' | 'needs_auth' | string;
  lastSyncAt?: string;
  tokenExpiryAt?: string;
  consecutiveFailures: number;
  jobId?: string;
};

// Helper to build the default services used by settings Connections mock
export function buildDefaultServices(inDays: (days: number) => string): ConnectionService[] {
  return [
    {
      type: 'sp_ads',
      status: 'ok',
      lastSyncAt: inDays(-1),
      tokenExpiryAt: inDays(10),
      consecutiveFailures: 0,
      jobId: undefined,
    },
    {
      type: 'dsp',
      status: 'failed',
      lastSyncAt: inDays(-3),
      tokenExpiryAt: inDays(3),
      consecutiveFailures: 2,
      jobId: undefined,
    },
    {
      type: 'vendor',
      status: 'needs_auth',
      lastSyncAt: undefined,
      tokenExpiryAt: undefined,
      consecutiveFailures: 0,
      jobId: undefined,
    },
  ];
}



