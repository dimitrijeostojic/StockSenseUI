import { useEffect, useState, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { getProducts } from '../api/products';
import type { CategoryDto, ProductDto } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, AddButton, LoadingState } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, BtnPrimary, BtnSecondary, ConfirmModal } from '../components/Modal';
import { useIsMobile } from '../hooks/useIsMobile';

interface CategoryModalState {
  open: boolean;
  mode: 'add' | 'edit';
  publicId?: string;
  name: string;
  description: string;
}

export function CategoriesPage() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<CategoryModalState | null>(null);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
    setCategories(cats);
    setProducts(prods.items);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const productCount = (catId: string) => products.filter(p => p.categoryPublicId === catId).length;

  const openAdd = () => { setErrors({}); setModal({ open: true, mode: 'add', name: '', description: '' }); };
  const openEdit = (c: CategoryDto) => { setErrors({}); setModal({ open: true, mode: 'edit', publicId: c.publicId, name: c.name, description: c.description ?? '' }); };

  const save = async () => {
    if (!modal) return;
    const errs: { name?: string } = {};
    if (!modal.name.trim()) errs.name = t('field_required');
    if (errs.name) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await createCategory({ name: modal.name, description: modal.description || undefined });
        showToast(t('category_added'));
      } else {
        await updateCategory(modal.publicId!, { name: modal.name, description: modal.description || undefined });
        showToast(t('category_updated'));
      }
      setModal(null);
      await load();
    } catch {
      showToast(t('category_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteCategory(publicId);
      showToast(t('category_deleted'));
      await load();
    } catch {
      showToast(t('category_delete_failed'));
    }
  };

  return (
    <>
      <PageHeader
        title={t('nav_categories')}
        subtitle={t('categories_subtitle')}
        action={<AddButton onClick={openAdd} label={t('add_category')} />}
      />

      {loading && <LoadingState />}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1,1fr)' : 'repeat(3,1fr)', gap: 16 }}>
        {categories.map(c => (
          <div key={c.publicId} style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#18181b' }}>{c.name}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: '#f3eefe', color: '#6d28d9', flexShrink: 0, marginLeft: 8 }}>
                {productCount(c.publicId)} {t('items_suffix')}
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#71717a', marginTop: 8, minHeight: 36 }}>{c.description || '—'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => openEdit(c)}
                style={{ height: 32, flex: 1, borderRadius: 8, border: '1px solid #e4e4e7', background: '#ffffff', color: '#3f3f46', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                {t('edit')}
              </button>
              <button onClick={() => setConfirmId(c.publicId)}
                style={{ height: 32, flex: 1, borderRadius: 8, border: '1px solid #fbdada', background: '#fff5f5', color: '#dc2626', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                {t('delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && categories.length === 0 && (
        <div style={{ textAlign: 'center', color: '#a1a1aa', fontSize: 13.5, paddingTop: 60 }}>{t('no_categories')}</div>
      )}

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { handleDelete(confirmId!); setConfirmId(null); }}
        title={t('delete_category')}
        message={t('cannot_undo')}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} width={400}>
        {modal && (
          <>
            <ModalTitle>{modal.mode === 'add' ? t('add_category_title') : t('edit_category_title')}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('name')} error={errors.name}>
                <Input error={!!errors.name} placeholder="e.g. Audio" value={modal.name}
                  onChange={e => { setModal(prev => ({ ...prev!, name: e.target.value })); setErrors(prev => ({ ...prev, name: undefined })); }} />
              </Field>
              <Field label={t('description')}>
                <Input placeholder="Optional description" value={modal.description} onChange={e => setModal(prev => ({ ...prev!, description: e.target.value }))} />
              </Field>
            </div>
            <ModalActions>
              <BtnSecondary onClick={() => setModal(null)}>{t('cancel')}</BtnSecondary>
              <BtnPrimary onClick={save} disabled={saving}>{t('save_category')}</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
