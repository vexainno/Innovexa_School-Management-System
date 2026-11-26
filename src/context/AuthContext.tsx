import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import { mockAuthService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  switchDemoAccount: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    const result = mockAuthService.signIn(email, password);
    if (!result.user) return { success: false, error: result.error };
    setUser(result.user);
    return { success: true };
  }, []);

  const switchDemoAccount = useCallback((role: Role) => {
    if (!import.meta.env.DEV) return;
    const account = mockAuthService.getDemoAccount(role);
    if (account) setUser(account);
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, switchDemoAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
