import type { Role, User } from '@/types';
import { TEST_ACCOUNTS } from '@/data/mockData';

/** Frontend contract. A future auth integration can implement this without changing the screens. */
export interface AuthService {
  signIn(email: string, password: string): { user: User | null; error?: string };
  getDemoAccount(role: Role): User | undefined;
}

/** Development-only preview adapter. It never authenticates against a real identity provider. */
export const mockAuthService: AuthService = {
  signIn(email, password) {
    if (!import.meta.env.DEV) {
      return { user: null, error: 'Authentication is not connected in this frontend preview.' };
    }
    const user = TEST_ACCOUNTS.find((account) => account.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== 'test1234') {
      return { user: null, error: 'Check the demo email and password, then try again.' };
    }
    return { user };
  },
  getDemoAccount(role) {
    if (!import.meta.env.DEV) return undefined;
    return TEST_ACCOUNTS.find((account) => account.role === role);
  },
};
