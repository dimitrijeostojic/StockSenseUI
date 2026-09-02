import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct, createStockEntry } from '../api/products';
import { getCategories } from '../api/categories';
import { getSuppliers } from '../api/suppliers';
import type { ProductDto, CategoryDto, SupplierDto } from '../types';
import { formatMoney } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, AddButton, TableCard, ActionBtn, LoadingState, EmptyState } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, Select, BtnPrimary, BtnSecondary, ConfirmModal } from '../components/Modal';
import { useIsMobile } from '../hooks/useIsMobile';

const SWATCHES = ['#6d28d9', '#2563eb', '#16a34a', '#d97706', '#db2777', '#0891b2'];

type StockType = 1 | 2 | 3;

interface ProductModalState {
  open: boolean;
  mode: 'add' | 'edit';
  publicId?: string;
  name: string;
  description: string;
  price: string;
  minimumStockQuantity: string;
  categoryId: string;
  supplierId: string;
}

interface StockModalState {
  open: boolean;
  publicId: string;
  productName: string;
  currentStock: number;
  type: StockType;
  quantity: string;
  notes: string;
}

interface Query {
  pageNumber: number;
  pageSize: number;
  search: string;
  sortBy: string;
  isAscending: boolean;
}

const emptyProduct: ProductModalState = { open: true, mode: 'add', name: '', description: '', price: '', minimumStockQuantity: '', categoryId: '', supplierId: '' };

export function ProductsPage() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<Query>({ pageNumber: 1, pageSize: 10, search: '', sortBy: 'name', isAscending: true });
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [productModal, setProductModal] = useState<ProductModalState | null>(null);
  const [stockModal, setStockModal] = useState<StockModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(q => ({ ...q, search: searchInput, pageNumber: 1 })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load dropdowns once
  useEffect(() => {
    Promise.all([getCategories(), getSuppliers()]).then(([cats, sups]) => {
      setCategories(cats);
      setSuppliers(sups.items);
    });
  }, []);

  const load = useCallback(async () => {
    const res = await getProducts({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      searchTerm: query.search || undefined,
      sortBy: query.sortBy,
      isAscending: query.isAscending,
      filterOn: categoryFilter ? 'Category' : undefined,
      filterQuery: categoryFilter || undefined,
    });
    setProducts(res.items);
    setTotalCount(res.totalCount);
  }, [query, categoryFilter]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const toggleSort = (field: string) => {
    setQuery(q => ({ ...q, sortBy: field, isAscending: q.sortBy === field ? !q.isAscending : true, pageNumber: 1 }));
  };

  const sortBtn = (label: string, field: string, textAlignRight?: boolean) => {
    const active = query.sortBy === field;
    return (
      <button onClick={() => toggleSort(field)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color: active ? '#6d28d9' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: 'inherit', justifyContent: textAlignRight ? 'flex-end' : 'flex-start' }}>
        {label}{active ? (query.isAscending ? ' ↑' : ' ↓') : ''}
      </button>
    );
  };

  const openAdd = () => {
    setProductModal({ ...emptyProduct, categoryId: categories[0]?.publicId ?? '', supplierId: suppliers[0]?.publicId ?? '' });
  };

  const openEdit = (p: ProductDto) => {
    setProductModal({
      open: true, mode: 'edit', publicId: p.publicId,
      name: p.name, description: p.description ?? '',
      price: String(p.price), minimumStockQuantity: String(p.minimumStockQuantity),
      categoryId: p.categoryPublicId, supplierId: p.supplierPublicId,
    });
  };

  const saveProduct = async () => {
    if (!productModal) return;
    if (!productModal.name.trim()) { showToast(t('product_name_required')); return; }
    setSaving(true);
    try {
      const body = {
        name: productModal.name, description: productModal.description,
        price: parseFloat(productModal.price) || 0,
        minimumStockQuantity: parseInt(productModal.minimumStockQuantity) || 0,
        categoryPublicId: productModal.categoryId, supplierPublicId: productModal.supplierId,
      };
      if (productModal.mode === 'add') {
        await createProduct(body);
        showToast(t('product_added'));
        setProductModal(null);
        setQuery(q => ({ ...q, pageNumber: 1 }));
      } else {
        await updateProduct(productModal.publicId!, body);
        showToast(t('product_updated'));
        setProductModal(null);
        await load();
      }
    } catch {
      showToast(t('product_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteProduct(publicId);
      showToast(t('product_deleted'));
      await load();
    } catch {
      showToast(t('product_delete_failed'));
    }
  };

  const openStock = (p: ProductDto) => {
    setStockModal({ open: true, publicId: p.publicId, productName: p.name, currentStock: p.actualStockQuantity, type: 1, quantity: '', notes: '' });
  };

  const saveStock = async () => {
    if (!stockModal) return;
    const qty = parseInt(stockModal.quantity) || 0;
    if (qty <= 0) { showToast(t('stock_qty_invalid')); return; }
    setSaving(true);
    try {
      await createStockEntry(stockModal.publicId, { quantity: qty, notes: stockModal.notes || undefined, stockEntryType: stockModal.type });
      showToast(t('stock_updated'));
      setStockModal(null);
      await load();
    } catch {
      showToast(t('stock_update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const pm = productModal;
  const sm = stockModal;
  const isMobile = useIsMobile();

  return (
    <>
      <PageHeader
        title={t('nav_products')}
        subtitle={`${totalCount} ${t('products_subtitle')}`}
        action={<AddButton onClick={openAdd} label={t('add_product')} />}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: isMobile ? '1 1 100%' : undefined }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('search_products')}
            style={{ height: 40, width: isMobile ? '100%' : 220, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 14px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}
          />
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setQuery(q => ({ ...q, pageNumber: 1 })); }}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="">{t('all_categories')}</option>
            {categories.map(c => <option key={c.publicId} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={query.sortBy} onChange={e => setQuery(q => ({ ...q, sortBy: e.target.value, pageNumber: 1 }))}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="name">{t('sort_name')}</option>
            <option value="price">{t('sort_price')}</option>
            <option value="actualStockQuantity">{t('sort_stock')}</option>
          </select>
          <select value={query.isAscending ? 'asc' : 'desc'} onChange={e => setQuery(q => ({ ...q, isAscending: e.target.value === 'asc', pageNumber: 1 }))}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="asc">{t('ascending')}</option>
            <option value="desc">{t('descending')}</option>
          </select>
        </div>
      </div>

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.3fr 0.8fr 0.7fr 1.5fr', padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', gap: 12, minWidth: isMobile ? 660 : undefined }}>
          {sortBtn(t('col_product'), 'name')}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('category')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('supplier')}</div>
          {sortBtn(t('price'), 'price')}
          {sortBtn(t('col_stock'), 'actualStockQuantity')}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('actions')}</div>
        </div>

        {loading && <LoadingState />}
        {!loading && products.length === 0 && (
          <EmptyState message={query.search || categoryFilter ? t('no_products_filtered') : t('no_products')} />
        )}

        {products.map((p, idx) => {
          const low = p.actualStockQuantity < p.minimumStockQuantity;
          const swatch = SWATCHES[idx % SWATCHES.length];
          return (
            <div key={p.publicId} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.3fr 0.8fr 0.7fr 1.5fr', padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', gap: 12, minWidth: isMobile ? 660 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: swatch, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: 13 }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.categoryName}</div>
              <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.supplierName}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{formatMoney(p.price)}</div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: low ? '#fef2f2' : '#f0fdf4', color: low ? '#dc2626' : '#16a34a' }}>
                  {p.actualStockQuantity}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn onClick={() => navigate(`/products/${p.publicId}`)}>{t('view')}</ActionBtn>
                <ActionBtn onClick={() => openStock(p)}>{t('adjust')}</ActionBtn>
                <ActionBtn onClick={() => openEdit(p)}>{t('edit')}</ActionBtn>
                <ActionBtn variant="danger" onClick={() => setConfirmId(p.publicId)}>{t('delete')}</ActionBtn>
              </div>
            </div>
          );
        })}

        {totalCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderTop: '1px solid #ececf0', background: '#fafafa' }}>
            <div style={{ fontSize: 13, color: '#71717a' }}>
              {`${(query.pageNumber - 1) * query.pageSize + 1}–${Math.min(query.pageNumber * query.pageSize, totalCount)} ${t('of')} ${totalCount}`}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={query.pageSize} onChange={e => setQuery(q => ({ ...q, pageSize: Number(e.target.value), pageNumber: 1 }))}
                style={{ height: 32, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 12.5, fontFamily: 'inherit', background: '#ffffff', color: '#3f3f46' }}>
                {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n} {t('per_page')}</option>)}
              </select>
              <button
                disabled={query.pageNumber <= 1}
                onClick={() => setQuery(q => ({ ...q, pageNumber: q.pageNumber - 1 }))}
                style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#ffffff', color: query.pageNumber <= 1 ? '#a1a1aa' : '#3f3f46', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: query.pageNumber <= 1 ? 'not-allowed' : 'pointer' }}
              >{t('prev')}</button>
              <span style={{ fontSize: 13, color: '#52525b', minWidth: 90, textAlign: 'center' }}>{t('page')} {query.pageNumber} {t('of')} {totalPages}</span>
              <button
                disabled={query.pageNumber >= totalPages}
                onClick={() => setQuery(q => ({ ...q, pageNumber: q.pageNumber + 1 }))}
                style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#ffffff', color: query.pageNumber >= totalPages ? '#a1a1aa' : '#3f3f46', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: query.pageNumber >= totalPages ? 'not-allowed' : 'pointer' }}
              >{t('next')}</button>
            </div>
          </div>
        )}
      </TableCard>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { handleDelete(confirmId!); setConfirmId(null); }}
        title={t('delete_product')}
        message={t('cannot_undo')}
      />

      {/* Product Modal */}
      <Modal open={!!pm} onClose={() => setProductModal(null)} width={460}>
        {pm && (
          <>
            <ModalTitle>{pm.mode === 'add' ? t('add_product_title') : t('edit_product_title')}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('name')}>
                <Input placeholder="e.g. Wireless Mouse" value={pm.name} onChange={e => setProductModal(prev => ({ ...prev!, name: e.target.value }))} />
              </Field>
              <Field label={t('description')}>
                <Input placeholder="Short description" value={pm.description} onChange={e => setProductModal(prev => ({ ...prev!, description: e.target.value }))} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('field_price')}>
                  <Input type="number" placeholder="0.00" value={pm.price} onChange={e => setProductModal(prev => ({ ...prev!, price: e.target.value }))} />
                </Field>
                <Field label={t('field_min_stock')}>
                  <Input type="number" placeholder="0" value={pm.minimumStockQuantity} onChange={e => setProductModal(prev => ({ ...prev!, minimumStockQuantity: e.target.value }))} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('category')}>
                  <Select value={pm.categoryId} onChange={e => setProductModal(prev => ({ ...prev!, categoryId: e.target.value }))}>
                    {categories.map(c => <option key={c.publicId} value={c.publicId}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label={t('supplier')}>
                  <Select value={pm.supplierId} onChange={e => setProductModal(prev => ({ ...prev!, supplierId: e.target.value }))}>
                    {suppliers.map(s => <option key={s.publicId} value={s.publicId}>{s.name}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
            <ModalActions>
              <BtnSecondary onClick={() => setProductModal(null)}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={saveProduct} disabled={saving}>{t('save_product')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>

      {/* Stock Modal */}
      <Modal open={!!sm} onClose={() => setStockModal(null)} width={400}>
        {sm && (
          <>
            <ModalTitle>{t('adjust_stock')}</ModalTitle>
            <div style={{ fontSize: 13, color: '#71717a', marginTop: -12, marginBottom: 18 }}>
              {sm.productName} · {t('current_prefix')}{sm.currentStock}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([1, 2, 3] as StockType[]).map(type => {
                const labels: Record<StockType, string> = { 1: t('stock_btn_in'), 2: t('stock_btn_out'), 3: t('stock_btn_adj') };
                const active = sm.type === type;
                return (
                  <button key={type} onClick={() => setStockModal(prev => ({ ...prev!, type }))}
                    style={{ height: 34, flex: 1, borderRadius: 9, border: active ? 'none' : '1px solid #e4e4e7', background: active ? '#18181b' : '#ffffff', color: active ? '#ffffff' : '#52525b', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('quantity')}>
                <Input type="number" placeholder="0" value={sm.quantity} onChange={e => setStockModal(prev => ({ ...prev!, quantity: e.target.value }))} />
              </Field>
              <Field label={t('notes')}>
                <Input placeholder="Optional note" value={sm.notes} onChange={e => setStockModal(prev => ({ ...prev!, notes: e.target.value }))} />
              </Field>
            </div>
            <ModalActions>
              <BtnSecondary onClick={() => setStockModal(null)}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={saveStock} disabled={saving}>{t('save')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
