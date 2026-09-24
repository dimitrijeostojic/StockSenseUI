import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getDashboard } from '../api/dashboard';
import { getBusinessAnalytics } from '../api/analytics';
import type { DashboardResponse } from '../types';
import type { BusinessAnalyticsResponse } from '../types/analytics';
import { formatDate, formatMoney } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, LoadingState, StatusBadge, TableCard } from '../components/Layout';
import { useIsMobile } from '../hooks/useIsMobile';

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

export function DashboardPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-US';

  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState(toDateInput(daysAgo(30)));
  const [customTo, setCustomTo] = useState(toDateInput(new Date()));
  const [bizData, setBizData] = useState<BusinessAnalyticsResponse | null>(null);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const resolvedRange = useCallback((): { from: Date; to: Date } => {
    if (preset === 'custom') {
      return { from: startOfDay(new Date(customFrom)), to: endOfDay(new Date(customTo)) };
    }
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
    return { from: daysAgo(days), to: endOfDay(new Date()) };
  }, [preset, customFrom, customTo]);

  const fetchBiz = useCallback(async () => {
    const { from, to } = resolvedRange();
    setBizLoading(true);
    setBizError(null);
    try {
      const result = await getBusinessAnalytics(from, to);
      setBizData(result);
    } catch {
      setBizError(t('analytics_load_failed'));
    } finally {
      setBizLoading(false);
    }
  }, [resolvedRange, t]);

  useEffect(() => {
    fetchBiz();
  }, [fetchBiz]);

  const todayLabel = formatDate(new Date().toISOString(), locale);

  const presets: Preset[] = ['7d', '30d', '90d', '365d'];
  const presetLabels: Record<Preset, string> = {
    '7d': t('analytics_7d'),
    '30d': t('analytics_30d'),
    '90d': t('analytics_90d'),
    '365d': t('analytics_365d'),
    'custom': t('analytics_custom'),
  };

  return (
    <>
      <PageHeader title={t('nav_dashboard')} subtitle={todayLabel} />

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

      {(loading || bizLoading) && <LoadingState />}
      {bizError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{bizError}</div>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
            <KpiCard label={t('total_products')} value={String(data.numberOfProducts)} />
            <KpiCard label={t('low_stock_items')} value={String(data.lowStockProducts)} valueColor="#dc2626" />
            <KpiCard label={t('active_orders')} value={String(data.numOfActiveOrders)} />
            <KpiCard
              label={t('analytics_total_value')}
              value={bizData ? formatMoney(bizData.orderMetrics.totalValue) : '—'}
              valueColor="#6d28d9"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 18, alignItems: 'start', marginBottom: 20 }}>
            <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f0f4', fontSize: 15, fontWeight: 700, color: '#18181b' }}>{t('recent_orders')}</div>
              {data.recentOrders.length === 0 && (
                <div style={{ padding: '30px 22px', textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>{t('no_orders_yet')}</div>
              )}
              {data.recentOrders.map(o => (
                <div
                  key={o.publicId}
                  onClick={() => navigate('/orders', { state: { openOrderId: o.publicId } })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f5f4f7', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{o.supplierName}</div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{formatDate(o.orderDate, locale)} · #{o.publicId.slice(0, 8)}</div>
                  </div>
                  <StatusBadge statusNum={o.orderStatus} />
                </div>
              ))}
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f0f4', fontSize: 15, fontWeight: 700, color: '#18181b' }}>{t('top_low_stock')}</div>
              {data.top5ProductsWithLowStock.length === 0 && (
                <div style={{ padding: '30px 22px', textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>{t('all_well_stocked')}</div>
              )}
              {data.top5ProductsWithLowStock.map(p => (
                <div
                  key={p.publicId}
                  onClick={() => navigate('/orders', { state: { reorderProductId: p.publicId } })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f5f4f7', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{p.categoryName} · {t('tap_to_reorder')}</div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#dc2626', flexShrink: 0, marginLeft: 10 }}>
                    {p.actualStockQuantity} / {p.minimumStockQuantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {bizData && (
            <>
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
      )}
    </>
  );
}

function KpiCard({ label, value, valueColor = '#18181b' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(24,24,27,0.03)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: valueColor, marginTop: 10, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
