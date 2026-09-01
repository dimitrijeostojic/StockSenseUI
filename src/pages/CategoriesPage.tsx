import { useEffect, useState, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { getProducts } from '../api/products';
import type { CategoryDto, ProductDto } from '../types';
import { useToast } from '../contexts/ToastContext';
import { PageHeader, AddButton, LoadingState } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, BtnPrimary, BtnSecondary, ConfirmModal } from '../components/Modal';

interface CategoryModalState {
  open: boolean;
  mode: 'add' | 'edit';
  publicId?: string;
  name: string;
  description: string;
}

export function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<CategoryModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
    setCategories(cats);
    setProducts(prods.items);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const productCount = (catId: string) => products.filter(p => p.categoryPublicId === catId).length;

  const openAdd = () => setModal({ open: true, mode: 'add', name: '', description: '' });
  const openEdit = (c: CategoryDto) => setModal({ open: true, mode: 'edit', publicId: c.publicId, name: c.name, description: c.description ?? '' });

  const save = async () => {
    if (!modal) return;
    if (!modal.name.trim()) { showToast('Category name is required'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await createCategory({ name: modal.name, description: modal.description || undefined });
        showToast('Category added');
      } else {
        await updateCategory(modal.publicId!, { name: modal.name, description: modal.description || undefined });
        showToast('Category updated');
      }
      setModal(null);
      await load();
    } catch {
      showToast('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteCategory(publicId);
      showToast('Category deleted');
      await load();
    } catch {
      showToast('Failed to delete category');
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Group products for reporting and filtering"
        action={<AddButton onClick={openAdd} label="+ Add category" />}
      />

      {loading && <LoadingState />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {categories.map(c => (
          <div key={c.publicId} style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#18181b' }}>{c.name}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: '#f3eefe', color: '#6d28d9', flexShrink: 0, marginLeft: 8 }}>
                {productCount(c.publicId)} items
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#71717a', marginTop: 8, minHeight: 36 }}>{c.description || '—'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => openEdit(c)}
                style={{ height: 32, flex: 1, borderRadius: 8, border: '1px solid #e4e4e7', background: '#ffffff', color: '#3f3f46', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Edit
              </button>
              <button onClick={() => setConfirmId(c.publicId)}
                style={{ height: 32, flex: 1, borderRadius: 8, border: '1px solid #fbdada', background: '#fff5f5', color: '#dc2626', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && categories.length === 0 && (
        <div style={{ textAlign: 'center', color: '#a1a1aa', fontSize: 13.5, paddingTop: 60 }}>No categories yet.</div>
      )}

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { handleDelete(confirmId!); setConfirmId(null); }}
        title="Delete category"
        message="This action cannot be undone."
      />

      <Modal open={!!modal} onClose={() => setModal(null)} width={400}>
        {modal && (
          <>
            <ModalTitle>{modal.mode === 'add' ? 'Add category' : 'Edit category'}</ModalTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Name">
                <Input placeholder="e.g. Audio" value={modal.name} onChange={e => setModal(prev => ({ ...prev!, name: e.target.value }))} />
              </Field>
              <Field label="Description">
                <Input placeholder="Optional description" value={modal.description} onChange={e => setModal(prev => ({ ...prev!, description: e.target.value }))} />
              </Field>
            </div>
            <ModalActions>
              <BtnSecondary onClick={() => setModal(null)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={save} disabled={saving}>Save category</BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
