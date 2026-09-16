import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, getStockEntries } from '../api/products';
import type { ProductDto, StockEntryDto } from '../types';
import { formatMoney, formatDate, UOM_KEYS } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, TableCard, LoadingState, EmptyState, Pagination } from '../components/Layout';
import { useIsMobile } from '../hooks/useIsMobile';

const SWATCHES = ['#6d28d9', '#2563eb', '#16a34a', '#d97706', '#db2777', '#0891b2'];

function InfoCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 14, padding: '18px 22px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ?? '#18181b', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const ENTRY_TYPE_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#eafaf0', color: '#16a34a' },
  2: { bg: '#fef2f2', color: '#dc2626' },
  3: { bg: '#eaf1fe', color: '#2563eb' },
};

function StockChart({ entries, color, label }: { entries: StockEntryDto[]; color: string; label: string }) {
  const sorted = [...entries].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  const points: { date: Date; stock: number }[] = [];
  let running = 0;
  for (const e of sorted) {
    running += e.stockEntryType === 1 ? e.quantity : -e.quantity;
    points.push({ date: new Date(e.entryDate), stock: running });
  }

  if (points.length < 2) return null;

  const W = 600, H = 130;
  const PAD = { top: 14, right: 16, bottom: 28, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minStock = Math.min(0, ...points.map(p => p.stock));
  const maxStock = Math.max(...points.map(p => p.stock));
  const stockRange = maxStock - minStock || 1;

  const timeMin = points[0].date.getTime();
  const timeMax = points[points.length - 1].date.getTime();
  const timeRange = timeMax - timeMin || 1;

  const toX = (d: Date) => PAD.left + ((d.getTime() - timeMin) / timeRange) * chartW;
  const toY = (s: number) => PAD.top + chartH - ((s - minStock) / stockRange) * chartH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.date).toFixed(1)} ${toY(p.stock).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${toX(points[points.length - 1].date).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${toX(points[0].date).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const yTicks = [minStock, Math.round((minStock + maxStock) / 2), maxStock];
  const gradId = `sg_${color.replace('#', '')}`;

  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 14, padding: '18px 22px', marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', marginBottom: 12 }}>{label}</div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 300, height: 130 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.20" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {minStock < 0 && (
            <line x1={PAD.left} y1={toY(0)} x2={PAD.left + chartW} y2={toY(0)} stroke="#fca5a5" strokeWidth="1" strokeDasharray="4,3" />
          )}
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {yTicks.map(v => (
            <text key={v} x={PAD.left - 6} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#a1a1aa">{v}</text>
          ))}
          <text x={toX(points[0].date)} y={H - 5} textAnchor="start" fontSize="9.5" fill="#a1a1aa">
            {points[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
          <text x={toX(points[points.length - 1].date)} y={H - 5} textAnchor="end" fontSize="9.5" fill="#a1a1aa">
            {points[points.length - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
          {points.map((p, i) => (
            <circle key={i} cx={toX(p.date)} cy={toY(p.stock)} r="3" fill={color} />
          ))}
        </svg>
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [entries, setEntries] = useState<StockEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const isMobile = useIsMobile();
  const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-US';

  useEffect(() => {
    if (!publicId) return;
    Promise.all([getProductById(publicId), getStockEntries(publicId)])
      .then(([p, e]) => { setProduct(p); setEntries(e); })
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) return <LoadingState />;
  if (!product) return <EmptyState message={t('product_not_found')} />;

  const swatch = SWATCHES[product.name.charCodeAt(0) % SWATCHES.length];
  const actualStock = entries.reduce((sum, e) => sum + (e.stockEntryType === 1 ? e.quantity : -e.quantity), 0);
  const low = actualStock < product.minimumStockQuantity;

  const stockValue = actualStock * product.price;

  const outEntries = entries.filter(e => e.stockEntryType === 2);
  let daysToStockout = '—';
  if (outEntries.length >= 2 && actualStock > 0) {
    const totalOut = outEntries.reduce((sum, e) => sum + e.quantity, 0);
    const dates = outEntries.map(e => new Date(e.entryDate).getTime());
    const daySpan = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / 86_400_000);
    const avgPerDay = totalOut / daySpan;
    if (avgPerDay > 0) daysToStockout = String(Math.round(actualStock / avgPerDay));
  }

  const sortedEntries = [...entries].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  const totalHistoryPages = Math.max(1, Math.ceil(sortedEntries.length / historyPageSize));
  const pagedEntries = sortedEntries.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  const stockTypeLabel = (type: number) => {
    if (type === 1) return t('stock_type_in');
    if (type === 2) return t('stock_type_out');
    return t('stock_type_adj');
  };

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.description || undefined}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/suppliers/${product.supplierPublicId}`)}
              style={{
                height: 38, padding: '0 16px', borderRadius: 10,
                border: '1px solid #e4e4e7', background: '#ffffff', color: '#52525b',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {t('view_supplier')}
            </button>
            <button
              onClick={() => navigate('/products')}
              style={{
                height: 38, padding: '0 16px', borderRadius: 10,
                border: '1px solid #e4e4e7', background: '#ffffff', color: '#52525b',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {t('back')}
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: swatch, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', fontWeight: 800, fontSize: 22,
        }}>
          {product.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13.5, color: '#52525b' }}>{product.categoryName} · {product.supplierName}</div>
          <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>SKU: {product.sku}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <InfoCard label={t('price')} value={formatMoney(product.price)} />
        <InfoCard label={t('field_vat_rate')} value={`${product.vatRate}%`} />
        <InfoCard
          label={t('current_stock')}
          value={String(actualStock)}
          sub={low ? t('below_minimum') : `${t('min_prefix')}${product.minimumStockQuantity}`}
          accent={low ? '#dc2626' : undefined}
        />
        <InfoCard label={t('minimum_stock')} value={String(product.minimumStockQuantity)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <InfoCard
          label={t('field_unit_of_measurement')}
          value={UOM_KEYS[product.unitOfMeasurement] ? t(UOM_KEYS[product.unitOfMeasurement]) : '—'}
          sub={product.categoryName}
        />
        <InfoCard
          label={t('stock_value')}
          value={formatMoney(stockValue)}
          sub={`${actualStock} × ${formatMoney(product.price)}`}
        />
        <InfoCard
          label={t('days_to_stockout')}
          value={daysToStockout}
          sub={daysToStockout !== '—' ? t('at_current_rate') : t('no_consumption_data')}
        />
      </div>

      <StockChart entries={entries} color={swatch} label={t('stock_trend')} />

      <div style={{ fontSize: 16, fontWeight: 800, color: '#18181b', marginBottom: 12, letterSpacing: '-0.01em' }}>
        {t('stock_history')}
      </div>

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.8fr 1.4fr', padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 480 : undefined }}>
          {[t('col_type'), t('col_qty'), t('date'), t('notes')].map(h => (
            <div key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</div>
          ))}
        </div>

        {entries.length === 0 && <EmptyState message={t('no_stock_entries')} />}

        {pagedEntries.map(e => {
          const c = ENTRY_TYPE_COLORS[e.stockEntryType] ?? { bg: '#f4f4f5', color: '#71717a' };
          return (
            <div key={e.publicId} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.8fr 1.4fr', padding: '13px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 480 : undefined }}>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: c.bg, color: c.color }}>
                  {stockTypeLabel(e.stockEntryType)}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{e.quantity}</div>
              <div style={{ fontSize: 13, color: '#52525b' }}>{formatDate(e.entryDate, locale)}</div>
              <div style={{ fontSize: 13, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes ?? '—'}</div>
            </div>
          );
        })}
        {entries.length > 0 && (
          <Pagination
            pageNumber={historyPage}
            pageSize={historyPageSize}
            totalCount={entries.length}
            totalPages={totalHistoryPages}
            onPageChange={setHistoryPage}
            onPageSizeChange={size => { setHistoryPageSize(size); setHistoryPage(1); }}
          />
        )}
      </TableCard>
    </>
  );
}
