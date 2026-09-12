import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupplierById } from '../api/suppliers';
import { getProducts } from '../api/products';
import { getOrders } from '../api/orders';
import type { SupplierDetailDto, ProductDto, OrderListDto } from '../types';
import { formatMoney, formatDate, statusColors } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, LoadingState, EmptyState, TableCard } from '../components/Layout';
import { useIsMobile } from '../hooks/useIsMobile';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 14, padding: '18px 22px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#18181b', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 800, color: '#18181b', marginBottom: 12, marginTop: 28, letterSpacing: '-0.01em' }}>{children}</div>
  );
}

const STATUS_LABELS: Record<number, string> = { 1: 'Pending', 2: 'Confirmed', 3: 'Received', 4: 'Cancelled' };

export function SupplierDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [supplier, setSupplier] = useState<SupplierDetailDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [orders, setOrders] = useState<OrderListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-US';

  useEffect(() => {
    if (!publicId) return;
    Promise.all([
      getSupplierById(publicId),
      getProducts({ filterOn: 'supplierPublicId', filterQuery: publicId, pageSize: 100 }),
      getOrders({ filterOn: 'SupplierPublicId', filterQuery: publicId, pageSize: 100 }),
    ])
      .then(([sup, prod, ord]) => {
        setSupplier(sup);
        setProducts(prod.items);
        setOrders(ord.items);
      })
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) return <LoadingState />;
  if (!supplier) return <EmptyState message={t('supplier_not_found')} />;

  const hasLocation = supplier.address || supplier.city || supplier.country;
  const PROD_GRID = isMobile ? '1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr';
  const ORD_GRID = isMobile ? '1fr 1fr' : '1.5fr 1fr 1fr';

  return (
    <>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.supplierCode}
        action={
          <button
            onClick={() => navigate('/suppliers')}
            style={{
              height: 38, padding: '0 16px', borderRadius: 10,
              border: '1px solid #e4e4e7', background: '#ffffff', color: '#52525b',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            {t('back')}
          </button>
        }
      />

      <SectionTitle>{t('supplier_contact_info')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
        <InfoCard label={t('field_supplier_code')} value={supplier.supplierCode} />
        <InfoCard label={t('field_contact')} value={supplier.contactName} />
        <InfoCard label={t('email')} value={supplier.contactEmail} />
        <InfoCard label={t('phone')} value={supplier.contactPhone || '—'} />
      </div>

      {hasLocation && (
        <>
          <SectionTitle>{t('supplier_location_info')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14 }}>
            {supplier.address && <InfoCard label={t('field_address')} value={supplier.address} />}
            {supplier.city && <InfoCard label={t('field_city')} value={supplier.city} />}
            {supplier.country && <InfoCard label={t('field_country')} value={supplier.country} />}
          </div>
        </>
      )}

      <SectionTitle>{t('supplier_orders')}</SectionTitle>
      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: ORD_GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 300 : undefined }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('date')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('status')}</div>
          {!isMobile && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('actions')}</div>}
        </div>

        {orders.length === 0 && <EmptyState message={t('no_supplier_orders')} />}

        {orders.map(o => {
          const sc = statusColors(o.orderStatus);
          const statusLabel = STATUS_LABELS[o.orderStatus] ?? String(o.orderStatus);
          return (
            <div key={o.publicId} style={{ display: 'grid', gridTemplateColumns: ORD_GRID, padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 300 : undefined }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{formatDate(o.orderDate, locale)}</div>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: sc.bg, color: sc.color }}>
                  {statusLabel}
                </span>
              </div>
              {!isMobile && (
                <div>
                  <button
                    onClick={() => navigate('/orders', { state: { openOrderId: o.publicId } })}
                    style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#ffffff', color: '#52525b', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    {t('btn_details')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </TableCard>

      <SectionTitle>{t('supplier_products')}</SectionTitle>
      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: PROD_GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 420 : undefined }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('col_product')}</div>
          {!isMobile && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('field_sku')}</div>}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('price')}</div>
          {!isMobile && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('category')}</div>}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('col_stock')}</div>
        </div>

        {products.length === 0 && <EmptyState message={t('no_supplier_products')} />}

        {products.map(p => (
          <div
            key={p.publicId}
            onClick={() => navigate(`/products/${p.publicId}`)}
            style={{ display: 'grid', gridTemplateColumns: PROD_GRID, padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', cursor: 'pointer', minWidth: isMobile ? 420 : undefined }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
            {!isMobile && <div style={{ fontSize: 12.5, color: '#71717a', fontFamily: 'monospace' }}>{p.sku}</div>}
            <div style={{ fontSize: 13, color: '#52525b', fontWeight: 600 }}>{formatMoney(p.price)}</div>
            {!isMobile && <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.categoryName}</div>}
            <div style={{ fontSize: 13, fontWeight: 700, color: p.actualStockQuantity <= p.minimumStockQuantity ? '#dc2626' : '#16a34a' }}>
              {p.actualStockQuantity}
            </div>
          </div>
        ))}
      </TableCard>
    </>
  );
}
