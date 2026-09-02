import { useEffect, useState, useCallback } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers';
import type { SupplierDto } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, AddButton, TableCard, ActionBtn, LoadingState, EmptyState, Pagination } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, BtnPrimary, BtnSecondary, ConfirmModal } from '../components/Modal';
import { useIsMobile } from '../hooks/useIsMobile';

interface SupplierModalState {
  open: boolean;
  mode: 'add' | 'edit';
  publicId?: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
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
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<SupplierModalState | null>(null);
  const [errors, setErrors] = useState<{ name?: string; contactEmail?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [query, setQuery] = useState<Query>({ pageNumber: 1, pageSize: 10, search: '', sortBy: 'name', isAscending: true });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q => ({ ...q, search: searchInput, pageNumber: 1 })), 400);
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

  const openAdd = () => { setErrors({}); setModal({ open: true, mode: 'add', name: '', contactName: '', contactEmail: '', contactPhone: '' }); };
  const openEdit = (s: SupplierDto) => { setErrors({}); setModal({ open: true, mode: 'edit', publicId: s.publicId, name: s.name, contactName: s.contactName ?? '', contactEmail: s.contactEmail ?? '', contactPhone: s.contactPhone ?? '' }); };

  const save = async () => {
    if (!modal) return;
    const errs: { name?: string; contactEmail?: string } = {};
    if (!modal.name.trim()) errs.name = t('field_required');
    if (modal.contactEmail && !emailRe.test(modal.contactEmail)) errs.contactEmail = t('email_invalid');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const body = { name: modal.name, contactName: modal.contactName || undefined, contactEmail: modal.contactEmail || undefined, contactPhone: modal.contactPhone || undefined };
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
    } catch {
      showToast(t('supplier_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteSupplier(publicId);
      showToast(t('supplier_deleted'));
      await load();
    } catch {
      showToast(t('supplier_delete_failed'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const isMobile = useIsMobile();
  const GRID = '1.6fr 1.4fr 1.6fr 1.2fr 1fr';

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
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 580 : undefined }}>
          {sortBtn(t('supplier'), 'name')}
          {sortBtn(t('col_contact'), 'contactName')}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('email')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('phone')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>{t('actions')}</div>
        </div>

        {loading && <LoadingState />}
        {!loading && suppliers.length === 0 && (
          <EmptyState message={query.search ? t('no_suppliers_filtered') : t('no_suppliers')} />
        )}

        {suppliers.map(s => (
          <div key={s.publicId} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 580 : undefined }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{s.name}</div>
            <div style={{ fontSize: 13, color: '#52525b' }}>{s.contactName || '—'}</div>
            <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contactEmail || '—'}</div>
            <div style={{ fontSize: 13, color: '#52525b' }}>{s.contactPhone || '—'}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
        onClose={() => setConfirmId(null)}
        onConfirm={() => { handleDelete(confirmId!); setConfirmId(null); }}
        title={t('delete_supplier')}
        message={t('cannot_undo')}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} width={440}>
        {modal && (
          <>
            <ModalTitle>{modal.mode === 'add' ? t('add_supplier_title') : t('edit_supplier_title')}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('field_company')} error={errors.name}>
                <Input error={!!errors.name} placeholder="e.g. NovaSupply" value={modal.name}
                  onChange={e => { setModal(prev => ({ ...prev!, name: e.target.value })); setErrors(prev => ({ ...prev, name: undefined })); }} />
              </Field>
              <Field label={t('field_contact')}>
                <Input placeholder="e.g. Ana Petrović" value={modal.contactName} onChange={e => setModal(prev => ({ ...prev!, contactName: e.target.value }))} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t('email')} error={errors.contactEmail}>
                  <Input error={!!errors.contactEmail} type="email" placeholder="contact@co.com" value={modal.contactEmail}
                    onChange={e => { setModal(prev => ({ ...prev!, contactEmail: e.target.value })); setErrors(prev => ({ ...prev, contactEmail: undefined })); }} />
                </Field>
                <Field label={t('phone')}>
                  <Input placeholder="+1..." value={modal.contactPhone} onChange={e => setModal(prev => ({ ...prev!, contactPhone: e.target.value }))} />
                </Field>
              </div>
            </div>
            <ModalActions>
              <BtnSecondary onClick={() => setModal(null)}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={save} disabled={saving}>{t('save_supplier')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
