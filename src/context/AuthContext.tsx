import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import { mockAuthService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, remember?: boolean) => { success: boolean; error?: string };
  switchDemoAccount: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'innosysedu.session';

function restore(): User | null {
  try {
    const id = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return id ? mockAuthService.getById(id) ?? null : null;
  } catch {
    return null;
  }
}

function remember(user: User | null, persistent: boolean) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (user) (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, user.id);
  } catch {
    /* storage unavailable: session lasts for this tab only */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(restore);

  const login = useCallback((email: string, password: string, persistent = true) => {
    const result = mockAuthService.signIn(email, password);
    if (!result.user) return { success: false, error: result.error };
    remember(result.user, persistent);
    window.location.hash = '#/dashboard';
    setUser(result.user);
    return { success: true };
  }, []);

  const switchDemoAccount = useCallback((role: Role) => {
    if (!import.meta.env.DEV) return;
    const account = mockAuthService.getDemoAccount(role);
    if (account) {
      remember(account, true);
      window.location.hash = '#/dashboard';
      setUser(account);
    }
  }, []);

  const logout = useCallback(() => {
    remember(null, false);
    window.location.hash = '';
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, switchDemoAccount, logout }}>
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
