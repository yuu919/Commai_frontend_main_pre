"use client";
import React from 'react';
import Button from '@ui/Button';
import { useSearchParams } from 'next/navigation';
import Modal from '@ui/Modal';
import RowMenu from '@ui/RowMenu';
import Divider from '@ui/Divider';
import MutedText from '@ui/MutedText';
import FilterChip from '@ui/FilterChip';
import Badge from '@ui/Badge';
import Table from '@ui/Table';
import Surface from '@ui/Surface';
import { useConnectionsRepo } from '@/app/providers';
import type { ConnectionsRepo, ConnectionItem } from '@/features/settings/api/types';

function StatusBadge({ status }: { status: string }) {
  const label = status === 'ok' ? '正常' : status === 'needs_auth' ? '要認証' : status === 'syncing' ? '同期中' : status === 'failed' ? '失敗' : '未接続';
  const variant: import('@ui/Badge').BadgeVariant =
    status === 'ok' ? 'success' :
    status === 'needs_auth' ? 'warning' :
    status === 'failed' ? 'error' :
    status === 'syncing' ? 'primary' : 'neutral';
  return <Badge variant={variant}>{label}</Badge>;
}

// Local types to avoid external coupling
type ServiceType = 'sp_ads' | 'dsp' | 'vendor';
type ConnectSession = { state: 'success' | 'partial' | 'failed'; storeId: string; details: Array<{ service: ServiceType; status: 'success' | 'failed'; message?: string }> };
type StoreConnection = { storeId: string; storeName: string; services: Array<{ type: ServiceType | 'sp' | 'ads'; status: string; lastSyncAt?: string; tokenExpiryAt?: string; consecutiveFailures: number; jobId?: string }> };
type ConnectionSummary = { totalStores: number; needsAuth: number; syncing: number; failed: number; ok: number };

function ConnectWizard({ isOpen, onClose, resumeSessionId, connectionsRepo }: { isOpen: boolean; onClose: () => void; resumeSessionId?: string; connectionsRepo: ConnectionsRepo }) {
  const [step, setStep] = React.useState(1);
  const [selectedServices, setSelectedServices] = React.useState<('sp' | 'ads' | 'sp_ads' | 'dsp' | 'vendor')[]>([]);
  const [validationError, setValidationError] = React.useState<string>('');
  const [selectedStore, setSelectedStore] = React.useState('');
  const [availableStores, setAvailableStores] = React.useState<Array<{ id: string; name: string }>>([]);
  const [sessionId, setSessionId] = React.useState('');
  const [scopes, setScopes] = React.useState<Record<ServiceType, string[]>>({} as any);
  const [consent, setConsent] = React.useState(false);
  const [session, setSession] = React.useState<ConnectSession | null>(null);
  const [notifyOnReady, setNotifyOnReady] = React.useState(false);
  
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const lastFocused = React.useRef<HTMLElement | null>(null);

  // Focus trap and scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = (document.activeElement as HTMLElement) || null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      // No Esc close - explicit close only
      if (e.key === 'Tab') {
        const root = containerRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey) {
          if (active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener('keydown', onKey);

    // Focus first element
    setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      first?.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus();
    };
  }, [isOpen]);

  // Load prerequisites and handle session resume
  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const data = await connectionsRepo.prereq();
        setAvailableStores(data.stores);
        if (!data.hasStore) setAvailableStores([]);
        if (resumeSessionId) { setSessionId(resumeSessionId); setStep(3); }
      } catch (e) { console.error('prereq error', e); }
    })();
  }, [isOpen, resumeSessionId]);

  // Check session status when step 3 is reached
  React.useEffect(() => {
    if (step !== 3 || !sessionId) return;
    (async () => {
      try { const data = await connectionsRepo.sessionStatus({ sessionId }); setSession(data as any); }
      catch (e) { console.error('session status error', e); }
    })();
  }, [step, sessionId]);

  function toggleService(service: 'sp' | 'ads' | 'sp_ads' | 'dsp' | 'vendor') {
    setValidationError('');
    setSelectedServices((prev) => {
      const isSelected = prev.includes(service);
      let next = isSelected ? prev.filter((s) => s !== service) : [...prev, service];
      
      // Exclusive logic: vendor vs SP-related services
      if (service === 'vendor' && !isSelected) {
        next = next.filter((s) => !['sp', 'ads', 'sp_ads'].includes(s));
        next.push('vendor');
      } else if (['sp', 'ads', 'sp_ads'].includes(service) && !isSelected) {
        next = next.filter((s) => s !== 'vendor');
        if (!isSelected) next.push(service);
      }
      
      return next;
    });
  }

  const canProceed = selectedServices.length > 0;

  async function proceedToStep2() {
    if (selectedServices.length === 0) {
      setValidationError('サービスを1つ以上選択してください。');
      return;
    }
    setValidationError('');
    try {
      const apiServices = Array.from(new Set(selectedServices.map(s => (s === 'sp' || s === 'ads') ? 'sp_ads' : (s as ServiceType))));
      const storeId = selectedStore || availableStores[0]?.id || '';
      if (!storeId) {
        setValidationError('対象ストアが見つかりません。');
        return;
      }
      const data = await connectionsRepo.initiate({ storeId, services: apiServices as any });
      setSessionId(data.sessionId);
      setScopes(data.scopes || {});
      setStep(2);
    } catch (e) {
      console.error('initiate error', e);
    }
  }

  async function proceedToAuth() {
    if (!consent || !sessionId) return;
    try { const data = await connectionsRepo.authorize({ sessionId }); window.location.href = data.authUrl; }
    catch (e) { console.error('authorize error', e); }
  }

  async function handleNotifyToggle() {
    if (!session || !notifyOnReady) return;
    try {
      const services = (session.details as Array<{ service: ServiceType; status: 'success' | 'failed' }> )
        .filter((d) => d.status === 'success')
        .map((d) => d.service);
      await connectionsRepo.notifyOnReady({ storeId: session.storeId, services });
    }
    catch (e) { console.error('notify error', e); }
  }

  React.useEffect(() => {
    if (notifyOnReady) {
      handleNotifyToggle();
    }
  }, [notifyOnReady]);

  // Reset state when closing
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedServices([]);
      setSelectedStore('');
      setSessionId('');
      setScopes({} as any);
      setConsent(false);
      setSession(null);
      setNotifyOnReady(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`接続ウィザード - Step ${step}`}>
      <div ref={containerRef}>
        {/* header is provided by Modal */}
        
        {step === 1 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Service Selection */}
            <div>
              <div className="label" style={{ marginBottom: 8 }}>接続するサービス（1つ以上選択）</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes('sp')} 
                    onChange={() => toggleService('sp')}
                    disabled={selectedServices.includes('vendor')}
                  />
                  <span>SP</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes('ads')} 
                    onChange={() => toggleService('ads')}
                    disabled={selectedServices.includes('vendor')}
                  />
                  <span>広告</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes('sp_ads')} 
                    onChange={() => toggleService('sp_ads')}
                    disabled={selectedServices.includes('vendor')}
                  />
                  <span>SP&広告（まとめて接続）</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes('dsp')} 
                    onChange={() => toggleService('dsp')}
                  />
                  <span>DSP</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes('vendor')} 
                    onChange={() => toggleService('vendor')}
                    disabled={selectedServices.some(s => ['sp', 'ads', 'sp_ads'].includes(s))}
                  />
                  <span>ベンダー</span>
                </label>
              </div>
              {validationError && (
                <MutedText variant="error" className="mt-2">{validationError}</MutedText>
              )}
            </div>

            {/* Store Selection - Remove as per requirements */}
            <div style={{ display: 'none' }}>
              <div className="label" style={{ marginBottom: 8 }}>対象ストア</div>
              <MutedText>接続対象のストアは自動で決定されます。</MutedText>
            </div>

            {/* Notice */}
            {selectedServices.includes('sp_ads') && (
              <Surface bordered radius="sm" className="p-3" variant="secondary">
                <strong>注意:</strong> SP＋広告は連続で認証します。片方だけ成功しても、残りは後で再認証できます。
              </Surface>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={onClose}>閉じる</Button>
              <Button 
                className="btn-lg" 
                onClick={proceedToStep2}
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Scope Summary */}
            <div>
              <div className="label" style={{ marginBottom: 8 }}>要求する権限</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {Array.from(new Set(selectedServices.map(s => (s === 'sp' || s === 'ads') ? 'sp_ads' : s as ServiceType))).map((service) => {
                  const apiService = service as ServiceType;
                  const serviceScopes = scopes[apiService] || [];
                  const serviceName = apiService === 'sp_ads' ? 'SP&広告' : apiService === 'dsp' ? 'DSP' : 'ベンダー';
                  return (
              <Surface key={apiService} bordered radius="sm" className="p-3" variant="secondary">
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{serviceName}</div>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <MutedText style={{ fontSize: 14 }}>
                          {serviceScopes.length > 0 ? serviceScopes.map((scope: string, i: number) => (
                            <li key={i}>{scope}</li>
                          )) : (
                            <li>基本的なアクセス権限</li>
                          )}
                        </MutedText>
                      </ul>
                    </Surface>
                  );
                })}
              </div>
            </div>

            {/* Consent */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={consent} 
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>上記の権限に同意し、Amazonで認証します。</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <Button onClick={() => { setStep(1); setConsent(false); }}>戻る</Button>
              <Button 
                className="btn-lg" 
                disabled={!consent}
                onClick={proceedToAuth}
              >
                認証に進む
              </Button>
            </div>
          </div>
        )}

        {step === 3 && session && (
          <div style={{ display: 'grid', gap: 16 }}>
            {session.state === 'success' && (
              <>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="text-lg font-semibold text-fg-success-strong mb-2">接続を開始しました</div>
                  <MutedText>初回同期を開始しました。最大24時間かかる場合があります。</MutedText>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={notifyOnReady} 
                      onChange={(e) => setNotifyOnReady(e.target.checked)}
                    />
                    <span>完了したら通知</span>
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={onClose}>接続一覧に戻る</Button>
                  <Button className="btn-lg" onClick={() => { onClose(); document.getElementById(`store-${session.storeId}`)?.scrollIntoView(); }}>このストアの接続を表示</Button>
                </div>
              </>
            )}

            {session.state === 'partial' && (
              <>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="text-lg font-semibold text-fg-warn-strong mb-2">部分的に成功しました</div>
                  <MutedText>同期は成功側から開始しました（最大24時間）</MutedText>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>結果</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {session.details.map((detail) => {
                      const serviceName = detail.service === 'sp_ads' ? 'SP＋広告' : detail.service === 'dsp' ? 'DSP' : 'ベンダー';
                      return (
                        <Surface key={detail.service} bordered radius="sm" className="flex justify-between items-center p-2">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{serviceName}</span>
                            <StatusBadge status={detail.status === 'success' ? 'ok' : 'failed'} />
                            {detail.message && <span style={{ fontSize: 12 }}><MutedText>{detail.message}</MutedText></span>}
                          </div>
                          {detail.status === 'failed' && (
                              <Button className="btn-sm">再認証する</Button>
                          )}
                        </Surface>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button className="btn-lg" onClick={onClose}>接続一覧に戻る</Button>
                </div>
              </>
            )}

            {session.state === 'failed' && (
              <>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="text-lg font-semibold text-fg-error-soft mb-2">接続に失敗しました</div>
                  <MutedText>{session.details[0]?.message || '認証中にエラーが発生しました'}</MutedText>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={onClose}>あとで行う</Button>
                  <Button className="btn-lg" onClick={() => { setStep(1); setConsent(false); }}>やり直す</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

type TableRow = {
  storeId: string;
  storeName: string;
  serviceType: ServiceType | 'sp' | 'ads';
  serviceName: string;
  status: string;
  lastSyncAt?: string;
  tokenExpiryAt?: string;
  consecutiveFailures: number;
  jobId?: string;
  hasOldSync: boolean;
  hasExpiringToken: boolean;
  hasMultipleFailures: boolean;
};

function normalizeConnections(items: ConnectionItem[]): StoreConnection[] {
  // Incoming items are flat; group by storeId and map to services
  const map = new Map<string, StoreConnection>();
  for (const it of items) {
    const key = it.storeId;
    const cur = map.get(key) || { storeId: it.storeId, storeName: it.storeName, services: [] } as StoreConnection;
    cur.services.push({
      type: (it.service as any),
      status: it.status,
      lastSyncAt: (it as any).lastSyncAt,
      tokenExpiryAt: (it as any).tokenExpiryAt,
      consecutiveFailures: Number((it as any).consecutiveFailures || 0),
      jobId: (it as any).jobId,
    });
    map.set(key, cur);
  }
  return Array.from(map.values());
}

function ModalShell({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const lastFocused = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = (document.activeElement as HTMLElement) || null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const root = containerRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey) {
          if (active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener('keydown', onKey);

    setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      first?.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return <Modal isOpen={isOpen} onClose={onClose} title={title}>{children}</Modal>;
}

export default function ConnectionsSettingsPage() {
  const connectionsRepo = useConnectionsRepo();
  const searchParams = useSearchParams();
  const [summary, setSummary] = React.useState<ConnectionSummary | null>(null);
  const [stores, setStores] = React.useState<StoreConnection[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<{ type: 'unlink'; storeId: string; service: ServiceType } | null>(null);
  const [errorDetail, setErrorDetail] = React.useState<{ storeId: string; service: ServiceType; error: any } | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [rowMenu, setRowMenu] = React.useState<{ storeId: string; serviceType: string } | null>(null);

  // Handle deep linking
  const modalParam = searchParams.get('modal');
  const sessionIdParam = searchParams.get('sessionId');
  const resumeSessionId = modalParam === 'connect' && sessionIdParam ? sessionIdParam : undefined;

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await connectionsRepo.list();
        // Normalize flat items into store -> services rows
        setStores(normalizeConnections((data.items || []) as ConnectionItem[]));
      } catch (e) {
        console.error('fetch error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-open wizard on deep link
  React.useEffect(() => {
    if (modalParam === 'connect') {
      setShowWizard(true);
    }
  }, [modalParam]);

  // Flatten stores into table rows
  const tableRows = React.useMemo(() => {
    const now = Date.now();
    const rows: TableRow[] = [];
    
    stores.forEach((store) => {
      store.services.forEach((svc) => {
        if (svc.type === 'sp_ads') {
          // Split SP+広告 into separate rows
          ['sp', 'ads'].forEach((subType) => {
            const hasOldSync = svc.lastSyncAt && (now - Date.parse(svc.lastSyncAt)) > 24 * 60 * 60 * 1000;
            const hasExpiringToken = svc.tokenExpiryAt && (Date.parse(svc.tokenExpiryAt) - now) < 7 * 24 * 60 * 60 * 1000;
            const hasMultipleFailures = svc.consecutiveFailures >= 3;
            
            rows.push({
              storeId: store.storeId,
              storeName: store.storeName,
              serviceType: subType as 'sp' | 'ads',
              serviceName: subType === 'sp' ? 'SP' : '広告',
              status: svc.status,
              lastSyncAt: svc.lastSyncAt,
              tokenExpiryAt: svc.tokenExpiryAt,
              consecutiveFailures: svc.consecutiveFailures,
              jobId: svc.jobId,
              hasOldSync: !!hasOldSync,
              hasExpiringToken: !!hasExpiringToken,
              hasMultipleFailures: !!hasMultipleFailures,
            });
          });
        } else {
          // Regular services (DSP, vendor)
          const hasOldSync = svc.lastSyncAt && (now - Date.parse(svc.lastSyncAt)) > 24 * 60 * 60 * 1000;
          const hasExpiringToken = svc.tokenExpiryAt && (Date.parse(svc.tokenExpiryAt) - now) < 7 * 24 * 60 * 60 * 1000;
          const hasMultipleFailures = svc.consecutiveFailures >= 3;
          
          rows.push({
            storeId: store.storeId,
            storeName: store.storeName,
            serviceType: svc.type,
            serviceName: svc.type === 'dsp' ? 'DSP' : 'ベンダー',
            status: svc.status,
            lastSyncAt: svc.lastSyncAt,
            tokenExpiryAt: svc.tokenExpiryAt,
            consecutiveFailures: svc.consecutiveFailures,
            jobId: svc.jobId,
            hasOldSync: !!hasOldSync,
            hasExpiringToken: !!hasExpiringToken,
            hasMultipleFailures: !!hasMultipleFailures,
          });
        }
      });
    });
    
    return rows;
  }, [stores]);

  // Apply status filter
  const filteredRows = React.useMemo(() => {
    if (!statusFilter) return tableRows;
    return tableRows.filter((row) => row.status === statusFilter);
  }, [tableRows, statusFilter]);

  async function reloadAll() {
    try {
      const data = await connectionsRepo.list();
      setStores(normalizeConnections((data.items || []) as ConnectionItem[]));
    } catch (e) {
      console.error('reload error', e);
    }
  }

  async function handleReauth(storeId: string, service: ServiceType) {
    try {
      const { authUrl } = await connectionsRepo.reauthUrl({ storeId, service });
      window.location.href = authUrl;
    } catch (e) {
      console.error('reauth error', e);
    }
  }

  async function handleSync(storeId: string, service: ServiceType, bulk = false) {
    try {
      await connectionsRepo.sync({ storeId, service });
      await reloadAll();
    } catch (e) {
      console.error('sync error', e);
    }
  }

  async function handleUnlink() {
    if (!confirmAction) return;
    try { await connectionsRepo.unlink({ storeId: confirmAction.storeId, service: confirmAction.service }); await reloadAll(); setConfirmAction(null); }
    catch (e) { console.error('unlink error', e); }
  }

  async function showErrorDetail(storeId: string, service: ServiceType) {
    try { const e = await connectionsRepo.lastError({ storeId, service }); setErrorDetail({ storeId, service, error: e || { code: 'N/A', message: '情報がありません' } }); }
    catch (e) { console.error('error detail error', e); }
  }

  return (
    <div onClick={() => setRowMenu(null)}>
      {/* Header */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-card-title">接続</h2>
          <Button className="btn-lg" onClick={() => setShowWizard(true)}>＋接続する</Button>
        </div>
        <Divider />
        <MutedText>Amazon（SP・広告・DSP・ベンダー）との接続を管理します。</MutedText>
      </div>

      {/* KPI Filter Chips */}
      {summary && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <FilterChip pressed={statusFilter === null} onClick={() => setStatusFilter(null)}>全て ({summary.totalStores})</FilterChip>
          <FilterChip pressed={statusFilter === 'needs_auth'} onClick={() => setStatusFilter('needs_auth')} className={statusFilter === 'needs_auth' ? 'text-primary' : 'text-warn'}>要認証 ({summary.needsAuth})</FilterChip>
          <FilterChip pressed={statusFilter === 'syncing'} onClick={() => setStatusFilter('syncing')} className={statusFilter === 'syncing' ? 'text-primary' : 'text-info'}>同期中 ({summary.syncing})</FilterChip>
          <FilterChip pressed={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} className={statusFilter === 'failed' ? 'text-primary' : 'text-error'}>失敗 ({summary.failed})</FilterChip>
          <FilterChip pressed={statusFilter === 'ok'} onClick={() => setStatusFilter('ok')} className={statusFilter === 'ok' ? 'text-primary' : 'text-success'}>正常 ({summary.ok || 0})</FilterChip>
        </div>
      )}

      {/* Connection Table */}
      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <h3 className="section-card-title">接続一覧</h3>
        <Divider />
        {loading && <MutedText>読み込み中...</MutedText>}
        {!loading && filteredRows.length === 0 && <MutedText>接続がありません。</MutedText>}
        
        <div style={{ overflowX: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <Table size="sm" onClick={() => setRowMenu(null)}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>状態</Table.Th>
                <Table.Th>ストア</Table.Th>
                <Table.Th>サービス</Table.Th>
                <Table.Th>最終同期</Table.Th>
                <Table.Th>期限</Table.Th>
                <Table.Th>主アクション</Table.Th>
                <Table.Th>…</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredRows.map((row, idx) => {
                const rowHighlight = (row.hasOldSync || row.hasExpiringToken || row.hasMultipleFailures) ? 'warn' : undefined as any;
                
                // Primary action based on status priority
                let primaryAction = null;
                const originalService = row.serviceType === 'sp' || row.serviceType === 'ads' ? 'sp_ads' : row.serviceType;
                
                if (row.status === 'needs_auth') {
                  primaryAction = <Button className="btn-sm" onClick={() => handleReauth(row.storeId, originalService as ServiceType)}>再認証</Button>;
                } else if (row.status === 'syncing') {
                  primaryAction = <MutedText level={50}>同期中...</MutedText>;
                } else if (row.status === 'ok') {
                  primaryAction = <Button className="btn-sm" disabled={!!row.jobId} onClick={() => handleSync(row.storeId, originalService as ServiceType)}>手動同期</Button>;
                } else if (row.status === 'failed') {
                  primaryAction = <Button className="btn-sm" onClick={() => handleReauth(row.storeId, originalService as ServiceType)}>再認証</Button>;
                } else {
                  primaryAction = <MutedText level={50}>未接続</MutedText>;
                }
                
                return (
                  <Table.Tr key={`${row.storeId}-${row.serviceType}`} id={`store-${row.storeId}`} highlight={rowHighlight}>
                    <Table.Td>
                      <StatusBadge status={row.status} />
                    </Table.Td>
                    <Table.Td style={{ fontWeight: 500 }}>{row.storeName}</Table.Td>
                    <Table.Td>{row.serviceName}</Table.Td>
                    <Table.Td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      <MutedText>{row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString('ja-JP') : '-'}</MutedText>
                    </Table.Td>
                    <Table.Td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      <MutedText>{row.tokenExpiryAt ? new Date(row.tokenExpiryAt).toLocaleDateString('ja-JP') : '-'}</MutedText>
                    </Table.Td>
                    <Table.Td>
                      {primaryAction}
                    </Table.Td>
                    <Table.Td style={{ position: 'relative' }}>
        <Button 
          className="btn-sm" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const isOpen = rowMenu?.storeId === row.storeId && rowMenu?.serviceType === row.serviceType;
                          setRowMenu(isOpen ? null : { storeId: row.storeId, serviceType: row.serviceType }); 
                        }}
        >
                        …
        </Button>
                      <RowMenu
                        isOpen={rowMenu?.storeId === row.storeId && rowMenu?.serviceType === row.serviceType}
                        onClose={() => setRowMenu(null)}
                        className=""
                      >
                        {row.status === 'failed' && (
                          <div role="menuitem" tabIndex={0} className="w-full text-left px-3 py-2 text-sm rounded" onClick={() => showErrorDetail(row.storeId, originalService as ServiceType)}>
                            エラー詳細
                          </div>
                        )}
                        {(row.serviceType === 'sp' || row.serviceType === 'ads') && (
                          <div role="menuitem" tabIndex={0} className="w-full text-left px-3 py-2 text-sm rounded" onClick={() => handleSync(row.storeId, 'sp_ads', true)}>
                            SP&広告同期
                          </div>
                        )}
                        <div role="menuitem" tabIndex={0} className="w-full text-left px-3 py-2 text-sm rounded" onClick={() => setConfirmAction({ type: 'unlink', storeId: row.storeId, service: originalService as ServiceType })}>
                          切断
                        </div>
                      </RowMenu>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      {/* Connect Wizard */}
      <ConnectWizard 
        isOpen={showWizard} 
        onClose={() => setShowWizard(false)} 
        resumeSessionId={resumeSessionId}
        connectionsRepo={connectionsRepo}
      />

      {/* Unlink Confirmation Modal */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="接続を切断">
        <MutedText>
          {confirmAction?.service === 'sp_ads' ? 'SP＋広告' : confirmAction?.service === 'dsp' ? 'DSP' : 'ベンダー'}の接続を切断しますか？
          <br />この操作は元に戻せません。
        </MutedText>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button onClick={() => setConfirmAction(null)}>キャンセル</Button>
          <Button className="btn-lg" variant="danger" onClick={handleUnlink}>切断する</Button>
        </div>
      </Modal>

      {/* Error Detail Modal */}
      <Modal isOpen={!!errorDetail} onClose={() => setErrorDetail(null)} title="エラー詳細">
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <strong>サービス:</strong> {errorDetail?.service === 'sp_ads' ? 'SP＋広告' : errorDetail?.service === 'dsp' ? 'DSP' : 'ベンダー'}
          </div>
          <div>
            <strong>エラーコード:</strong> {errorDetail?.error?.code || 'UNKNOWN'}
          </div>
          <div>
            <strong>メッセージ:</strong> {errorDetail?.error?.message || 'エラーが発生しました'}
          </div>
          {errorDetail?.error?.detail && (
            <div>
              <strong>詳細:</strong> {errorDetail.error.detail}
            </div>
          )}
          <div>
            <strong>発生時刻:</strong> {errorDetail?.error?.occurredAt ? new Date(errorDetail.error.occurredAt).toLocaleString('ja-JP') : '-'}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button onClick={() => setErrorDetail(null)}>閉じる</Button>
          <Button className="btn-lg" onClick={() => { setErrorDetail(null); errorDetail && handleReauth(errorDetail.storeId, errorDetail.service); }}>再認証する</Button>
        </div>
      </Modal>
    </div>
  );
}


