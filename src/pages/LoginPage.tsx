import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '',
    companyName: '', pib: '', address: '',
  });

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
      await register(regForm);
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
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Password</label>
                <input
                  type="password" required placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  style={{ height: 42, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 13px', fontSize: 14, fontFamily: 'inherit', color: '#18181b', background: '#fafafa', width: '100%' }}
                />
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
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>{f.label}</label>
                    <input required placeholder={f.placeholder} value={regForm[f.key as keyof typeof regForm]}
                      onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: '#18181b', width: '100%' }} />
                  </div>
                ))}
              </div>
              {[
                { label: 'Username', key: 'username', placeholder: 'johndoe', type: 'text' },
                { label: 'Email', key: 'email', placeholder: 'you@company.com', type: 'email' },
                { label: 'Password', key: 'password', placeholder: '••••••••', type: 'password' },
                { label: 'Company name', key: 'companyName', placeholder: 'Acme Inc.', type: 'text' },
                { label: 'Tax ID (PIB)', key: 'pib', placeholder: '123456789', type: 'text' },
                { label: 'Address', key: 'address', placeholder: '123 Main St', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>{f.label}</label>
                  <input required type={f.type} placeholder={f.placeholder}
                    value={regForm[f.key as keyof typeof regForm]}
                    onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ height: 38, borderRadius: 10, border: '1px solid #e4e4e7', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fafafa', color: '#18181b', width: '100%' }} />
                </div>
              ))}

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
