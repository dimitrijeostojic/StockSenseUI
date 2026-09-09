import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getOrders, getOrderById, createOrder, updateOrder, updateOrderStatus, deleteOrder, exportOrderPdf } from '../api/orders';
import { getProducts } from '../api/products';
import { getSuppliers } from '../api/suppliers';
import type { OrderListDto, OrderDetailDto, ProductDto, SupplierDto } from '../types';
import { formatDate, formatMoney } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, AddButton, TableCard, ActionBtn, LoadingState, EmptyState, StatusBadge, Pagination } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, Select, BtnPrimary, BtnSecondary, ConfirmModal } from '../components/Modal';
import { useIsMobile } from '../hooks/useIsMobile';

type StatusFilter = '' | 'Pending' | 'Confirmed' | 'Received' | 'Cancelled';

interface OrderItem {
  productId: string;
  quantity: string;
}

interface OrderModalState {
  open: boolean;
  supplierId: string;
  notes: string;
  items: OrderItem[];
}

interface EditOrderModalState {
  publicId: string;
  supplierId: string;
  orderDate: string;
  notes: string;
}

interface Query {
  pageNumber: number;
  pageSize: number;
  search: string;
  sortBy: string;
  isAscending: boolean;
}

export function OrdersPage() {
  const { showToast } = useToast();
  const { t, lang } = useLanguage();
  const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-US';
  const location = useLocation();
  const [orders, setOrders] = useState<OrderListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetailDto>>({});
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [query, setQuery] = useState<Query>({ pageNumber: 1, pageSize: 10, search: '', sortBy: 'orderDate', isAscending: false });
  const [searchInput, setSearchInput] = useState('');
  const [modal, setModal] = useState<OrderModalState | null>(null);
  const [newOrderErrors, setNewOrderErrors] = useState<{ items?: string }>({});
  const [editErrors, setEditErrors] = useState<{ orderDate?: string }>({});
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditOrderModalState | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q => ({ ...q, search: searchInput, pageNumber: 1 })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);


  const loadDropdowns = useCallback(async () => {
    const [prodRes, supRes] = await Promise.all([getProducts(), getSuppliers()]);
    setProducts(prodRes.items);
    setSuppliers(supRes.items);
  }, []);

  const load = useCallback(async () => {
    const res = await getOrders({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      searchTerm: query.search || undefined,
      sortBy: query.sortBy,
      isAscending: query.isAscending,
      filterOn: statusFilter ? 'OrderStatus' : undefined,
      filterQuery: statusFilter || undefined,
    });
    setOrders(res.items);
    setTotalCount(res.totalCount);
  }, [query, statusFilter]);

  // Load dropdowns once on mount
  useEffect(() => { loadDropdowns(); }, [loadDropdowns]);

  // Load orders on mount and query change
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Reorder shortcut from dashboard
  useEffect(() => {
    const reorderProductId = (location.state as { reorderProductId?: string } | null)?.reorderProductId;
    if (!reorderProductId || loading || !products.length || !suppliers.length) return;
    setModal({ open: true, supplierId: suppliers[0].publicId, notes: '', items: [{ productId: reorderProductId, quantity: '1' }] });
    window.history.replaceState({}, '');
  }, [loading, location.state, products, suppliers]);

  // Open order detail from dashboard
  useEffect(() => {
    const openOrderId = (location.state as { openOrderId?: string } | null)?.openOrderId;
    if (!openOrderId || loading) return;
    getDetail(openOrderId).then(() => setDetailId(openOrderId));
    window.history.replaceState({}, '');
  }, [loading, location.state]);

  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const isMobile = useIsMobile();

  const toggleSort = (field: string) => {
    setQuery(q => ({ ...q, sortBy: field, isAscending: q.sortBy === field ? !q.isAscending : true, pageNumber: 1 }));
  };

  const sortBtn = (label: string, field: string) => {
    const active = query.sortBy === field;
    return (
      <button onClick={() => toggleSort(field)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color: active ? '#6d28d9' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: 'inherit' }}>
        {label}{active ? (query.isAscending ? ' ↑' : ' ↓') : ''}
      </button>
    );
  };

  const getDetail = async (publicId: string): Promise<OrderDetailDto | null> => {
    if (orderDetails[publicId]) return orderDetails[publicId];
    try {
      const detail = await getOrderById(publicId);
      setOrderDetails(prev => ({ ...prev, [publicId]: detail }));
      return detail;
    } catch { return null; }
  };

  const getTotal = (detail: OrderDetailDto | undefined) => {
    if (!detail) return null;
    return detail.orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  };

  const openAdd = () => {
    setNewOrderErrors({});
    setModal({
      open: true,
      supplierId: suppliers[0]?.publicId ?? '',
      notes: '',
      items: [{ productId: products[0]?.publicId ?? '', quantity: '1' }],
    });
  };

  const saveOrder = async () => {
    if (!modal) return;
    if (!modal.items.length) { setNewOrderErrors({ items: t('add_at_least_one') }); return; }
    setNewOrderErrors({});
    setSaving(true);
    try {
      await createOrder({
        supplierPublicId: modal.supplierId,
        orderDate: new Date().toISOString(),
        notes: modal.notes || undefined,
        orderItemsDto: modal.items.map(it => ({ productPublicId: it.productId, quantity: parseInt(it.quantity) || 1 })),
      });
      showToast(t('order_created'));
      setModal(null);
      setQuery(q => ({ ...q, pageNumber: 1 }));
    } catch {
      showToast(t('order_create_failed'));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (publicId: string, status: number, toastMsg: string) => {
    try {
      await updateOrderStatus(publicId, status);
      showToast(toastMsg);
      await load();
      setOrderDetails(prev => { const next = { ...prev }; delete next[publicId]; return next; });
    } catch {
      showToast(t('order_transition_failed'));
    }
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteOrder(publicId);
      showToast(t('order_deleted'));
      await load();
    } catch {
      showToast(t('order_delete_failed'));
    }
  };

  const openEdit = async (o: OrderListDto) => {
    const detail = await getDetail(o.publicId);
    if (!detail) { showToast(t('order_load_failed')); return; }
    setEditErrors({});
    setEditModal({
      publicId: o.publicId,
      supplierId: detail.supplierPublicId,
      orderDate: detail.orderDate.slice(0, 10),
      notes: detail.notes ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const errs: { orderDate?: string } = {};
    if (!editModal.orderDate) errs.orderDate = t('field_required');
    if (errs.orderDate) { setEditErrors(errs); return; }
    setEditErrors({});
    setSaving(true);
    try {
      await updateOrder(editModal.publicId, {
        supplierPublicId: editModal.supplierId,
        orderDate: new Date(editModal.orderDate).toISOString(),
        notes: editModal.notes || undefined,
      });
      showToast(t('order_updated'));
      setEditModal(null);
      setOrderDetails(prev => { const next = { ...prev }; delete next[editModal.publicId]; return next; });
      await load();
    } catch {
      showToast(t('order_update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const orderModalTotal = () => {
    if (!modal) return 0;
    return modal.items.reduce((sum, it) => {
      const prod = products.find(p => p.publicId === it.productId);
      return sum + (parseInt(it.quantity) || 0) * (prod?.price ?? 0);
    }, 0);
  };

  const GRID = '0.8fr 1.4fr 1fr 1fr 1fr 1.6fr';

  return (
    <>
      <PageHeader
        title={t('nav_orders')}
        subtitle={t('orders_subtitle')}
        action={<AddButton onClick={openAdd} label={t('new_order')} />}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: isMobile ? '1 1 100%' : undefined }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('search_orders')}
            style={{ height: 40, width: isMobile ? '100%' : 220, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 14px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}
          />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StatusFilter); setQuery(q => ({ ...q, pageNumber: 1 })); }}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="">{t('all_statuses')}</option>
            <option value="Pending">{t('status_pending')}</option>
            <option value="Confirmed">{t('status_confirmed')}</option>
            <option value="Received">{t('status_received')}</option>
            <option value="Cancelled">{t('status_cancelled')}</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={query.sortBy} onChange={e => setQuery(q => ({ ...q, sortBy: e.target.value, pageNumber: 1 }))}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="orderDate">{t('sort_date')}</option>
            <option value="supplierName">{t('sort_supplier_name')}</option>
          </select>
          <select value={query.isAscending ? 'asc' : 'desc'} onChange={e => setQuery(q => ({ ...q, isAscending: e.target.value === 'asc', pageNumber: 1 }))}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="asc">{t('ascending')}</option>
            <option value="desc">{t('descending')}</option>
          </select>
        </div>
      </div>

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 660 : undefined }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('col_order')}</div>
          {sortBtn(t('supplier'), 'supplierName')}
          {sortBtn(t('date'), 'orderDate')}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('col_total')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('status')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('actions')}</div>
        </div>

        {loading && <LoadingState />}
        {!loading && orders.length === 0 && (
          <EmptyState message={query.search || statusFilter ? t('no_orders_filtered') : t('no_orders')} />
        )}

        {orders.map(o => {
          const detail = orderDetails[o.publicId];
          const total = getTotal(detail);

          return (
            <div key={o.publicId} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 660 : undefined }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a' }}>#{o.publicId.slice(0, 8)}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{o.supplierName}</div>
              <div style={{ fontSize: 13, color: '#52525b' }}>{formatDate(o.orderDate)}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>
                {total != null ? formatMoney(total) : (
                  <button onClick={async () => { await getDetail(o.publicId); }}
                    style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    {t('view')}
                  </button>
                )}
              </div>
              <div><StatusBadge statusNum={o.orderStatus} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn onClick={async () => { await getDetail(o.publicId); setDetailId(o.publicId); }}>{t('btn_details')}</ActionBtn>
                {o.orderStatus === 1 && <ActionBtn onClick={() => openEdit(o)}>{t('edit')}</ActionBtn>}
                {o.orderStatus === 1 && <ActionBtn variant="blue" onClick={() => transition(o.publicId, 2, t('order_confirmed_toast'))}>{t('btn_confirm')}</ActionBtn>}
                {o.orderStatus === 2 && <ActionBtn variant="green" onClick={() => transition(o.publicId, 3, t('order_received_toast'))}>{t('btn_receive')}</ActionBtn>}
                {(o.orderStatus === 1 || o.orderStatus === 2) && <ActionBtn variant="danger" onClick={() => transition(o.publicId, 4, t('order_cancelled_toast'))}>{t('btn_cancel_order')}</ActionBtn>}
                {o.orderStatus === 4 && <ActionBtn variant="danger" onClick={() => setConfirmId(o.publicId)}>{t('delete')}</ActionBtn>}
              </div>
            </div>
          );
        })}

        {totalCount > 0 && (
          <Pagination
            pageNumber={query.pageNumber}
            pageSize={query.pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={n => setQuery(q => ({ ...q, pageNumber: n }))}
            onPageSizeChange={s => setQuery(q => ({ ...q, pageSize: s, pageNumber: 1 }))}
          />
        )}
      </TableCard>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { handleDelete(confirmId!); setConfirmId(null); }}
        title={t('delete_order')}
        message={t('cannot_undo')}
      />

      {/* Edit Order Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} width={460}>
        {editModal && (
          <>
            <ModalTitle>{t('edit_order_title')}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('supplier')}>
                <Select value={editModal.supplierId} onChange={e => setEditModal(prev => ({ ...prev!, supplierId: e.target.value }))}>
                  {suppliers.map(s => <option key={s.publicId} value={s.publicId}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label={t('order_date_field')} error={editErrors.orderDate}>
                <Input error={!!editErrors.orderDate} type="date" value={editModal.orderDate}
                  onChange={e => { setEditModal(prev => ({ ...prev!, orderDate: e.target.value })); setEditErrors({}); }} />
              </Field>
              <Field label={t('notes')}>
                <Input placeholder="Optional note" value={editModal.notes} onChange={e => setEditModal(prev => ({ ...prev!, notes: e.target.value }))} />
              </Field>
            </div>
            <ModalActions>
              <BtnSecondary onClick={() => setEditModal(null)}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={saveEdit} disabled={saving}>{t('save_changes')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>

      {/* Detail Modal */}
      {(() => {
        const detail = detailId ? orderDetails[detailId] : undefined;
        const total = getTotal(detail);
        return (
          <Modal open={!!detailId && !!detail} onClose={() => setDetailId(null)} width={560}>
            {detail && (
              <>
                <ModalTitle>{t('order_details_title')}</ModalTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{t('supplier')}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{detail.supplierName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{t('date')}</div>
                    <div style={{ fontSize: 13.5, color: '#52525b' }}>{formatDate(detail.orderDate, locale)}</div>
                  </div>
                  {detail.notes && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{t('notes')}</div>
                      <div style={{ fontSize: 13, color: '#52525b' }}>{detail.notes}</div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3f3f46', marginBottom: 8 }}>{t('items_label')}</div>
                <div style={{ border: '1px solid #ececf0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr 0.8fr', padding: '9px 14px', background: '#fafafa', borderBottom: '1px solid #ececf0' }}>
                    {[t('col_product'), t('col_qty'), t('col_unit_price'), t('col_total')].map((h, i) => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
                    ))}
                  </div>
                  {detail.orderItems.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr 0.8fr', padding: '11px 14px', borderBottom: i < detail.orderItems.length - 1 ? '1px solid #f5f4f7' : 'none', alignItems: 'center' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#18181b' }}>{it.productName}</div>
                      <div style={{ fontSize: 13, color: '#52525b', textAlign: 'right' }}>{it.quantity}</div>
                      <div style={{ fontSize: 13, color: '#52525b', textAlign: 'right' }}>{formatMoney(it.unitPrice)}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b', textAlign: 'right' }}>{formatMoney(it.quantity * it.unitPrice)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #ececf0' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#71717a' }}>{t('order_total')}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#18181b' }}>{formatMoney(total ?? 0)}</div>
                </div>

                <ModalActions>
                  <BtnSecondary onClick={() => setDetailId(null)}>{t('close')}</BtnSecondary>
                  <BtnPrimary
                    disabled={exportingPdf}
                    onClick={async () => {
                      setExportingPdf(true);
                      try { await exportOrderPdf(detailId!); }
                      catch { showToast(t('export_pdf_failed')); }
                      finally { setExportingPdf(false); }
                    }}
                  >{exportingPdf ? '…' : t('export_pdf')}</BtnPrimary>
                </ModalActions>
              </>
            )}
          </Modal>
        );
      })()}

      {/* New Order Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} width={560}>
        {modal && (
          <>
            <ModalTitle>{t('new_order_title')}</ModalTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <Field label={t('supplier')}>
                <Select value={modal.supplierId} onChange={e => setModal(prev => ({ ...prev!, supplierId: e.target.value }))}>
                  {suppliers.map(s => <option key={s.publicId} value={s.publicId}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label={t('notes')}>
                <Input placeholder="Optional note" value={modal.notes} onChange={e => setModal(prev => ({ ...prev!, notes: e.target.value }))} />
              </Field>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3f3f46', marginBottom: 8 }}>{t('items_label')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modal.items.map((it, idx) => {
                const prod = products.find(p => p.publicId === it.productId);
                const lineTotal = (parseInt(it.quantity) || 0) * (prod?.price ?? 0);
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.9fr auto', gap: 8, alignItems: 'center', background: '#fafafa', border: '1px solid #ececf0', borderRadius: 10, padding: 10 }}>
                    <select value={it.productId}
                      onChange={e => setModal(prev => ({ ...prev!, items: prev!.items.map((item, i) => i === idx ? { ...item, productId: e.target.value } : item) }))}
                      style={{ height: 36, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
                      {products.map(p => <option key={p.publicId} value={p.publicId}>{p.name}</option>)}
                    </select>
                    <input type="number" value={it.quantity} placeholder="Qty"
                      onChange={e => setModal(prev => ({ ...prev!, items: prev!.items.map((item, i) => i === idx ? { ...item, quantity: e.target.value } : item) }))}
                      style={{ height: 36, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', textAlign: 'right' }}>{formatMoney(lineTotal)}</div>
                    <button onClick={() => setModal(prev => ({ ...prev!, items: prev!.items.filter((_, i) => i !== idx) }))}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fbdada', background: '#fff5f5', color: '#dc2626', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <button onClick={() => { setModal(prev => ({ ...prev!, items: [...prev!.items, { productId: products[0]?.publicId ?? '', quantity: '1' }] })); setNewOrderErrors({}); }}
              style={{ marginTop: 10, height: 36, padding: '0 14px', borderRadius: 8, border: `1px dashed ${newOrderErrors.items ? '#dc2626' : '#d4d4d8'}`, background: '#ffffff', color: newOrderErrors.items ? '#dc2626' : '#71717a', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
              {t('add_item')}
            </button>
            {newOrderErrors.items && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{newOrderErrors.items}</div>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTop: '1px solid #ececf0' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#71717a' }}>{t('order_total')}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#18181b' }}>{formatMoney(orderModalTotal())}</div>
            </div>

            <ModalActions>
              <BtnSecondary onClick={() => setModal(null)}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={saveOrder} disabled={saving}>{t('create_order')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
