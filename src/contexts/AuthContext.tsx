import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logoutApi } from '../api/auth';
import { getMyUser } from '../api/users';
import type { LoginRequest, RegisterRequest } from '../types';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

interface AuthUser {
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  tenantName?: string;
  role?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  seenTourPages: string[] | null;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  markTourComplete: (pageName: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtClaims(token: string): Partial<AuthUser> {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      role: payload[ROLE_CLAIM] as string | undefined,
      username: payload['unique_name'] as string | undefined,
      tenantName: payload['tenant_name'] as string | undefined,
    };
  } catch {
    return {};
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
    const claims = decodeJwtClaims(token);
    const merged = { ...stored, ...claims };
    if (JSON.stringify(merged) !== JSON.stringify(stored)) {
      localStorage.setItem('authUser', JSON.stringify(merged));
    }
    return merged;
  });
  const [seenTourPages, setSeenTourPages] = useState<string[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getMyUser()
      .then(u => setSeenTourPages(u.seenTourPages ?? []))
      .catch(() => setSeenTourPages([]));
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    const res = await apiLogin(req);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    const claims = decodeJwtClaims(res.accessToken);
    let authUser: AuthUser = { email: req.email, ...claims };
    try {
      const profile = await getMyUser();
      authUser = { ...authUser, firstName: profile.firstName, lastName: profile.lastName, username: profile.username };
      setSeenTourPages(profile.seenTourPages ?? []);
    } catch { setSeenTourPages([]); }
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
    setSeenTourPages(null);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markTourComplete = useCallback((pageName: string) => {
    setSeenTourPages(prev => prev === null ? [pageName] : prev.includes(pageName) ? prev : [...prev, pageName]);
  }, []);

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, seenTourPages, login, register, logout, updateUser, markTourComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
