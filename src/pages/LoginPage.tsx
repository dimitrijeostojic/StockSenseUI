import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const [showPw, setShowPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '',
    companyName: '', pib: '', address: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: loginForm.email, password: loginForm.password });
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...regForm, logo: logoFile });
      setMode('login');
      setLoginForm(prev => ({ ...prev, email: regForm.email }));
    } catch {
      setError('Registration failed. Check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

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

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome back</div>
            <div style={{ fontSize: 13.5, color: '#71717a', marginBottom: 26 }}>Sign in to manage your inventory</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Email</label>
                <input
                  type="email" required placeholder="you@company.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  style={{ height: 42, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 13px', fontSize: 14, fontFamily: 'inherit', color: '#18181b', background: '#fafafa', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: '#6d28d9', textDecoration: 'none', fontWeight: 600 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} required placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 42px 0 13px', fontSize: 14, fontFamily: 'inherit', color: '#18181b', background: '#fafafa', width: '100%' }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: 2, display: 'flex', alignItems: 'center' }}>
                    {showPw ? (
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
                    )}
                  </button>
                </div>
              </div>

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
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>

            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 12.5, color: '#a1a1aa' }}>
              No account?{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: 0, fontFamily: 'inherit' }}>
                Register your company
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', marginBottom: 6 }}>Create account</div>
            <div style={{ fontSize: 13.5, color: '#71717a', marginBottom: 22 }}>Register your company to get started</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'First name', key: 'firstName', placeholder: 'John' },
                  { label: 'Last name', key: 'lastName', placeholder: 'Doe' },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>{f.label}</label>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>*</span>
                    </div>
                    <input required placeholder={f.placeholder} value={regForm[f.key as keyof typeof regForm]}
                      onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: '#18181b', width: '100%' }} />
                  </div>
                ))}
              </div>
              {[
                { label: 'Username', key: 'username', placeholder: 'johndoe', type: 'text' },
                { label: 'Email', key: 'email', placeholder: 'you@company.com', type: 'email' },
                { label: 'Company name', key: 'companyName', placeholder: 'Acme Inc.', type: 'text', required: true },
                { label: 'Tax ID (PIB)', key: 'pib', placeholder: '123456789', type: 'text', required: true },
                { label: 'Address', key: 'address', placeholder: '123 Main St', type: 'text', required: false },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>{f.label}</label>
                    {f.required
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>*</span>
                      : <span style={{ fontSize: 10.5, fontWeight: 600, color: '#a1a1aa', background: '#f4f4f5', borderRadius: 4, padding: '1px 5px' }}>optional</span>
                    }
                  </div>
                  <input required={f.required} type={f.type} placeholder={f.placeholder}
                    value={regForm[f.key as keyof typeof regForm]}
                    onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: '#18181b', width: '100%' }} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Logo</label>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#a1a1aa', background: '#f4f4f5', borderRadius: 4, padding: '1px 5px' }}>optional</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: logoFile ? '#18181b' : '#a1a1aa', cursor: 'pointer', overflow: 'hidden' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
                  {logoFile ? logoFile.name : 'Choose image…'}
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Password</label>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>*</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input required type={showRegPw ? 'text' : 'password'} placeholder="••••••••"
                    value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    style={{ height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 42px 0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: '#18181b', width: '100%' }} />
                  <button type="button" onClick={() => setShowRegPw(s => !s)} tabIndex={-1}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: 2, display: 'flex', alignItems: 'center' }}>
                    {showRegPw ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div style={{ fontSize: 12.5, color: '#dc2626' }}>{error}</div>}

              <button type="submit" disabled={loading}
                style={{ height: 44, borderRadius: 10, border: 'none', background: loading ? '#a1a1aa' : '#6d28d9', color: '#ffffff', fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12.5, color: '#a1a1aa' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: 0, fontFamily: 'inherit' }}>
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
