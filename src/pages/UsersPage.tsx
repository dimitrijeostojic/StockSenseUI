import { useEffect, useState, useCallback } from 'react';
import { getUsers, deleteUser, registerUser } from '../api/users';
import type { UserDto, AdminRegisterUserRequest } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, TableCard, ActionBtn, LoadingState, EmptyState, AddButton } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, PasswordInput, BtnPrimary, BtnSecondary, ConfirmModal, ApiErrorBox } from '../components/Modal';
import { extractApiErrors } from '../api/client';
import { useIsMobile } from '../hooks/useIsMobile';

function RoleBadge({ roles }: { roles: string[] }) {
  const { t } = useLanguage();
  const isAdmin = roles.includes('Admin');
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 100,
      background: isAdmin ? '#f3eefe' : '#f4f4f5',
      color: isAdmin ? '#6d28d9' : '#71717a',
    }}>
      {isAdmin ? t('role_admin') : t('role_user')}
    </span>
  );
}

const EMPTY_FORM: AdminRegisterUserRequest = { firstName: '', lastName: '', username: '', email: '', password: '' };

export function UsersPage() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AdminRegisterUserRequest>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof AdminRegisterUserRequest, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string[]>([]);

  const load = useCallback(async () => {
    const data = await getUsers();
    setUsers(data);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const handleDelete = async (user: UserDto) => {
    setDeleting(user.userPublicId);
    try {
      await deleteUser(user.userPublicId);
      showToast(t('user_deleted'));
      await load();
    } catch {
      showToast(t('user_delete_failed'));
    } finally {
      setDeleting(null);
    }
  };

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRegister = async () => {
    const errs: Partial<Record<keyof AdminRegisterUserRequest, string>> = {};
    if (!form.firstName.trim()) errs.firstName = t('field_required');
    if (!form.lastName.trim()) errs.lastName = t('field_required');
    if (!form.username.trim()) errs.username = t('field_required');
    if (!form.email.trim()) errs.email = t('field_required');
    else if (!emailRe.test(form.email)) errs.email = t('email_invalid');
    if (!form.password) errs.password = t('field_required');
    else if (form.password.length < 6) errs.password = t('password_min_length');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await registerUser(form);
      showToast(t('user_registered'));
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      const errs = extractApiErrors(err);
      if (errs.length) setApiError(errs);
      else showToast(t('user_register_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: keyof AdminRegisterUserRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const GRID = '1.4fr 1.2fr 1.8fr 0.7fr 0.6fr';
  const isMobile = useIsMobile();

  return (
    <>
      <ConfirmModal
        open={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={() => { if (confirmUser) handleDelete(confirmUser); setConfirmUser(null); }}
        title={t('delete_user')}
        message={confirmUser ? `Delete ${confirmUser.firstName} ${confirmUser.lastName} (${confirmUser.email})?` : undefined}
        loading={deleting === confirmUser?.userPublicId}
      />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); setErrors({}); setApiError([]); }}>
        <ModalTitle>{t('register_new_user')}</ModalTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('field_first_name')} error={errors.firstName} required>
              <Input error={!!errors.firstName} value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
            </Field>
            <Field label={t('field_last_name')} error={errors.lastName} required>
              <Input error={!!errors.lastName} value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
            </Field>
          </div>
          <Field label={t('field_username')} error={errors.username} required>
            <Input error={!!errors.username} value={form.username} onChange={set('username')} placeholder="janedoe" />
          </Field>
          <Field label={t('email')} error={errors.email} required>
            <Input error={!!errors.email} type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
          </Field>
          <Field label={t('field_password')} error={errors.password} required>
            <PasswordInput error={!!errors.password} value={form.password} onChange={set('password')} placeholder="••••••••" />
          </Field>
        </div>
        <ApiErrorBox errors={apiError} />
        <ModalActions>
          <BtnSecondary onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); setErrors({}); setApiError([]); }}>{t('cancel')}</BtnSecondary>
          <BtnPrimary onClick={handleRegister} disabled={submitting}>
            {submitting ? t('registering') : t('register_user')}
          </BtnPrimary>
        </ModalActions>
      </Modal>

      <PageHeader
        title={t('nav_users')}
        subtitle={t('users_subtitle')}
        action={<AddButton onClick={() => { setErrors({}); setApiError([]); setForm(EMPTY_FORM); setModalOpen(true); }} label={t('register_user_btn')} />}
      />

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 560 : undefined }}>
          {[t('name'), t('field_username'), t('email'), t('col_role'), t('actions')].map((h, i) => (
            <div key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading && <LoadingState />}
        {!loading && users.length === 0 && <EmptyState message={t('no_users')} />}

        {users.map(u => {
          const isAdmin = u.roles.includes('Admin');
          return (
            <div key={u.userPublicId} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderBottom: '1px solid #f5f4f7', alignItems: 'center', minWidth: isMobile ? 560 : undefined }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181b' }}>{u.firstName} {u.lastName}</div>
              <div style={{ fontSize: 13, color: '#52525b' }}>{u.username}</div>
              <div style={{ fontSize: 13, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              <div><RoleBadge roles={u.roles} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!isAdmin && (
                  <ActionBtn
                    variant="danger"
                    onClick={() => setConfirmUser(u)}
                    disabled={deleting === u.userPublicId}
                  >
                    {deleting === u.userPublicId ? '...' : t('delete')}
                  </ActionBtn>
                )}
              </div>
            </div>
          );
        })}
      </TableCard>
    </>
  );
}
