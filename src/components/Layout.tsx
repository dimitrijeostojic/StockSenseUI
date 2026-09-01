import { type ReactNode, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';

const BASE_NAV_ITEMS = [
  {
    to: '/dashboard', label: 'Dashboard',
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
    to: '/products', label: 'Products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="4.5" width="15" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <line x1="1.5" y1="8.5" x2="16.5" y2="8.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: '/categories', label: 'Categories',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="2.5" width="15" height="3.4" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="1.5" y="7.3" width="11" height="3.4" rx="1.5" fill="currentColor" opacity="0.65" />
        <rect x="1.5" y="12.1" width="7" height="3.4" rx="1.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    to: '/suppliers', label: 'Suppliers',
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
    to: '/orders', label: 'Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="2.5" y="1.5" width="13" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="6" y="0.8" width="6" height="2.4" rx="1" fill="currentColor" />
        <polyline points="5.5,9.2 7.5,11.2 12,6.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const ADMIN_NAV_ITEM = {
  to: '/users', label: 'Users',
  icon: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5,15.5 C2.5,12 5.4,9.5 9,9.5 C12.6,9.5 15.5,12 15.5,15.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

export function Layout({ children }: { children: ReactNode }) {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navItems = useMemo(() => isAdmin ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS, [isAdmin]);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

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
        <div style={{ fontSize: 16.5, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>StockSense</div>
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
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 1, background: '#ececf0', margin: '6px 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#f3eefe',
            color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email ?? 'User'}
            </div>
            <div style={{ fontSize: 11.5, color: '#a1a1aa' }}>{user?.role ?? 'User'}</div>
          </div>
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
          Log out
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
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
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
      {action}
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
  const labels: Record<number, string> = { 1: 'Pending', 2: 'Confirmed', 3: 'Received', 4: 'Cancelled' };
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
  return (
    <div style={{ padding: '60px 22px', textAlign: 'center', color: '#a1a1aa', fontSize: 13.5 }}>
      Loading...
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
