import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierById } from '../api/suppliers';
import type { SupplierDto } from '../types';
import { CURRENCY } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, AddButton, TableCard, ActionBtn, LoadingState, EmptyState, Pagination } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, Select, BtnPrimary, BtnSecondary, ConfirmModal, ApiErrorBox } from '../components/Modal';
import { extractApiErrors, extractErrorMessage } from '../api/client';
import { useIsMobile } from '../hooks/useIsMobile';

interface SupplierModalState {
  open: boolean;
  mode: 'add' | 'edit';
  publicId?: string;
  name: string;
  contactName: string;
  contactEmail: string;
  supplierCode: string;
  currency: number;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
}

interface Query {
  pageNumber: number;
  pageSize: number;
  search: string;
  sortBy: string;
  isAscending: boolean;
}

export function SuppliersPage() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<SupplierModalState | null>(null);
  const [errors, setErrors] = useState<{ name?: string; contactName?: string; contactEmail?: string; supplierCode?: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState<Query>({ pageNumber: 1, pageSize: 10, search: '', sortBy: 'name', isAscending: true });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q => q.search === searchInput ? q : { ...q, search: searchInput, pageNumber: 1 }), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    const res = await getSuppliers({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      searchTerm: query.search || undefined,
      sortBy: query.sortBy,
      isAscending: query.isAscending,
    });
    setSuppliers(res.items);
    setTotalCount(res.totalCount);
  }, [query]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

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

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const openAdd = () => { setErrors({}); setApiError([]); setModal({ open: true, mode: 'add', name: '', contactName: '', contactEmail: '', supplierCode: '', currency: 2, contactPhone: '', address: '', city: '', country: '' }); };
  const openEdit = async (s: SupplierDto) => {
    setErrors({}); setApiError([]);
    const full = await getSupplierById(s.publicId);
    setModal({ open: true, mode: 'edit', publicId: s.publicId, name: full.name, contactName: full.contactName, contactEmail: full.contactEmail, supplierCode: full.supplierCode, currency: full.currency, contactPhone: full.contactPhone ?? '', address: full.address ?? '', city: full.city ?? '', country: full.country ?? '' });
  };

  const save = async () => {
    if (!modal) return;
    const errs: { name?: string; contactName?: string; contactEmail?: string; supplierCode?: string } = {};
    if (!modal.name.trim()) errs.name = t('field_required');
    if (!modal.contactName.trim()) errs.contactName = t('field_required');
    if (!modal.contactEmail.trim()) errs.contactEmail = t('field_required');
    else if (!emailRe.test(modal.contactEmail)) errs.contactEmail = t('email_invalid');
    if (!modal.supplierCode.trim()) errs.supplierCode = t('field_required');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const body = { name: modal.name, contactName: modal.contactName, contactEmail: modal.contactEmail, supplierCode: modal.supplierCode, currency: modal.currency, contactPhone: modal.contactPhone || undefined, address: modal.address || undefined, city: modal.city || undefined, country: modal.country || undefined };
      if (modal.mode === 'add') {
        await createSupplier(body);
        showToast(t('supplier_added'));
        setModal(null);
        setQuery(q => ({ ...q, pageNumber: 1 }));
      } else {
        await updateSupplier(modal.publicId!, body);
        showToast(t('supplier_updated'));
        setModal(null);
        await load();
      }
    } catch (err) {
      const errs = extractApiErrors(err);
      if (errs.length) setApiError(errs);
      else showToast(t('supplier_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSupplier(confirmId);
      showToast(t('supplier_deleted'));
      setConfirmId(null);
      await load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err) ?? t('supplier_delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const isMobile = useIsMobile();
  const GRID = '1.4fr 1.2fr 1.4fr 0.9fr 0.6fr 1fr';

  return (
    <>
      <PageHeader
        title={t('nav_suppliers')}
        subtitle={t('suppliers_subtitle')}
        action={<AddButton onClick={openAdd} label={t('add_supplier')} />}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder={t('search_suppliers')}
          style={{ height: 40, width: isMobile ? '100%' : 260, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 14px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={query.sortBy} onChange={e => setQuery(q => ({ ...q, sortBy: e.target.value, pageNumber: 1 }))}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="name">{t('sort_name')}</option>
            <option value="contactName">{t('sort_contact')}</option>
          </select>
          <select value={query.isAscending ? 'asc' : 'desc'} onChange={e => setQuery(q => ({ ...q, isAscending: e.target.value === 'asc', pageNumber: 1 }))}
            style={{ height: 40, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#ffffff', color: '#18181b' }}>
            <option value="asc">{t('ascending')}</option>
            <option value="desc">{t('descending')}</option>
          </select>
        </div>
      </div>

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 640 : undefined }}>
          {sortBtn(t('supplier'), 'name')}
          {sortBtn(t('col_contact'), 'contactName')}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('email')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('phone')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('field_currency')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('actions')}</div>
        </div>

        {loading && <LoadingState />}
        {!loading && suppliers.length === 0 && (
          <EmptyState message={query.search ? t('no_suppliers_filtered') : t('no_suppliers')} />
        )}

        {suppliers.map(s => (
          <div key={s.publicId} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 640 : undefined }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
            <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contactName || '—'}</div>
            <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contactEmail || '—'}</div>
            <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contactPhone || '—'}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6d28d9' }}>{CURRENCY[s.currency] ?? '—'}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <ActionBtn onClick={() => navigate(`/suppliers/${s.publicId}`)}>{t('view')}</ActionBtn>
              <ActionBtn onClick={() => openEdit(s)}>{t('edit')}</ActionBtn>
              <ActionBtn variant="danger" onClick={() => setConfirmId(s.publicId)}>{t('delete')}</ActionBtn>
            </div>
          </div>
        ))}

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
        title={t('delete_supplier')}
        message={t('cannot_undo')}
        error={deleteError ?? undefined}
        loading={deleting}
      />

      <Modal open={!!modal} onClose={() => { setModal(null); setApiError([]); }} width={560}>
        {modal && (
          <>
            <ModalTitle>{modal.mode === 'add' ? t('add_supplier_title') : t('edit_supplier_title')}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr', gap: 14 }}>
                <Field label={t('field_company')} error={errors.name} required>
                  <Input error={!!errors.name} placeholder="e.g. NovaSupply" value={modal.name}
                    onChange={e => { setModal(prev => ({ ...prev!, name: e.target.value })); setErrors(prev => ({ ...prev, name: undefined })); }} />
                </Field>
                <Field label={t('field_supplier_code')} error={errors.supplierCode} required>
                  <Input error={!!errors.supplierCode} placeholder="e.g. SUP-001" value={modal.supplierCode}
                    onChange={e => { setModal(prev => ({ ...prev!, supplierCode: e.target.value })); setErrors(prev => ({ ...prev, supplierCode: undefined })); }} />
                </Field>
                <Field label={t('field_currency')} required>
                  <Select value={modal.currency} onChange={e => setModal(prev => ({ ...prev!, currency: parseInt(e.target.value) }))}>
                    <option value={1}>RSD</option>
                    <option value={2}>EUR</option>
                    <option value={3}>USD</option>
                  </Select>
                </Field>
              </div>
              <Field label={t('field_contact')} error={errors.contactName} required>
                <Input error={!!errors.contactName} placeholder="e.g. Ana Petrović" value={modal.contactName}
                  onChange={e => { setModal(prev => ({ ...prev!, contactName: e.target.value })); setErrors(prev => ({ ...prev, contactName: undefined })); }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('email')} error={errors.contactEmail} required>
                  <Input error={!!errors.contactEmail} type="email" placeholder="contact@co.com" value={modal.contactEmail}
                    onChange={e => { setModal(prev => ({ ...prev!, contactEmail: e.target.value })); setErrors(prev => ({ ...prev, contactEmail: undefined })); }} />
                </Field>
                <Field label={t('phone')} optional>
                  <Input placeholder="+1..." value={modal.contactPhone} onChange={e => setModal(prev => ({ ...prev!, contactPhone: e.target.value }))} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label={t('field_address')} optional>
                  <Input placeholder="e.g. 123 Main St" value={modal.address} onChange={e => setModal(prev => ({ ...prev!, address: e.target.value }))} />
                </Field>
                <Field label={t('field_city')} optional>
                  <Input placeholder="e.g. Belgrade" value={modal.city} onChange={e => setModal(prev => ({ ...prev!, city: e.target.value }))} />
                </Field>
                <Field label={t('field_country')} optional>
                  <Input placeholder="e.g. Serbia" value={modal.country} onChange={e => setModal(prev => ({ ...prev!, country: e.target.value }))} />
                </Field>
              </div>
            </div>
            <ApiErrorBox errors={apiError} />
            <ModalActions>
              <BtnSecondary onClick={() => { setModal(null); setApiError([]); }}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={save} disabled={saving}>{t('save_supplier')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
