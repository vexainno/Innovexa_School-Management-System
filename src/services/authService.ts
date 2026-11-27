import type { Role, User } from '@/types';
import { TEST_ACCOUNTS } from '@/data/mockData';

/** Frontend contract. The real sign-in integration implements this without changing the screens. */
export interface AuthService {
  signIn(email: string, password: string): { user: User | null; error?: string };
  getDemoAccount(role: Role): User | undefined;
  getById(id: string): User | undefined;
}

/**
 * Demonstration accounts used to present the platform to schools. They work in every build
 * but are intentionally not listed anywhere in the interface.
 */
const DEMO_PASSWORD = 'test1234';

export const mockAuthService: AuthService = {
  signIn(email, password) {
    const user = TEST_ACCOUNTS.find((account) => account.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== DEMO_PASSWORD) {
      return { user: null, error: 'The email or password is incorrect. Please try again.' };
    }
    return { user };
  },
  getDemoAccount(role) {
    return TEST_ACCOUNTS.find((account) => account.role === role);
  },
  getById(id) {
    return TEST_ACCOUNTS.find((account) => account.id === id);
  },
};
