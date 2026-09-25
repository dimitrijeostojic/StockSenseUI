import { type ReactNode, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type Lang } from '../contexts/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import type { TranslationKey } from '../locales/en';
import { changePassword } from '../api/auth';
import { getMyUser } from '../api/users';
import { getMyTenant, updateTenant } from '../api/tenant';
import type { TenantDto } from '../api/tenant';
import type { GetMyUserResponse } from '../types';
import { useToast } from '../contexts/ToastContext';
import { extractApiErrors } from '../api/client';
import { Modal, ModalTitle, ModalActions, Field, Input, PasswordInput, BtnPrimary, BtnSecondary, ApiErrorBox } from './Modal';

const BASE_NAV_ITEMS: { to: string; labelKey: TranslationKey; icon: ReactNode }[] = [
  {
    to: '/dashboard', labelKey: 'nav_dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.9" />
        <rect x="10" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
        <rect x="1" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
        <rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.9" />
      </svg>
    ),
  },
  {
    to: '/products', labelKey: 'nav_products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="4.5" width="15" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <line x1="1.5" y1="8.5" x2="16.5" y2="8.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: '/categories', labelKey: 'nav_categories',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="2.5" width="15" height="3.4" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="1.5" y="7.3" width="11" height="3.4" rx="1.5" fill="currentColor" opacity="0.65" />
        <rect x="1.5" y="12.1" width="7" height="3.4" rx="1.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    to: '/suppliers', labelKey: 'nav_suppliers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="1.5" width="15" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="4.5" y="4.5" width="3" height="3" rx="0.8" fill="currentColor" />
        <rect x="10.5" y="4.5" width="3" height="3" rx="0.8" fill="currentColor" />
        <rect x="4.5" y="10.5" width="3" height="3" rx="0.8" fill="currentColor" />
        <rect x="10.5" y="10.5" width="3" height="3" rx="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/orders', labelKey: 'nav_orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="2.5" y="1.5" width="13" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="6" y="0.8" width="6" height="2.4" rx="1" fill="currentColor" />
        <polyline points="5.5,9.2 7.5,11.2 12,6.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const ADMIN_NAV_ITEMS: { to: string; labelKey: TranslationKey; icon: ReactNode }[] = [
  {
    to: '/users', labelKey: 'nav_users',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5,15.5 C2.5,12 5.4,9.5 9,9.5 C12.6,9.5 15.5,12 15.5,15.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const { logout, user, isAdmin, updateUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const navItems = useMemo(() => isAdmin ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : BASE_NAV_ITEMS, [isAdmin]);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [myUser, setMyUser] = useState<GetMyUserResponse | null>(null);
  const [myUserLoading, setMyUserLoading] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwErrors, setPwErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmNewPassword?: string }>({});
  const [pwSaving, setPwSaving] = useState(false);
  const [companyModal, setCompanyModal] = useState(false);
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantForm, setTenantForm] = useState({ name: '', address: '' });
  const [tenantLogoFile, setTenantLogoFile] = useState<File | null>(null);
  const [tenantErrors, setTenantErrors] = useState<{ name?: string }>({});
  const [tenantApiErrors, setTenantApiErrors] = useState<string[]>([]);
  const [tenantSaving, setTenantSaving] = useState(false);

  const handleChangePassword = async () => {
    const errs: { currentPassword?: string; newPassword?: string; confirmNewPassword?: string } = {};
    if (!pwForm.currentPassword) errs.currentPassword = t('field_required');
    if (!pwForm.newPassword) errs.newPassword = t('field_required');
    else if (pwForm.newPassword.length < 6) errs.newPassword = t('password_min_length');
    if (!pwForm.confirmNewPassword) errs.confirmNewPassword = t('field_required');
    else if (pwForm.newPassword && pwForm.confirmNewPassword !== pwForm.newPassword) errs.confirmNewPassword = t('passwords_mismatch');
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwSaving(true);
    try {
      await changePassword(pwForm);
      showToast(t('password_changed'));
      setPwModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { description?: string } } })?.response?.data;
      const msg = data?.description || t('password_change_failed');
      setPwErrors({ currentPassword: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const openPwModal = () => {
    setProfileMenuOpen(false);
    setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setPwErrors({});
    setPwModal(true);
    if (isMobile) setSidebarOpen(false);
  };

  const openAccountModal = () => {
    setProfileMenuOpen(false);
    setMyUser(null);
    setAccountModal(true);
    setMyUserLoading(true);
    getMyUser().then(setMyUser).catch(() => {}).finally(() => setMyUserLoading(false));
    if (isMobile) setSidebarOpen(false);
  };

  const openCompanyModal = () => {
    setProfileMenuOpen(false);
    setTenant(null);
    setTenantErrors({});
    setTenantApiErrors([]);
    setTenantLogoFile(null);
    setCompanyModal(true);
    setTenantLoading(true);
    getMyTenant().then(ten => {
      setTenant(ten);
      setTenantForm({ name: ten.name, address: ten.address ?? '' });
    }).catch(() => {}).finally(() => setTenantLoading(false));
    if (isMobile) setSidebarOpen(false);
  };

  const saveTenant = async () => {
    if (!tenantForm.name.trim()) { setTenantErrors({ name: t('field_required') }); return; }
    setTenantErrors({});
    setTenantApiErrors([]);
    setTenantSaving(true);
    try {
      const updated = await updateTenant({ name: tenantForm.name, address: tenantForm.address || undefined, logo: tenantLogoFile });
      setTenant(updated);
      updateUser({ tenantName: updated.name });
      showToast(t('company_updated'));
      setCompanyModal(false);
    } catch (err) {
      const errs = extractApiErrors(err);
      if (errs.length) setTenantApiErrors(errs);
      else showToast(t('company_update_failed'));
    } finally {
      setTenantSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);
  const initials = user?.firstName && user?.lastName
    ? (user.firstName[0] + user.lastName[0]).toUpperCase()
    : user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  const langBtn = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      style={{
        height: 28, padding: '0 10px', borderRadius: 7,
        border: lang === l ? 'none' : '1px solid #e4e4e7',
        background: lang === l ? '#6d28d9' : '#ffffff',
        color: lang === l ? '#ffffff' : '#71717a',
        fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
      }}
    >{label}</button>
  );

  const sidebar = (
    <div style={{
      width: 236,
      flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #ececf0',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      ...(isMobile
        ? { position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 200, boxShadow: '4px 0 24px rgba(0,0,0,0.13)' }
        : { position: 'sticky', top: 0, height: '100vh' }),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 22px 8px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: '#6d28d9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid #ffffff' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>StockSense</div>
          {user?.tenantName && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6d28d9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.tenantName}
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={closeSidebar}
            style={{
              marginLeft: 'auto', width: 32, height: 32, borderRadius: 8,
              border: '1px solid #e4e4e7', background: '#fafafa', color: '#52525b',
              fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
            }}
          >✕</button>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            data-tour={`nav-${item.to.slice(1)}`}
            onClick={isMobile ? closeSidebar : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 11, height: 40,
              borderRadius: 10, border: 'none', fontFamily: "'Manrope', system-ui, sans-serif",
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer', padding: '0 12px',
              textDecoration: 'none', width: '100%',
              background: isActive ? '#f3eefe' : 'transparent',
              color: isActive ? '#6d28d9' : '#71717a',
            })}
          >
            {item.icon}
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 1, background: '#ececf0', margin: '6px 4px' }} />

        <div style={{ display: 'flex', gap: 6, padding: '0 8px' }}>
          {langBtn('en', 'EN')}
          {langBtn('sr', 'SR')}
        </div>

        <div style={{ position: 'relative' }}>
          {profileMenuOpen && (
            <>
              <div
                onClick={() => setProfileMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 299 }}
              />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#ffffff', border: '1px solid #ececf0', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 300,
                overflow: 'hidden', padding: 6,
              }}>
                <button
                  onClick={openAccountModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 12px', border: 'none', background: 'transparent',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: '#18181b', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 18 18" style={{ color: '#71717a', flexShrink: 0 }}>
                    <circle cx="9" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M2.5,15.5 C2.5,12 5.4,9.5 9,9.5 C12.6,9.5 15.5,12 15.5,15.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {t('account_info')}
                </button>
                <button
                  onClick={openPwModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 12px', border: 'none', background: 'transparent',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: '#18181b', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" style={{ color: '#71717a', flexShrink: 0 }}>
                    <rect x="3" y="7" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5,7 V5 a3,3 0 0,1 6,0 V7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {t('change_password')}
                </button>
                <button
                  onClick={openCompanyModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 12px', border: 'none', background: 'transparent',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: '#18181b', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 18 18" style={{ color: '#71717a', flexShrink: 0 }}>
                    <rect x="2" y="8" width="14" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5,8 V6 a4,4 0 0,1 8,0 V8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="11" x2="9" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {t('company_info')}
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setProfileMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 8,
              width: '100%', background: profileMenuOpen ? '#f4f4f5' : 'transparent', border: 'none',
              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => { if (!profileMenuOpen) e.currentTarget.style.background = '#fafafa'; }}
            onMouseLeave={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#f3eefe',
              color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email ?? 'User'}
              </div>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>{user?.role ?? 'User'}</div>
              {user?.tenantName && (
                <div style={{ fontSize: 10.5, color: '#6d28d9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.tenantName}
                </div>
              )}
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, color: '#a1a1aa', transform: profileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              <polyline points="1,4 6,9 11,4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, height: 38, borderRadius: 9,
            border: 'none', background: 'transparent', color: '#a1a1aa',
            fontSize: 13.5, fontWeight: 600, fontFamily: "'Manrope', system-ui, sans-serif",
            cursor: 'pointer', padding: '0 10px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18">
            <rect x="2" y="2" width="8" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="9" x2="16.5" y2="9" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="13.5,6 16.5,9 13.5,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('nav_logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f6f5f9' }}>
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
        />
      )}

      {(!isMobile || sidebarOpen) && sidebar}

      <div style={{ flex: 1, minWidth: 0 }}>
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 16px', height: 56,
            background: '#ffffff', borderBottom: '1px solid #ececf0',
            position: 'sticky', top: 0, zIndex: 100,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: '1px solid #e4e4e7', background: '#ffffff', color: '#52525b',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0,
              }}
            >
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 15, height: 2, background: '#52525b', borderRadius: 2 }} />
              ))}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, background: '#6d28d9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, border: '2px solid #ffffff' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>StockSense</div>
            </div>
          </div>
        )}
        <div style={{ padding: isMobile ? '20px 16px 60px 16px' : '28px 36px 60px 36px' }}>
          {children}
        </div>
      </div>

      <Modal open={accountModal} onClose={() => setAccountModal(false)} width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#f3eefe',
            color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, marginBottom: 12,
          }}>
            {initials}
          </div>
          <ModalTitle>{t('account_info')}</ModalTitle>
          {myUser && (
            <div style={{ fontSize: 14, fontWeight: 700, color: '#18181b', marginTop: 2 }}>
              {myUser.firstName} {myUser.lastName}
            </div>
          )}
        </div>
        {myUserLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#a1a1aa', fontSize: 13 }}>{t('loading')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fafafa', borderRadius: 10, border: '1px solid #ececf0', overflow: 'hidden' }}>
            {[
              ...(myUser?.username ? [{ label: t('profile_username'), value: myUser.username }] : []),
              { label: t('email'), value: myUser?.email ?? user?.email ?? '—' },
              { label: t('profile_role'), value: myUser?.roles.join(', ') ?? user?.role ?? '—' },
              ...(user?.tenantName ? [{ label: t('profile_company'), value: user.tenantName }] : []),
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #ececf0' : 'none',
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#71717a' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#18181b' }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
        <ModalActions>
          <BtnSecondary onClick={() => setAccountModal(false)}>{t('close')}</BtnSecondary>
          <BtnPrimary onClick={() => { setAccountModal(false); openPwModal(); }}>{t('change_password')}</BtnPrimary>
        </ModalActions>
      </Modal>

      <Modal open={companyModal} onClose={() => setCompanyModal(false)} width={440}>
        <ModalTitle>{t('company_info')}</ModalTitle>
        {tenantLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#a1a1aa', fontSize: 13 }}>{t('loading')}</div>
        ) : isAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fafafa', borderRadius: 10, border: '1px solid #ececf0', overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#71717a' }}>{t('tax_id')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#18181b' }}>{tenant?.pib ?? '—'}</span>
              </div>
            </div>
            <Field label={t('company_name')} error={tenantErrors.name} required>
              <Input error={!!tenantErrors.name} placeholder="e.g. Acme Corp" value={tenantForm.name}
                onChange={e => { setTenantForm(f => ({ ...f, name: e.target.value })); setTenantErrors({}); }} />
            </Field>
            <Field label={t('address')} optional>
              <Input placeholder="e.g. 123 Main St" value={tenantForm.address}
                onChange={e => setTenantForm(f => ({ ...f, address: e.target.value }))} />
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Logo</span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#a1a1aa', background: '#f4f4f5', borderRadius: 4, padding: '1px 5px' }}>{t('saving') === t('saving') ? 'optional' : 'optional'}</span>
              </div>
              {tenant?.logo && !tenantLogoFile && (
                <img src={`data:image/png;base64,${tenant.logo}`} alt="logo" style={{ height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #ececf0', background: '#fafafa', padding: 4 }} />
              )}
              {tenantLogoFile && (
                <img src={URL.createObjectURL(tenantLogoFile)} alt="preview" style={{ height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #ececf0', background: '#fafafa', padding: 4 }} />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: tenantLogoFile ? '#18181b' : '#a1a1aa', cursor: 'pointer', overflow: 'hidden' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setTenantLogoFile(e.target.files?.[0] ?? null)} />
                {tenantLogoFile ? tenantLogoFile.name : 'Choose image…'}
              </label>
            </div>
            <ApiErrorBox errors={tenantApiErrors} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fafafa', borderRadius: 10, border: '1px solid #ececf0', overflow: 'hidden', marginTop: 16 }}>
            {[
              { label: t('company_name'), value: tenant?.name ?? '—' },
              { label: t('tax_id'), value: tenant?.pib ?? '—' },
              { label: t('address'), value: tenant?.address ?? '—' },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #ececf0' : 'none' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#71717a' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#18181b' }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
        <ModalActions>
          <BtnSecondary onClick={() => setCompanyModal(false)}>{t(isAdmin ? 'cancel' : 'close')}</BtnSecondary>
          {isAdmin && <BtnPrimary onClick={saveTenant} disabled={tenantSaving}>{tenantSaving ? t('saving') : t('save')}</BtnPrimary>}
        </ModalActions>
      </Modal>

      <Modal open={pwModal} onClose={() => { setPwModal(false); setPwErrors({}); }} width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: '#f3eefe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <svg width="22" height="22" viewBox="0 0 16 16" style={{ color: '#6d28d9' }}>
              <rect x="3" y="7" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5,7 V5 a3,3 0 0,1 6,0 V7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <ModalTitle>{t('change_password')}</ModalTitle>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('current_password')} error={pwErrors.currentPassword}>
            <PasswordInput
              error={!!pwErrors.currentPassword} placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={e => { setPwForm(f => ({ ...f, currentPassword: e.target.value })); setPwErrors(prev => ({ ...prev, currentPassword: undefined })); }}
            />
          </Field>
          <Field label={t('new_password')} error={pwErrors.newPassword}>
            <PasswordInput
              error={!!pwErrors.newPassword} placeholder="••••••••"
              value={pwForm.newPassword}
              onChange={e => { setPwForm(f => ({ ...f, newPassword: e.target.value })); setPwErrors(prev => ({ ...prev, newPassword: undefined })); }}
            />
          </Field>
          <Field label={t('confirm_new_password')} error={pwErrors.confirmNewPassword}>
            <PasswordInput
              error={!!pwErrors.confirmNewPassword} placeholder="••••••••"
              value={pwForm.confirmNewPassword}
              onChange={e => { setPwForm(f => ({ ...f, confirmNewPassword: e.target.value })); setPwErrors(prev => ({ ...prev, confirmNewPassword: undefined })); }}
            />
          </Field>
        </div>
        <ModalActions>
          <BtnSecondary onClick={() => { setPwModal(false); setPwErrors({}); }}>{t('cancel')}</BtnSecondary>
          <BtnPrimary onClick={handleChangePassword} disabled={pwSaving}>
            {pwSaving ? t('saving') : t('change_password')}
          </BtnPrimary>
        </ModalActions>
      </Modal>
    </div>
  );
}

export function PageHeader({ title, subtitle, action, onTourStart }: { title: string; subtitle?: string; action?: ReactNode; onTourStart?: () => void }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
      gap: 10,
    }}>
      <div>
        <div style={{ fontSize: 23, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: '#71717a', marginTop: 3 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {action}
        {onTourStart && (
          <button
            onClick={onTourStart}
            aria-label="Start page tour"
            style={{
              width: 34, height: 34, borderRadius: '50%', border: '2px solid #6d28d9',
              background: '#ffffff', color: '#6d28d9', fontSize: 16, fontWeight: 800,
              fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, lineHeight: 1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.color = '#6d28d9'; }}
          >
            ?
          </button>
        )}
      </div>
    </div>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40, padding: '0 18px', borderRadius: 10, border: 'none',
        background: '#6d28d9', color: '#ffffff', fontSize: 13.5, fontWeight: 700,
        fontFamily: "'Manrope', system-ui, sans-serif", cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5b21b6'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
    >
      {label}
    </button>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, overflowX: 'auto' }}>
      {children}
    </div>
  );
}

export function TableHeader({ columns }: { columns: Array<{ label: string; style?: React.CSSProperties }> }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: columns.map(() => '1fr').join(' '),
      padding: '12px 22px', borderBottom: '1px solid #ececf0',
      background: '#fafafa', gap: 12,
    }}>
      {columns.map((col, i) => (
        <div key={i} style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em', ...col.style }}>
          {col.label}
        </div>
      ))}
    </div>
  );
}

export function ActionBtn({ children, onClick, variant = 'default', disabled }: {
  children: ReactNode; onClick?: () => void; variant?: 'default' | 'danger' | 'blue' | 'green'; disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { border: '1px solid #e4e4e7', background: '#ffffff', color: '#3f3f46' },
    danger: { border: '1px solid #fbdada', background: '#fff5f5', color: '#dc2626' },
    blue: { border: '1px solid #cfe2fd', background: '#eaf1fe', color: '#2563eb' },
    green: { border: '1px solid #bfe8cd', background: '#eafaf0', color: '#16a34a' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 30, padding: '0 11px', borderRadius: 8,
        fontSize: 12, fontWeight: 700, fontFamily: "'Manrope', system-ui, sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ statusNum }: { statusNum: number }) {
  const { t } = useLanguage();
  const labels: Record<number, string> = {
    1: t('status_pending'),
    2: t('status_confirmed'),
    3: t('status_received'),
    4: t('status_cancelled'),
  };
  const colors: Record<number, { bg: string; color: string }> = {
    1: { bg: '#fef3e2', color: '#d97706' },
    2: { bg: '#eaf1fe', color: '#2563eb' },
    3: { bg: '#eafaf0', color: '#16a34a' },
    4: { bg: '#fef2f2', color: '#dc2626' },
  };
  const c = colors[statusNum] ?? { bg: '#f4f4f5', color: '#71717a' };
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 700, padding: '5px 11px',
      borderRadius: 100, background: c.bg, color: c.color,
    }}>
      {labels[statusNum] ?? statusNum}
    </span>
  );
}

export function LoadingState() {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '60px 22px', textAlign: 'center', color: '#a1a1aa', fontSize: 13.5 }}>
      {t('loading')}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '50px 22px', textAlign: 'center', color: '#a1a1aa', fontSize: 13.5 }}>
      {message}
    </div>
  );
}

interface PaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ pageNumber, pageSize, totalCount, totalPages, onPageChange, onPageSizeChange }: PaginationProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const from = (pageNumber - 1) * pageSize + 1;
  const to = Math.min(pageNumber * pageSize, totalCount);

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    height: isMobile ? 36 : 32,
    width: isMobile ? 36 : 'auto',
    padding: isMobile ? 0 : '0 12px',
    borderRadius: 8,
    border: '1px solid #e4e4e7',
    background: '#ffffff',
    color: disabled ? '#a1a1aa' : '#3f3f46',
    fontSize: isMobile ? 16 : 12.5,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const sizeSelect = (
    <select
      value={pageSize}
      onChange={e => onPageSizeChange(Number(e.target.value))}
      style={{
        height: isMobile ? 32 : 32,
        borderRadius: 8,
        border: '1px solid #e4e4e7',
        padding: '0 10px',
        fontSize: 12.5,
        fontFamily: 'inherit',
        background: '#ffffff',
        color: '#3f3f46',
      }}
    >
      {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n} {t('per_page')}</option>)}
    </select>
  );

  if (isMobile) {
    return (
      <div style={{ borderTop: '1px solid #ececf0', background: '#fafafa', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)} style={btnStyle(pageNumber <= 1)}>‹</button>
          <span style={{ fontSize: 13, color: '#52525b', fontWeight: 600 }}>
            {t('page')} {pageNumber} {t('of')} {totalPages}
          </span>
          <button disabled={pageNumber >= totalPages} onClick={() => onPageChange(pageNumber + 1)} style={btnStyle(pageNumber >= totalPages)}>›</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#a1a1aa' }}>{from}–{to} {t('of')} {totalCount}</span>
          {sizeSelect}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderTop: '1px solid #ececf0', background: '#fafafa' }}>
      <div style={{ fontSize: 13, color: '#71717a' }}>{from}–{to} {t('of')} {totalCount}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {sizeSelect}
        <button disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)} style={btnStyle(pageNumber <= 1)}>{t('prev')}</button>
        <span style={{ fontSize: 13, color: '#52525b', minWidth: 90, textAlign: 'center' }}>{t('page')} {pageNumber} {t('of')} {totalPages}</span>
        <button disabled={pageNumber >= totalPages} onClick={() => onPageChange(pageNumber + 1)} style={btnStyle(pageNumber >= totalPages)}>{t('next')}</button>
      </div>
    </div>
  );
}
