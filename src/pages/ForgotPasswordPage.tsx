import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { useIsMobile } from '../hooks/useIsMobile';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
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

        {sent ? (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', marginBottom: 6 }}>Check your email</div>
            <div style={{ fontSize: 13.5, color: '#71717a', marginBottom: 26 }}>
              If an account with <strong>{email}</strong> exists, a password reset link has been sent.
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                height: 44, width: '100%', borderRadius: 10, border: 'none',
                background: '#6d28d9', color: '#ffffff',
                fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', marginBottom: 6 }}>Forgot password</div>
            <div style={{ fontSize: 13.5, color: '#71717a', marginBottom: 26 }}>Enter your email and we'll send a reset link</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>Email</label>
                <input
                  type="email" required placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </div>

            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 12.5, color: '#a1a1aa' }}>
              Remembered it?{' '}
              <button type="button" onClick={() => navigate('/login')}
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
