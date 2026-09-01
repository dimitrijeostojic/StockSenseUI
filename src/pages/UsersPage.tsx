import { useEffect, useState, useCallback } from 'react';
import { getUsers, deleteUser, registerUser } from '../api/users';
import type { UserDto, AdminRegisterUserRequest } from '../types';
import { useToast } from '../contexts/ToastContext';
import { PageHeader, TableCard, ActionBtn, LoadingState, EmptyState, AddButton } from '../components/Layout';
import { Modal, ModalTitle, ModalActions, Field, Input, BtnPrimary, BtnSecondary, ConfirmModal } from '../components/Modal';
import { useIsMobile } from '../hooks/useIsMobile';

function RoleBadge({ roles }: { roles: string[] }) {
  const isAdmin = roles.includes('Admin');
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 100,
      background: isAdmin ? '#f3eefe' : '#f4f4f5',
      color: isAdmin ? '#6d28d9' : '#71717a',
    }}>
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
}

const EMPTY_FORM: AdminRegisterUserRequest = { firstName: '', lastName: '', username: '', email: '', password: '' };

export function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AdminRegisterUserRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await getUsers();
    setUsers(data);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const handleDelete = async (user: UserDto) => {
    setDeleting(user.userPublicId);
    try {
      await deleteUser(user.userPublicId);
      showToast('User deleted');
      await load();
    } catch {
      showToast('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.username || !form.email || !form.password) {
      showToast('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await registerUser(form);
      showToast('User registered');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      showToast('Failed to register user');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: keyof AdminRegisterUserRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const COLS = ['Name', 'Username', 'Email', 'Role', 'Actions'];
  const GRID = '1.4fr 1.2fr 1.8fr 0.7fr 0.6fr';
  const isMobile = useIsMobile();

  return (
    <>
      <ConfirmModal
        open={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={() => { if (confirmUser) handleDelete(confirmUser); setConfirmUser(null); }}
        title="Delete user"
        message={confirmUser ? `Delete ${confirmUser.firstName} ${confirmUser.lastName} (${confirmUser.email})?` : undefined}
        loading={deleting === confirmUser?.userPublicId}
      />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); }}>
        <ModalTitle>Register New User</ModalTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="First Name">
              <Input value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
            </Field>
            <Field label="Last Name">
              <Input value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
            </Field>
          </div>
          <Field label="Username">
            <Input value={form.username} onChange={set('username')} placeholder="janedoe" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
          </Field>
          <Field label="Password">
            <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </Field>
        </div>
        <ModalActions>
          <BtnSecondary onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleRegister} disabled={submitting}>
            {submitting ? 'Registering...' : 'Register User'}
          </BtnPrimary>
        </ModalActions>
      </Modal>

      <PageHeader
        title="Users"
        subtitle="Manage users in your tenant"
        action={<AddButton onClick={() => setModalOpen(true)} label="+ Register User" />}
      />

      <TableCard>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 22px', borderBottom: '1px solid #ececf0', background: '#fafafa', minWidth: isMobile ? 560 : undefined }}>
          {COLS.map((h, i) => (
            <div key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading && <LoadingState />}
        {!loading && users.length === 0 && <EmptyState message="No users found." />}

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
                    {deleting === u.userPublicId ? '...' : 'Delete'}
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
