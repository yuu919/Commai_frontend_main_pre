"use client";
import React from 'react';
import { useBillingRepo } from '@/app/providers';
import { useToast } from '@ui/Toast';
import Button from '@ui/Button';
import Badge from '@ui/Badge';
import Divider from '@ui/Divider';
import MutedText from '@ui/MutedText';
import Surface from '@ui/Surface';
import Modal from '@ui/Modal';
type SectionCardProps = {
  title: string;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
};

function SectionCard({ title, rightSlot, children }: SectionCardProps) {
  return (
    <section className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="section-card-title">{title}</h2>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      <Divider />
      <div>{children}</div>
    </section>
  );
}

// InlineBadge replaced by shared/ui/Badge

// ToastArea removed in favor of shared ToastProvider

type CurrentPlanCardProps = {
  planName: string;
  period: 'monthly' | 'yearly';
  nextBillingDate: string; // ISO or readable
  status: 'trial' | 'active' | 'canceledAtPeriodEnd';
  onOpenUpgrade: () => void;
  onOpenCancel: () => void;
};

function statusBadge(status: CurrentPlanCardProps['status']) {
  if (status === 'trial') return <Badge variant="primary">試用中</Badge>;
  if (status === 'active') return <Badge variant="success">有効</Badge>;
  return <Badge variant="warning">今期で終了</Badge>;
}

function CurrentPlanCard({ planName, period, nextBillingDate, status, onOpenUpgrade, onOpenCancel }: CurrentPlanCardProps) {
  const periodLabel = period === 'monthly' ? '月額' : '年額';
  return (
    <SectionCard
      title="現在のプラン"
      rightSlot={(
        <div style={{ display: 'flex', gap: 8 }}>
          <Button className="btn-lg" onClick={onOpenUpgrade}>アップグレード</Button>
          <Button onClick={onOpenCancel}>プラン解約</Button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, alignItems: 'center' }}>
        <div>プラン:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>{planName}</strong>
          {statusBadge(status)}
        </div>
        <div>更新周期:</div>
        <div>{periodLabel}</div>
        <div>次回請求日:</div>
        <div>{nextBillingDate}</div>
      </div>
      <MutedText style={{ fontSize: 12, marginTop: 8 }}>解約は当期間末で適用。日割り・差額は発生しません（v0注記）。</MutedText>
    </SectionCard>
  );
}

type ModalProps = { isOpen: boolean; onClose: () => void };
type Plan = { id: string; name: string; priceMonthly: number; features: string[] };
type UpgradePlan = { id: 'plus' | 'pro'; name: 'Plus' | 'Pro'; priceUSD: number; features: string[] };

type UpgradeModalProps = ModalProps & { selectedPlanId?: UpgradePlan['id']; currentPlanIdMapped: UpgradePlan['id']; plans: UpgradePlan[] };
function UpgradeModal({ isOpen, onClose, selectedPlanId, currentPlanIdMapped, plans }: UpgradeModalProps) {
  if (!isOpen) return null;
  const selected = plans.find((p) => p.id === selectedPlanId);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="現在のプランをアップグレードする">
      <div className="card" style={{ width: 980 }}>
        <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 6 }}>現在のプランをアップグレードする</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          {plans.map((p) => {
            const isCurrent = p.id === currentPlanIdMapped;
            const isSelected = selected && selected.id === p.id;
            return (
              <Surface key={p.id} bordered radius="md" className={`p-4 ${isSelected ? 'border-primary' : ''}`}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>${p.priceUSD}</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>USD/月</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', rowGap: 8 }}>
                  {p.features.map((f, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 16 }}>
                  {isCurrent ? (
                    <Button disabled style={{ width: '100%', opacity: .6 }}>現在のプラン</Button>
                  ) : (
                    <Button style={{ width: '100%' }} variant="ghost">{p.name} をはじめる</Button>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={onClose}>閉じる</Button>
        </div>
      </div>
    </Modal>
  );
}

function CancelPlanModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="プラン解約">
      <div className="card" style={{ width: 520 }}>
        <h3 className="section-card-title">プラン解約</h3>
        <Divider />
        <MutedText>解約フロー（後続ステップ）。</MutedText>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          <Button onClick={onClose}>閉じる</Button>
          <Button className="btn-lg" onClick={onClose}>月末で解約</Button>
        </div>
      </div>
    </Modal>
  );
}

type PlanAccordionProps = { summary: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode };
function PlanAccordion({ summary, isOpen, onToggle, children }: PlanAccordionProps) {
  return (
    <div>
      <button
        className="btn"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <span>{summary}</span>
        <span style={{ opacity: .7 }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen ? (
        <div style={{ marginTop: 12 }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

type ManageBillingCardProps = { onErrorToast: (message: string) => void };
function ManageBillingCard({ onErrorToast }: ManageBillingCardProps) {
  const [loading, setLoading] = React.useState(false);
  const billing = useBillingRepo();
  const openPortal = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await billing.openPortal();
      if (!data?.url) throw new Error('no_url');
      // navigate to Stripe portal
      window.location.href = data.url as string;
    } catch (e) {
      onErrorToast('ポータルを開けませんでした');
      setLoading(false);
    }
  };
  return (
    <SectionCard
      title="請求の管理"
      rightSlot={null}
    >
      <MutedText style={{ marginBottom: 12 }}>
        支払い方法の追加・変更、請求先の編集、請求書の閲覧/ダウンロードはStripeのポータルで行います。
      </MutedText>
      <Button
        className="btn-lg"
        aria-label="Stripeの請求ポータルを開く"
        onClick={openPortal}
        disabled={loading}
      >
        {loading ? '読み込み中…' : '請求を管理する'}
      </Button>
      <MutedText style={{ fontSize: 12, marginTop: 10 }}>
        請求履歴はポータル下部に表示されます。
      </MutedText>
    </SectionCard>
  );
}

type PlanTableProps = {
  plans: Plan[];
  currentPlanId: string;
  onRequestUpgrade: (planId: string) => void;
};

function PlanTable({ plans, currentPlanId, onRequestUpgrade }: PlanTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '10px 8px' }}>プラン</th>
          <th style={{ textAlign: 'left', padding: '10px 8px' }}>月額</th>
          <th style={{ textAlign: 'left', padding: '10px 8px' }}>特徴</th>
          <th style={{ textAlign: 'left', padding: '10px 8px' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          return (
            <tr key={p.id} className="border-t border-border">
              <td style={{ padding: '10px 8px' }}>{p.name}</td>
              <td style={{ padding: '10px 8px' }}>${p.priceMonthly} USD/月</td>
              <td style={{ padding: '10px 8px' }}><MutedText>{p.features.join(' / ')}</MutedText></td>
              <td style={{ padding: '10px 8px' }}>
                {isCurrent ? (
                  <Button disabled>現在のプラン</Button>
                ) : (
                  <Button className="btn-lg" onClick={() => onRequestUpgrade(p.id)}>申し込む</Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function BillingPage() {
  const { push } = useToast();
  const [openUpgrade, setOpenUpgrade] = React.useState(false);
  const [openCancel, setOpenCancel] = React.useState(false);
  const [accordionOpen, setAccordionOpen] = React.useState(false);
  const plans: Plan[] = [
    { id: 'free', name: 'Free', priceMonthly: 0, features: ['基本機能'] },
    { id: 'pro', name: 'Pro', priceMonthly: 1980, features: ['高度機能', '標準サポート'] },
    { id: 'biz', name: 'Business', priceMonthly: 4980, features: ['チーム', '優先サポート'] },
  ];
  // Upgradeモーダル用（画像準拠の2カード固定: Plus/Pro）
  const upgradePlans: UpgradePlan[] = [
    { id: 'plus', name: 'Plus', priceUSD: 20, features: [
      '高度な推論が可能な GPT-5',
      'より多くのメッセージ送信とアップロード',
      'より多くの画像を高密度で作成',
      'より多くのメモリとコンテキストを利用可能',
      '高度な Deep Research とエージェントモード',
      'プロジェクト、タスク、カスタム GPT',
      'Sora 動画生成',
      'Codex エージェント',
    ]},
    { id: 'pro', name: 'Pro', priceUSD: 200, features: [
      'Pro の推論が可能な GPT-5',
      '無制限のメッセージとアップロード',
      '高速で、無制限の画像作成',
      'メモリとコンテキストを最大限に利用',
      'Deep Research とエージェントモードを最大限に利用',
      'プロジェクト、タスク、カスタム GPT をより多く',
      'Sora による動画生成をより多く利用可能',
      '高度な Codex エージェント',
      '新機能の研究プレビュー',
    ]},
  ];
  const currentPlanId = 'pro';
  const [selectedPlanId, setSelectedPlanId] = React.useState<UpgradePlan['id'] | undefined>(undefined);
  const addToast = (message: string) => push({ message, variant: 'error' });

  const openUpgradeWithPlan = (planId: string) => {
    const mapped: UpgradePlan['id'] = planId === 'pro' ? 'pro' : 'plus';
    setSelectedPlanId(mapped);
    setOpenUpgrade(true);
  };

  const openUpgradeFromCurrent = () => {
    const idx = plans.findIndex((p) => p.id === currentPlanId);
    const next = plans[idx + 1] || plans[idx] || undefined;
    // map current Free/Pro/Biz → modalの Plus/Pro（簡易）
    const mapped: UpgradePlan['id'] | undefined = next && next.id === 'pro' ? 'pro' : 'plus';
    setSelectedPlanId(mapped);
    setOpenUpgrade(true);
  };
  return (
    <div>
      <CurrentPlanCard
        planName="Pro"
        period="monthly"
        nextBillingDate="2025-10-01"
        status="active"
        onOpenUpgrade={openUpgradeFromCurrent}
        onOpenCancel={() => setOpenCancel(true)}
      />

      <ManageBillingCard onErrorToast={addToast} />

      {/* Toasts handled by shared ToastProvider */}
      <UpgradeModal
        isOpen={openUpgrade}
        onClose={() => setOpenUpgrade(false)}
        selectedPlanId={selectedPlanId as UpgradePlan['id'] | undefined}
        currentPlanIdMapped={'pro'}
        plans={upgradePlans}
      />
      <CancelPlanModal isOpen={openCancel} onClose={() => setOpenCancel(false)} />
    </div>
  );
}