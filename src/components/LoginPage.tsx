import { useState } from 'react';
import { School, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { mockAuthService } from '@/services/authService';
import { ActivateAccountDialog, FirstRunSetup, ForgotPasswordDialog } from './AccountAccess';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [showActivate, setShowActivate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password, remember);
    if (!result.success) setError(result.error || 'Login failed');
    setLoading(false);
  };

  if (mockAuthService.needsSetup()) return <FirstRunSetup />;



  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-navy-950">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 lg:p-16 relative overflow-hidden">
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
            A digital workplace for your school
          </h2>
          <div className="mb-8" />

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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-navy-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-navy-300 text-navy-700 focus:ring-navy-500" />
                Remember me
              </label>
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-navy-600 hover:text-navy-800 font-medium">
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

          <div className="mt-6 rounded-xl border border-navy-200 bg-white p-4 text-center">
            <p className="text-sm text-navy-600">First time here?</p>
            <button type="button" onClick={() => setShowActivate(true)} className="mt-1 text-sm font-semibold text-navy-800 hover:underline">Activate your account with the code from your school</button>
          </div>

          

          <p className="mt-6 text-xs text-center text-navy-400">
            InnosysEdu — Powered by Innovexa TechHub
          </p>
        </div>
      </div>

      <ForgotPasswordDialog open={showForgot} onClose={() => setShowForgot(false)} onActivate={() => setShowActivate(true)} />
      <ActivateAccountDialog open={showActivate} onClose={() => setShowActivate(false)} />
    </div>
  );
}

