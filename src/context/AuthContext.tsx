import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import { mockAuthService } from '@/services/authService';

type Outcome = { success: boolean; error?: string };
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, remember?: boolean) => Promise<Outcome>;
  activate: (email: string, code: string, password: string) => Promise<Outcome>;
  setupAdmin: (name: string, email: string, password: string) => Promise<Outcome>;
  switchDemoAccount: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'innosysedu.session';

function restore(): User | null {
  try {
    const id = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return id ? mockAuthService.getBySession(id) ?? null : null;
  } catch {
    return null;
  }
}

function remember(user: User | null, persistent: boolean) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (user) (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, mockAuthService.sessionFor(user));
  } catch {
    /* storage unavailable: session lasts for this tab only */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(restore);

  const enter = useCallback((u: User, persistent: boolean) => {
    remember(u, persistent);
    window.location.hash = '#/dashboard';
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string, persistent = true) => {
    const r = await mockAuthService.signIn(email, password);
    if (!r.user) return { success: false, error: r.error };
    enter(r.user, persistent);
    return { success: true };
  }, [enter]);

  const activate = useCallback(async (email: string, code: string, password: string) => {
    const r = await mockAuthService.activate(email, code, password);
    if (!r.user) return { success: false, error: r.error };
    enter(r.user, true);
    return { success: true };
  }, [enter]);

  const setupAdmin = useCallback(async (name: string, email: string, password: string) => {
    const r = await mockAuthService.setupPlatformAdmin(name, email, password);
    if (!r.user) return { success: false, error: r.error };
    enter(r.user, true);
    return { success: true };
  }, [enter]);

  const switchDemoAccount = useCallback((role: Role) => {
    if (!import.meta.env.DEV) return;
    const account = mockAuthService.getDemoAccount(role);
    if (account) enter(account, true);
  }, [enter]);

  const logout = useCallback(() => {
    remember(null, false);
    window.location.hash = '';
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, activate, setupAdmin, switchDemoAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
