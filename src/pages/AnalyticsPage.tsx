import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getUserAnalytics, getBusinessAnalytics } from '../api/analytics';
import type { UserAnalyticsResponse, BusinessAnalyticsResponse } from '../types/analytics';
import { PageHeader, TableCard, LoadingState } from '../components/Layout';
import { formatMoney } from '../types';

type Preset = '7d' | '30d' | '90d' | '365d' | 'custom';

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#18181b', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? '#f3eefe' : '#fafafa',
      border: `1px solid ${highlight ? '#e0d4fd' : '#ececf0'}`,
      borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: highlight ? '#6d28d9' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: highlight ? '#6d28d9' : '#18181b' }}>{value}</div>
    </div>
  );
}

export function AnalyticsPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState(toDateInput(daysAgo(30)));
  const [customTo, setCustomTo] = useState(toDateInput(new Date()));

  const [userData, setUserData] = useState<UserAnalyticsResponse | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [bizData, setBizData] = useState<BusinessAnalyticsResponse | null>(null);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  const resolvedRange = useCallback((): { from: Date; to: Date } => {
    if (preset === 'custom') {
      return { from: startOfDay(new Date(customFrom)), to: endOfDay(new Date(customTo)) };
    }
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
    return { from: daysAgo(days), to: endOfDay(new Date()) };
  }, [preset, customFrom, customTo]);

  const fetchAll = useCallback(async () => {
    const { from, to } = resolvedRange();

    setUserLoading(true);
    setUserError(null);
    setBizLoading(true);
    setBizError(null);

    const [userResult, bizResult] = await Promise.allSettled([
      getUserAnalytics(from, to),
      getBusinessAnalytics(from, to),
    ]);

    if (userResult.status === 'fulfilled') {
      setUserData(userResult.value);
    } else {
      setUserError(t('analytics_load_failed'));
    }
    setUserLoading(false);

    if (bizResult.status === 'fulfilled') {
      setBizData(bizResult.value);
    } else {
      setBizError(t('analytics_load_failed'));
    }
    setBizLoading(false);
  }, [resolvedRange, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const presets: Preset[] = ['7d', '30d', '90d', '365d'];
  const presetLabels: Record<Preset, string> = {
    '7d': t('analytics_7d'),
    '30d': t('analytics_30d'),
    '90d': t('analytics_90d'),
    '365d': t('analytics_365d'),
    'custom': t('analytics_custom'),
  };

  const timeRangeSelector = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 24 }}>
      {presets.map(p => (
        <button
          key={p}
          onClick={() => setPreset(p)}
          style={{
            height: 34, padding: '0 14px', borderRadius: 8,
            border: preset === p ? 'none' : '1px solid #e4e4e7',
            background: preset === p ? '#6d28d9' : '#ffffff',
            color: preset === p ? '#ffffff' : '#52525b',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >{presetLabels[p]}</button>
      ))}
      <button
        onClick={() => setPreset('custom')}
        style={{
          height: 34, padding: '0 14px', borderRadius: 8,
          border: preset === 'custom' ? 'none' : '1px solid #e4e4e7',
          background: preset === 'custom' ? '#6d28d9' : '#ffffff',
          color: preset === 'custom' ? '#ffffff' : '#52525b',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
        }}
      >{presetLabels.custom}</button>
      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={e => setCustomFrom(e.target.value)}
            style={{ height: 34, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}
          />
          <span style={{ color: '#a1a1aa', fontSize: 13 }}>–</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={e => setCustomTo(e.target.value)}
            style={{ height: 34, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
      )}
    </div>
  );

  const userSection = (
    <>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#18181b', marginBottom: 16 }}>{t('analytics_user_section')}</div>

      {userLoading && <LoadingState />}
      {userError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{userError}</div>}

      {!userLoading && userData && (
        <>
          <SectionCard title={t('analytics_registration_trend')}>
            {userData.registrationTrend.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={userData.registrationTrend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                  <Line type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2} dot={false} name={t('analytics_registrations')} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 280 }}>
              <SectionCard title={t('analytics_activity_by_entity')}>
                {userData.activityByEntityType.length === 0 ? (
                  <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userData.activityByEntityType} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                      <XAxis dataKey="entityName" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                      <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} name={t('analytics_actions')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </div>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 280 }}>
              <SectionCard title={t('analytics_activity_by_action')}>
                {userData.activityByActionType.length === 0 ? (
                  <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userData.activityByActionType} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                      <XAxis dataKey="action" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                      <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name={t('analytics_actions')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard title={t('analytics_top_users')}>
            {userData.topActiveUsers.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <TableCard>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 18px', borderBottom: '1px solid #ececf0', background: '#fafafa' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('email')}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('analytics_actions')}</div>
                </div>
                {userData.topActiveUsers.map((u, i) => (
                  <div
                    key={u.userEmail}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      padding: '11px 18px', borderBottom: i < userData.topActiveUsers.length - 1 ? '1px solid #ececf0' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#18181b', fontWeight: 600 }}>{u.userEmail}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9' }}>{u.count}</span>
                  </div>
                ))}
              </TableCard>
            )}
          </SectionCard>
        </>
      )}
    </>
  );

  const bizSection = (
    <>
      <div style={{ height: 1, background: '#ececf0', margin: '8px 0 28px 0' }} />
      <div style={{ fontSize: 18, fontWeight: 800, color: '#18181b', marginBottom: 16 }}>{t('analytics_business_section')}</div>

      {bizLoading && <LoadingState />}
      {bizError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{bizError}</div>}

      {!bizLoading && bizData && (
        <>
          {/* Inventory sub-section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t('analytics_inventory_stock')}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard
              label={t('analytics_below_minimum_count')}
              value={bizData.inventoryMetrics.belowMinimumCount}
              highlight={bizData.inventoryMetrics.belowMinimumCount > 0}
            />
          </div>

          <SectionCard title={t('analytics_inventory_stock')}>
            {bizData.inventoryMetrics.currentStockPerProduct.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <TableCard>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '10px 18px', borderBottom: '1px solid #ececf0', background: '#fafafa', gap: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('analytics_col_product')}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('analytics_col_current_stock')}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('analytics_col_min_stock')}</div>
                </div>
                {bizData.inventoryMetrics.currentStockPerProduct.map((p, i) => {
                  const belowMin = p.currentStock < p.minimumStock;
                  return (
                    <div
                      key={p.productPublicId}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
                        padding: '11px 18px',
                        borderBottom: i < bizData.inventoryMetrics.currentStockPerProduct.length - 1 ? '1px solid #ececf0' : 'none',
                        background: belowMin ? '#fff8f8' : 'transparent',
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#18181b', fontWeight: 600 }}>{p.productName}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: belowMin ? '#dc2626' : '#18181b', textAlign: 'right' }}>{p.currentStock}</span>
                      <span style={{ fontSize: 13, color: '#71717a', textAlign: 'right' }}>{p.minimumStock}</span>
                    </div>
                  );
                })}
              </TableCard>
            )}
          </SectionCard>

          <SectionCard title={t('analytics_stock_movement')}>
            {bizData.inventoryMetrics.stockMovement.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={bizData.inventoryMetrics.stockMovement.map(s => ({
                    ...s,
                    date: s.date.slice(0, 10),
                  }))}
                  margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="inQuantity" fill="#16a34a" radius={[3, 3, 0, 0]} name={t('analytics_in_quantity')} />
                  <Bar dataKey="outQuantity" fill="#dc2626" radius={[3, 3, 0, 0]} name={t('analytics_out_quantity')} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Orders sub-section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t('orders_subtitle')}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label={t('analytics_total_orders')} value={bizData.orderMetrics.totalCount} />
            <KpiCard label={t('analytics_total_value')} value={formatMoney(bizData.orderMetrics.totalValue)} highlight />
          </div>

          <SectionCard title={t('analytics_order_status')}>
            {bizData.orderMetrics.statusBreakdown.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bizData.orderMetrics.statusBreakdown} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name={t('analytics_order_status')} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title={t('analytics_top_suppliers')}>
            {bizData.orderMetrics.topSuppliers.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <TableCard>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '10px 18px', borderBottom: '1px solid #ececf0', background: '#fafafa', gap: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('analytics_col_supplier')}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('analytics_col_orders')}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('analytics_col_value')}</div>
                </div>
                {bizData.orderMetrics.topSuppliers.map((s, i) => (
                  <div
                    key={s.supplierPublicId}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
                      padding: '11px 18px',
                      borderBottom: i < bizData.orderMetrics.topSuppliers.length - 1 ? '1px solid #ececf0' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#18181b', fontWeight: 600 }}>{s.supplierName}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#18181b', textAlign: 'right' }}>{s.orderCount}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9', textAlign: 'right' }}>{formatMoney(s.totalValue)}</span>
                  </div>
                ))}
              </TableCard>
            )}
          </SectionCard>
        </>
      )}
    </>
  );

  return (
    <div>
      <PageHeader title={t('nav_analytics')} subtitle={t('analytics_subtitle')} />
      {timeRangeSelector}
      {userSection}
      {bizSection}
    </div>
  );
}
