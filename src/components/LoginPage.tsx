import { useState } from 'react';
import { School, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TEST_ACCOUNTS } from '@/data/mockData';
import { ROLE_TITLES } from '@/config/navigation';
import type { Role } from '@/types';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      setLoading(false);
    }, 500);
  };

  const quickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('test1234');
    setError('');
  };

  const testAccountsByRole: { role: Role; label: string }[] = [
    { role: 'principal', label: 'Principal' },
    { role: 'vice_principal', label: 'Vice Principal' },
    { role: 'dean', label: 'Dean' },
    { role: 'registrar', label: 'Registrar' },
    { role: 'academic_officer', label: 'Academic Officer' },
    { role: 'teacher', label: 'Teacher' },
    { role: 'counselor', label: 'Counselor' },
    { role: 'finance', label: 'Finance' },
    { role: 'librarian', label: 'Librarian' },
    { role: 'super_admin', label: 'Platform Super Admin' },
    { role: 'student', label: 'Student' },
    { role: 'parent', label: 'Parent' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-navy-950">
      {/* Left panel — Branding */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-navy-700/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <School className="w-8 h-8 text-navy-800" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">InnosysEdu</h1>
              <p className="text-sm text-navy-300">Powered by Innovexa TechHub</p>
            </div>
          </div>

          <h2 className="font-display font-bold text-3xl lg:text-4xl leading-tight mb-4">
            A digital workplace for every role in your school.
          </h2>
          <p className="text-navy-300 text-lg leading-relaxed mb-8">
            Principals, teachers, students, parents, and staff — each sees only the tasks,
            data, and actions that belong to their position.
          </p>

          <div className="space-y-3">
            {[
              'Role-based dashboards, not a one-size-fits-all screen',
              'One unified login — the system handles the rest',
              'Gradebook approval, results release, and finance workflows',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-navy-200">
                <div className="w-5 h-5 rounded-full bg-success-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3 h-3 text-success-400" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-navy-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-navy-900">InnosysEdu</h1>
              <p className="text-xs text-navy-500">Powered by Innovexa TechHub</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-navy-900 mb-2">Sign in to your account</h2>
            <p className="text-sm text-navy-500">
              Use your school-issued account to continue. Your authorized workspace opens automatically after sign-in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@innosys.edu"
                  className="input pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-navy-600 cursor-pointer">
                <input type="checkbox" className="rounded border-navy-300 text-navy-700 focus:ring-navy-500" />
                Remember me
              </label>
              <button type="button" onClick={() => { setShowForgot(true); setForgotSent(false); setForgotError(''); }} className="text-sm text-navy-600 hover:text-navy-800 font-medium">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700 animate-slide-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Development-only preview accounts. Vite removes this block from production builds. */}
          {import.meta.env.DEV && <div className="mt-8 pt-6 border-t border-navy-200">
            <button
              onClick={() => setShowAccounts(!showAccounts)}
              className="text-sm text-navy-500 hover:text-navy-700 font-medium flex items-center gap-1"
            >
              {showAccounts ? 'Hide' : 'Show'} test accounts (development only)
            </button>
            {showAccounts && (
              <div className="mt-4 grid grid-cols-2 gap-2 animate-slide-up">
                {testAccountsByRole.map(({ role, label }) => {
                  const account = TEST_ACCOUNTS.find((a) => a.role === role);
                  if (!account) return null;
                  return (
                    <button
                      key={role}
                      onClick={() => quickLogin(account.email)}
                      className="text-left px-3 py-2 rounded-lg border border-navy-200 hover:border-navy-400 hover:bg-navy-50 transition-all text-xs"
                    >
                      <p className="font-medium text-navy-700">{label}</p>
                      <p className="text-navy-400 truncate">{account.email}</p>
                    </button>
                  );
                })}
                <p className="col-span-2 text-xs text-navy-400 mt-1">
                  Demo password for all 12 accounts: <span className="font-mono font-medium text-navy-600">test1234</span>
                </p>
              </div>
            )}
          </div>}

          <p className="mt-6 text-xs text-center text-navy-400">
            InnosysEdu — Powered by Innovexa TechHub
          </p>
        </div>
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setShowForgot(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><KeyRound className="w-5 h-5" /></div>
                <h2 className="text-lg font-semibold font-display text-navy-900">Forgot Password</h2>
              </div>
              <button onClick={() => setShowForgot(false)} className="text-navy-400 hover:text-navy-700 p-1 rounded-lg hover:bg-navy-50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-4">
                  <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-success-600" />
                  </div>
                  <h3 className="font-semibold text-navy-800 text-center">Demo request recorded</h3>
                  <p className="text-sm text-navy-500 mt-1 text-center max-w-xs">
                    This is a frontend demonstration only. No email was sent. In the live product, recovery will be handled by the connected authentication service.
                  </p>
                </div>
                <button onClick={() => setShowForgot(false)} className="btn-primary w-full">Back to Login</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-navy-600">Enter your registered email address to preview the recovery request. This demo does not send email or reveal whether an account exists. If you cannot access your email, contact an authorized school officer for identity-verified recovery.</p>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@innosys.edu"
                  />
                </div>
                {forgotError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowForgot(false)} className="btn-secondary">Cancel</button>
                  <button
                    onClick={() => {
                      if (!forgotEmail.trim()) {
                        setForgotError('Please enter your email address.');
                        return;
                      }
                      setForgotSent(true);
                    }}
                    className="btn-primary"
                  >Send Reset Link</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { Role };
export { ROLE_TITLES };
