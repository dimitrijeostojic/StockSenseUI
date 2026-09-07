import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { useIsMobile } from '../hooks/useIsMobile';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ newPassword: '', confirmNewPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!email || !token) {
      setError('Invalid or expired reset link.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, token, newPassword: form.newPassword, confirmNewPassword: form.confirmNewPassword });
      setDone(true);
    } catch {
      setError('Reset failed. The link may have expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 20% 20%, #f3eefe 0%, #f6f5f9 45%, #f6f5f9 100%)',
      fontFamily: "'Manrope', system-ui, sans-serif",
    }}>
      <div style={{
        width: 420, maxWidth: '92vw', background: '#ffffff', border: '1px solid #e4e4e7',
        borderRadius: 20, boxShadow: '0 20px 50px -20px rgba(24,24,27,0.18)', padding: isMobile ? 24 : 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, border: '2px solid #ffffff' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>StockSense</div>
        </div>

        {done ? (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', marginBottom: 6 }}>Password reset</div>
            <div style={{ fontSize: 13.5, color: '#71717a', marginBottom: 26 }}>Your password has been updated. You can now sign in.</div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                height: 44, width: '100%', borderRadius: 10, border: 'none',
                background: '#6d28d9', color: '#ffffff',
                fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', marginBottom: 6 }}>Reset password</div>
            <div style={{ fontSize: 13.5, color: '#71717a', marginBottom: 26 }}>Enter your new password below</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'New password', key: 'newPassword', show: showPw, toggle: () => setShowPw(s => !s) },
                { label: 'Confirm new password', key: 'confirmNewPassword', show: showConfirmPw, toggle: () => setShowConfirmPw(s => !s) },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={f.show ? 'text' : 'password'} required placeholder="••••••••"
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ height: 42, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 42px 0 13px', fontSize: 14, fontFamily: 'inherit', color: '#18181b', background: '#fafafa', width: '100%' }}
                    />
                    <button type="button" onClick={f.toggle} tabIndex={-1}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: 2, display: 'flex', alignItems: 'center' }}>
                      <EyeIcon open={f.show} />
                    </button>
                  </div>
                </div>
              ))}

              {error && <div style={{ fontSize: 12.5, color: '#dc2626' }}>{error}</div>}

              <button
                type="submit" disabled={loading}
                style={{
                  height: 44, borderRadius: 10, border: 'none',
                  background: loading ? '#a1a1aa' : '#6d28d9', color: '#ffffff',
                  fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit',
                  cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
                }}
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </div>

            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 12.5, color: '#a1a1aa' }}>
              <button type="button" onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: 0, fontFamily: 'inherit' }}>
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
