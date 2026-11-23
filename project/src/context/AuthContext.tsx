import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import { TEST_ACCOUNTS } from '@/data/mockData';

const SESSION_KEY = 'innosysedu.session.v1';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw) as { id: string };
      return TEST_ACCOUNTS.find((a) => a.id === saved.id) ?? null;
    } catch {
      return null;
    }
  });

  const login = useCallback((email: string, password: string) => {
    const account = TEST_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (!account) {
      return { success: false, error: 'No account found with that email address.' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
    setUser(account);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ id: account.id })); } catch { /* ignore */ }
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
