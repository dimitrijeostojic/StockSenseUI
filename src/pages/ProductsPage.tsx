import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct, createStockEntry, bulkImportProducts } from '../api/products';
import type { BulkImportResult, UpdateProductBody } from '../api/products';
import { getCategories } from '../api/categories';
import { getSuppliers } from '../api/suppliers';
import type { ProductDto, CategoryDto, SupplierDto } from '../types';
import { formatMoney } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, AddButton, TableCard, ActionBtn, LoadingState, EmptyState, Pagination } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, Select, BtnPrimary, BtnSecondary, ConfirmModal, ApiErrorBox } from '../components/Modal';
import { extractApiErrors, extractErrorMessage } from '../api/client';
import { useIsMobile } from '../hooks/useIsMobile';
import { UOM_KEYS } from '../types';

const SWATCHES = ['#6d28d9', '#2563eb', '#16a34a', '#d97706', '#db2777', '#0891b2'];

type StockType = 1 | 2;

interface ProductModalState {
  open: boolean;
  mode: 'add' | 'edit';
  publicId?: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  vatRate: string;
  minimumStockQuantity: string;
  unitOfMeasurement: string;
  categoryId: string;
  supplierId: string;
}

interface ImportModalState {
  open: boolean;
  file: File | null;
  importing: boolean;
  result: BulkImportResult | null;
  fileError: string | null;
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

const emptyProduct: ProductModalState = { open: true, mode: 'add', name: '', sku: '', description: '', price: '', vatRate: '20', minimumStockQuantity: '', unitOfMeasurement: '1', categoryId: '', supplierId: '' };

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
  const [productErrors, setProductErrors] = useState<{ name?: string; sku?: string; price?: string }>({});
  const [stockModal, setStockModal] = useState<StockModalState | null>(null);
  const [stockErrors, setStockErrors] = useState<{ quantity?: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importModal, setImportModal] = useState<ImportModalState | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(q => q.search === searchInput ? q : { ...q, search: searchInput, pageNumber: 1 }), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    getCategories().then(setCategories);
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

  const openAdd = async () => {
    setProductErrors({});
    setApiError([]);
    if (suppliers.length === 0) {
      const sups = await getSuppliers();
      setSuppliers(sups.items);
      setProductModal({ ...emptyProduct, categoryId: categories[0]?.publicId ?? '', supplierId: sups.items[0]?.publicId ?? '' });
    } else {
      setProductModal({ ...emptyProduct, categoryId: categories[0]?.publicId ?? '', supplierId: suppliers[0]?.publicId ?? '' });
    }
  };

  const openEdit = async (p: ProductDto) => {
    setApiError([]);
    if (suppliers.length === 0) {
      const sups = await getSuppliers();
      setSuppliers(sups.items);
    }
    const sku = p.sku ?? '';
    const preErrors: { name?: string; sku?: string; price?: string } = {};
    if (!sku.trim()) preErrors.sku = t('field_required');
    setProductErrors(preErrors);
    setProductModal({
      open: true, mode: 'edit', publicId: p.publicId,
      name: p.name, sku, description: p.description ?? '',
      price: String(p.price), vatRate: String(p.vatRate ?? 20), minimumStockQuantity: String(p.minimumStockQuantity),
      unitOfMeasurement: String(p.unitOfMeasurement ?? 1),
      categoryId: p.categoryPublicId, supplierId: p.supplierPublicId,
    });
  };

  const saveProduct = async () => {
    if (!productModal) return;
    const errs: { name?: string; sku?: string; price?: string } = {};
    if (!productModal.name.trim()) errs.name = t('field_required');
    if (!(productModal.sku ?? '').trim()) errs.sku = t('field_required');
    else if (productModal.sku.trim().length > 20) errs.sku = t('sku_max_length');
    else if (!/^[A-Za-z0-9\-_]+$/.test(productModal.sku.trim())) errs.sku = t('sku_invalid_format');
    const priceVal = parseFloat(productModal.price);
    if (!productModal.price || isNaN(priceVal) || priceVal <= 0) errs.price = t('price_positive');
    if (Object.keys(errs).length) { setProductErrors(errs); return; }
    setProductErrors({});
    setSaving(true);
    try {
      const sharedFields = {
        name: productModal.name, sku: productModal.sku, description: productModal.description,
        price: parseFloat(productModal.price) || 0,
        vatRate: parseFloat(productModal.vatRate) || 20,
        minimumStockQuantity: parseInt(productModal.minimumStockQuantity) || 0,
        unitOfMeasurement: parseInt(productModal.unitOfMeasurement) || 1,
      };
      if (productModal.mode === 'add') {
        await createProduct({ ...sharedFields, categoryPublicId: productModal.categoryId, supplierPublicId: productModal.supplierId });
        showToast(t('product_added'));
        setProductModal(null);
        setQuery(q => ({ ...q, pageNumber: 1 }));
      } else {
        const updateBody: UpdateProductBody = { ...sharedFields, categoryId: productModal.categoryId, supplierId: productModal.supplierId };
        await updateProduct(productModal.publicId!, updateBody);
        showToast(t('product_updated'));
        setProductModal(null);
        await load();
      }
    } catch (err) {
      const errs = extractApiErrors(err);
      if (errs.length) setApiError(errs);
      else showToast(t('product_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(confirmId);
      showToast(t('product_deleted'));
      setConfirmId(null);
      await load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err) ?? t('product_delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  const openStock = (p: ProductDto) => {
    setStockErrors({});
    setApiError([]);
    setStockModal({ open: true, publicId: p.publicId, productName: p.name, currentStock: p.actualStockQuantity, type: 1, quantity: '', notes: '' });
  };

  const saveStock = async () => {
    if (!stockModal) return;
    const qty = parseInt(stockModal.quantity) || 0;
    if (qty <= 0) { setStockErrors({ quantity: t('qty_positive') }); return; }
    setStockErrors({});
    setSaving(true);
    try {
      await createStockEntry(stockModal.publicId, { quantity: qty, notes: stockModal.notes || undefined, stockEntryType: stockModal.type });
      showToast(t('stock_updated'));
      setStockModal(null);
      await load();
    } catch (err) {
      const errs = extractApiErrors(err);
      if (errs.length) setApiError(errs);
      else showToast(t('stock_update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const openImport = () => setImportModal({ open: true, file: null, importing: false, result: null, fileError: null });
  const closeImport = () => setImportModal(null);

  const handleBulkImport = async () => {
    if (!importModal?.file) { setImportModal(prev => ({ ...prev!, fileError: t('bulk_import_no_file') })); return; }
    setImportModal(prev => ({ ...prev!, importing: true, fileError: null }));
    try {
      const result = await bulkImportProducts(importModal.file);
      setImportModal(prev => ({ ...prev!, importing: false, result }));
      if (result.failureCount === 0) showToast(t('bulk_import_btn') + ' ' + t('bulk_import_imported'));
      await load();
    } catch {
      setImportModal(prev => ({ ...prev!, importing: false }));
      showToast(t('product_save_failed'));
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
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={openImport}
              style={{ height: 40, padding: '0 18px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#ffffff', color: '#3f3f46', fontSize: 13.5, fontWeight: 700, fontFamily: "'Manrope', system-ui, sans-serif", cursor: 'pointer' }}
            >
              {t('import_csv')}
            </button>
            <AddButton onClick={openAdd} label={t('add_product')} />
          </div>
        }
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
        onClose={() => { setConfirmId(null); setDeleteError(null); }}
        onConfirm={handleDelete}
        title={t('delete_product')}
        message={t('cannot_undo')}
        error={deleteError ?? undefined}
        loading={deleting}
      />

      {/* Product Modal */}
      <Modal open={!!pm} onClose={() => { setProductModal(null); setApiError([]); }} width={460}>
        {pm && (
          <>
            <ModalTitle>{pm.mode === 'add' ? t('add_product_title') : t('edit_product_title')}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('name')} error={productErrors.name} required>
                  <Input error={!!productErrors.name} placeholder="e.g. Wireless Mouse" value={pm.name}
                    onChange={e => { setProductModal(prev => ({ ...prev!, name: e.target.value })); setProductErrors(prev => ({ ...prev, name: undefined })); }} />
                </Field>
                <Field label={t('field_sku')} error={productErrors.sku} required>
                  <Input error={!!productErrors.sku} placeholder="e.g. WM-001" value={pm.sku}
                    onChange={e => {
                      setProductModal(prev => ({ ...prev!, sku: e.target.value }));
                      if (!e.target.value.trim()) setProductErrors(prev => ({ ...prev, sku: t('field_required') }));
                      else setProductErrors(prev => ({ ...prev, sku: undefined }));
                    }}
                    onBlur={e => { if (!e.target.value.trim()) setProductErrors(prev => ({ ...prev, sku: t('field_required') })); }} />
                </Field>
              </div>
              <Field label={t('description')} optional>
                <Input placeholder="Short description" value={pm.description} onChange={e => setProductModal(prev => ({ ...prev!, description: e.target.value }))} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('field_price')} error={productErrors.price} required>
                  <Input error={!!productErrors.price} type="number" placeholder="0.00" value={pm.price}
                    onChange={e => { setProductModal(prev => ({ ...prev!, price: e.target.value })); setProductErrors(prev => ({ ...prev, price: undefined })); }} />
                </Field>
                <Field label={t('field_min_stock')} required>
                  <Input type="number" placeholder="0" value={pm.minimumStockQuantity} onChange={e => setProductModal(prev => ({ ...prev!, minimumStockQuantity: e.target.value }))} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('field_unit_of_measurement')} required>
                  <Select value={pm.unitOfMeasurement} onChange={e => setProductModal(prev => ({ ...prev!, unitOfMeasurement: e.target.value }))}>
                    {Object.entries(UOM_KEYS).map(([val, key]) => (
                      <option key={val} value={val}>{t(key)}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('field_vat_rate')} required>
                  <Select value={pm.vatRate} onChange={e => setProductModal(prev => ({ ...prev!, vatRate: e.target.value }))}>
                    <option value="0">0%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </Select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('category')} required>
                  <Select value={pm.categoryId} onChange={e => setProductModal(prev => ({ ...prev!, categoryId: e.target.value }))}>
                    {categories.map(c => <option key={c.publicId} value={c.publicId}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label={t('supplier')} required>
                  <Select value={pm.supplierId} onChange={e => setProductModal(prev => ({ ...prev!, supplierId: e.target.value }))}>
                    {suppliers.map(s => <option key={s.publicId} value={s.publicId}>{s.name}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
            <ApiErrorBox errors={apiError} />
            <ModalActions>
              <BtnSecondary onClick={() => { setProductModal(null); setApiError([]); }}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={saveProduct} disabled={saving}>{t('save_product')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal open={!!importModal} onClose={closeImport} width={500}>
        {importModal && (
          <>
            <ModalTitle>{t('bulk_import_title')}</ModalTitle>
            {!importModal.result ? (
              <>
                <div style={{ fontSize: 12.5, color: '#71717a', marginTop: -12, marginBottom: 18, lineHeight: 1.5 }}>
                  {t('bulk_import_hint')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: importModal.fileError ? '#dc2626' : '#3f3f46', display: 'block', marginBottom: 6 }}>
                      {t('bulk_import_file_label')}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0] ?? null;
                          setImportModal(prev => ({ ...prev!, file: f, fileError: null }));
                        }}
                      />
                      <span style={{
                        height: 40, padding: '0 14px', borderRadius: 10,
                        border: importModal.fileError ? '1px solid #dc2626' : '1px solid #e4e4e7',
                        background: '#fafafa', fontSize: 13.5, fontFamily: "'Manrope', system-ui, sans-serif",
                        display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
                        color: '#6d28d9', fontWeight: 700, cursor: 'pointer',
                      }}>
                        Choose file
                      </span>
                      <span style={{ fontSize: 13, color: importModal.file ? '#18181b' : '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {importModal.file ? importModal.file.name : 'No file chosen'}
                      </span>
                    </label>
                    {importModal.fileError && (
                      <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{importModal.fileError}</div>
                    )}
                  </div>
                </div>
                <ModalActions>
                  <BtnSecondary onClick={closeImport}>{t('cancel')}</BtnSecondary>
                  <BtnPrimary onClick={handleBulkImport} disabled={importModal.importing}>
                    {importModal.importing ? '…' : t('bulk_import_btn')}
                  </BtnPrimary>
                </ModalActions>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', borderRadius: 10, padding: '14px 0' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{importModal.result.successCount}</div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{t('bulk_import_imported')}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', background: importModal.result.failureCount > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 10, padding: '14px 0' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: importModal.result.failureCount > 0 ? '#dc2626' : '#16a34a' }}>{importModal.result.failureCount}</div>
                    <div style={{ fontSize: 12, color: importModal.result.failureCount > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{t('bulk_import_failed_label')}</div>
                  </div>
                </div>
                {importModal.result.errors.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3f3f46', marginBottom: 8 }}>{t('bulk_import_errors_label')}</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {importModal.result.errors.map(e => (
                        <div key={e.rowNumber} style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#dc2626' }}>
                          <span style={{ fontWeight: 700 }}>Row {e.rowNumber}:</span> {e.errorMessage}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <ModalActions>
                  <BtnSecondary onClick={() => setImportModal(prev => ({ ...prev!, result: null, file: null }))}>{t('import_csv')}</BtnSecondary>
                  <BtnPrimary onClick={closeImport}>{t('close')}</BtnPrimary>
                </ModalActions>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Stock Modal */}
      <Modal open={!!sm} onClose={() => { setStockModal(null); setApiError([]); }} width={400}>
        {sm && (
          <>
            <ModalTitle>{t('adjust_stock')}</ModalTitle>
            <div style={{ fontSize: 13, color: '#71717a', marginTop: -12, marginBottom: 18 }}>
              {sm.productName} · {t('current_prefix')}{sm.currentStock}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([1, 2] as StockType[]).map(type => {
                const labels: Record<StockType, string> = { 1: t('stock_btn_in'), 2: t('stock_btn_out') };
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
              <Field label={t('quantity')} error={stockErrors.quantity} required>
                <Input error={!!stockErrors.quantity} type="number" placeholder="0" value={sm.quantity}
                  onChange={e => { setStockModal(prev => ({ ...prev!, quantity: e.target.value })); setStockErrors({}); }} />
              </Field>
              <Field label={t('notes')} optional>
                <Input placeholder="Optional note" value={sm.notes} onChange={e => setStockModal(prev => ({ ...prev!, notes: e.target.value }))} />
              </Field>
            </div>
            <ApiErrorBox errors={apiError} />
            <ModalActions>
              <BtnSecondary onClick={() => { setStockModal(null); setApiError([]); }}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={saveStock} disabled={saving}>{t('save')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
