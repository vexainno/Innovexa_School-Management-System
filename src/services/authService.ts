import type { Role, User } from '@/types';
import { TEST_ACCOUNTS } from '@/data/mockData';
import { ROLE_TITLES } from '@/config/navigation';
import type { Account } from '@/store/types';
import { actions, FRESH, getSchool } from '@/store/store';
import { hashPassword, newSalt, passwordProblem } from './passwords';

type Result = { user: User | null; error?: string };

/** Frontend contract. The real sign-in integration implements this without changing the screens. */
export interface AuthService {
  signIn(email: string, password: string): Promise<Result>;
  activate(email: string, code: string, password: string): Promise<Result>;
  setupPlatformAdmin(name: string, email: string, password: string): Promise<Result>;
  needsSetup(): boolean;
  getDemoAccount(role: Role): User | undefined;
  getBySession(session: string): User | undefined;
  sessionFor(user: User): string;
}

/** Demonstration accounts used to present the platform. Disabled in fresh (real school) deployments. */
const DEMO_PASSWORD = 'test1234';
const COLORS: Partial<Record<Role, string>> = { student: 'bg-accent-500', parent: 'bg-success-600', super_admin: 'bg-navy-800' };

export function userFromAccount(a: Account): User {
  return {
    id: a.staffId ?? a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    title: ROLE_TITLES[a.role],
    avatarColor: COLORS[a.role] ?? 'bg-navy-600',
    linkedStudentIds: a.studentIds.length ? a.studentIds : undefined,
  };
}

const findAccount = (email: string) => getSchool().accounts.find((a) => a.email === email.trim().toLowerCase());

export const mockAuthService: AuthService = {
  async signIn(email, password) {
    if (!FRESH) {
      const demo = TEST_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (demo) return password === DEMO_PASSWORD ? { user: demo } : { user: null, error: 'The email or password is incorrect. Please try again.' };
    }
    const acct = findAccount(email);
    if (acct?.status === 'invited') return { user: null, error: 'This account has not been activated yet. Choose “First time here? Activate your account”.' };
    if (acct?.status === 'disabled') return { user: null, error: 'This account is disabled. Please contact the school office.' };
    if (acct?.passwordHash && acct.salt && (await hashPassword(password, acct.salt)) === acct.passwordHash) return { user: userFromAccount(acct) };
    return { user: null, error: 'The email or password is incorrect. Please try again.' };
  },
  async activate(email, code, password) {
    const acct = findAccount(email);
    if (!acct || acct.status !== 'invited' || acct.activationCode !== code.trim()) {
      return { user: null, error: 'We could not match that email and activation code. Check the code given by the school.' };
    }
    const problem = passwordProblem(password);
    if (problem) return { user: null, error: problem };
    const salt = newSalt();
    actions.activateAccount(acct.id, await hashPassword(password, salt), salt);
    return { user: userFromAccount({ ...acct, status: 'active' }) };
  },
  needsSetup() {
    return FRESH && !getSchool().accounts.some((a) => a.role === 'super_admin');
  },
  async setupPlatformAdmin(name, email, password) {
    if (!this.needsSetup()) return { user: null, error: 'Setup has already been completed.' };
    const problem = passwordProblem(password);
    if (problem) return { user: null, error: problem };
    const acct = actions.createAccount({ email, name, role: 'super_admin', studentIds: [], createdBy: 'First-run setup' });
    const salt = newSalt();
    actions.activateAccount(acct.id, await hashPassword(password, salt), salt);
    return { user: userFromAccount({ ...acct, status: 'active' }) };
  },
  getDemoAccount(role) {
    return FRESH ? undefined : TEST_ACCOUNTS.find((account) => account.role === role);
  },
  getBySession(session) {
    if (session.startsWith('acct:')) {
      const a = getSchool().accounts.find((x) => x.id === session.slice(5) && x.status === 'active');
      return a ? userFromAccount(a) : undefined;
    }
    return FRESH ? undefined : TEST_ACCOUNTS.find((account) => account.id === session);
  },
  sessionFor(user) {
    const a = getSchool().accounts.find((x) => x.email === user.email);
    return a ? `acct:${a.id}` : user.id;
  },
};
