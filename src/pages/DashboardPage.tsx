import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import type { DashboardResponse } from '../types';
import { formatDate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, LoadingState, StatusBadge } from '../components/Layout';
import { useIsMobile } from '../hooks/useIsMobile';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-US';

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const todayLabel = formatDate(new Date().toISOString(), locale);

  return (
    <>
      <PageHeader title={t('nav_dashboard')} subtitle={todayLabel} />

      {loading && <LoadingState />}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 18, marginBottom: 22 }}>
            <KpiCard label={t('total_products')} value={data.numberOfProducts} />
            <KpiCard label={t('low_stock_items')} value={data.lowStockProducts} valueColor="#dc2626" />
            <KpiCard label={t('active_orders')} value={data.numOfActiveOrders} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 18, alignItems: 'start' }}>
            <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f0f4', fontSize: 15, fontWeight: 700, color: '#18181b' }}>{t('recent_orders')}</div>
              {data.recentOrders.length === 0 && (
                <div style={{ padding: '30px 22px', textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>{t('no_orders_yet')}</div>
              )}
              {data.recentOrders.map(o => {
                return (
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
                );
              })}
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
        </>
      )}
    </>
  );
}

function KpiCard({ label, value, valueColor = '#18181b' }: { label: string; value: number; valueColor?: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(24,24,27,0.03)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: valueColor, marginTop: 10, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
