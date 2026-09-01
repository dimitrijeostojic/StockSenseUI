import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logoutApi } from '../api/auth';
import type { LoginRequest, RegisterRequest } from '../types';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

interface AuthUser {
  email: string;
  firstName?: string;
  role?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtRole(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload[ROLE_CLAIM] as string | undefined;
  } catch {
    return undefined;
  }
}

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const stored = getStoredUser();
    if (!stored) return null;
    if (stored.role) return stored;
    const role = decodeJwtRole(token);
    if (role) {
      const updated = { ...stored, role };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return updated;
    }
    return stored;
  });

  const login = useCallback(async (req: LoginRequest) => {
    const res = await apiLogin(req);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    const role = decodeJwtRole(res.accessToken);
    const authUser: AuthUser = { email: req.email, role };
    localStorage.setItem('authUser', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const register = useCallback(async (req: RegisterRequest) => {
    await apiRegister(req);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try { await logoutApi(refreshToken); } catch { /* proceed regardless */ }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
