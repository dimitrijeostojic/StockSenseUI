import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, getStockEntries } from '../api/products';
import type { ProductDto, StockEntryDto } from '../types';
import { formatMoney, formatDate, STOCK_ENTRY_TYPE } from '../types';
import { PageHeader, TableCard, LoadingState, EmptyState } from '../components/Layout';
import { useIsMobile } from '../hooks/useIsMobile';

const SWATCHES = ['#6d28d9', '#2563eb', '#16a34a', '#d97706', '#db2777', '#0891b2'];

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 14, padding: '18px 22px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const ENTRY_TYPE_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#eafaf0', color: '#16a34a' },
  2: { bg: '#fef2f2', color: '#dc2626' },
  3: { bg: '#eaf1fe', color: '#2563eb' },
};

export function ProductDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [entries, setEntries] = useState<StockEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!publicId) return;
    Promise.all([getProductById(publicId), getStockEntries(publicId)])
      .then(([p, e]) => { setProduct(p); setEntries(e); })
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) return <LoadingState />;
  if (!product) return <EmptyState message="Product not found." />;

  const swatch = SWATCHES[product.name.charCodeAt(0) % SWATCHES.length];
  const actualStock = entries.reduce((sum, e) => sum + (e.stockEntryType === 1 ? e.quantity : -e.quantity), 0);
  const low = actualStock < product.minimumStockQuantity;

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.description || undefined}
        action={
          <button
            onClick={() => navigate('/products')}
            style={{
              height: 38, padding: '0 16px', borderRadius: 10,
              border: '1px solid #e4e4e7', background: '#ffffff', color: '#52525b',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            ← Back
          </button>
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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <InfoCard label="Price" value={formatMoney(product.price)} />
        <InfoCard
          label="Current stock"
          value={String(actualStock)}
          sub={low ? '⚠ Below minimum' : `Min: ${product.minimumStockQuantity}`}
        />
        <InfoCard label="Minimum stock" value={String(product.minimumStockQuantity)} />
        <InfoCard label="Category" value={product.categoryName} sub={product.supplierName} />
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, color: '#18181b', marginBottom: 12, letterSpacing: '-0.01em' }}>
        Stock history
      </div>

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.8fr 1.4fr', padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 480 : undefined }}>
          {['Type', 'Qty', 'Date', 'Notes'].map(h => (
            <div key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</div>
          ))}
        </div>

        {entries.length === 0 && <EmptyState message="No stock entries yet." />}

        {entries.map(e => {
          const c = ENTRY_TYPE_COLORS[e.stockEntryType] ?? { bg: '#f4f4f5', color: '#71717a' };
          return (
            <div key={e.publicId} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.8fr 1.4fr', padding: '13px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 480 : undefined }}>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: c.bg, color: c.color }}>
                  {STOCK_ENTRY_TYPE[e.stockEntryType] ?? e.stockEntryType}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{e.quantity}</div>
              <div style={{ fontSize: 13, color: '#52525b' }}>{formatDate(e.entryDate)}</div>
              <div style={{ fontSize: 13, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes ?? '—'}</div>
            </div>
          );
        })}
      </TableCard>
    </>
  );
}
