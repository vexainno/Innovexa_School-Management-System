import { useState } from 'react';
import { AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Dialog } from '@/components/kit';

/** First sign-in: the person enters the email the school registered, the activation code from the school, and chooses their own password. */
export function ActivateAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activate } = useAuth();
  const [f, setF] = useState({ email: '', code: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (f.password !== f.confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    const r = await activate(f.email, f.code, f.password);
    setBusy(false);
    if (!r.success) setError(r.error ?? 'Activation failed.');
  };
  return (
    <Dialog open={open} onClose={onClose} title="Activate your account" footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="button" className="btn-primary" disabled={busy || !f.email || !f.code || !f.password} onClick={submit}>{busy ? 'Activating…' : 'Activate and sign in'}</button>
    </>}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg bg-navy-50 p-3 text-sm text-navy-700"><KeyRound className="w-5 h-5 shrink-0" /> Use the email address you gave the school and the 6-digit activation code from the school office. You choose your own password — the school never sees it.</div>
        <label className="block"><span className="label">Email address</span><input type="email" className="input" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="block"><span className="label">Activation code</span><input inputMode="numeric" className="input tracking-widest" maxLength={6} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })} /></label>
        <label className="block"><span className="label">Create a password</span><input type="password" className="input" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><span className="block text-xs text-navy-400 mt-1">At least 8 characters, with letters and a number.</span></label>
        <label className="block"><span className="label">Confirm password</span><input type="password" className="input" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></label>
        {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      </div>
    </Dialog>
  );
}

export function ForgotPasswordDialog({ open, onClose, onActivate }: { open: boolean; onClose: () => void; onActivate: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Forgot your password?" footer={<>
      <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
      <button type="button" className="btn-primary" onClick={() => { onClose(); onActivate(); }}>I have a new code</button>
    </>}>
      <div className="space-y-3 text-sm text-navy-700">
        <p><b>Students and parents:</b> ask the Registrar's office to reset your access. You will receive a new 6-digit activation code.</p>
        <p><b>Staff:</b> contact your school's platform administrator.</p>
        <p>Then choose <b>“First time here? Activate your account”</b>, enter your email and the new code, and create a new password.</p>
      </div>
    </Dialog>
  );
}

/** First run of a fresh school deployment: create the platform administrator (Innovexa). */
export function FirstRunSetup() {
  const { setupAdmin } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const submit = async () => {
    setError('');
    if (f.password !== f.confirm) { setError('The two passwords do not match.'); return; }
    const r = await setupAdmin(f.name, f.email, f.password);
    if (!r.success) setError(r.error ?? 'Setup failed.');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 p-6">
      <div className="card p-8 w-full max-w-md">
        <ShieldCheck className="w-10 h-10 text-navy-700" />
        <h1 className="text-2xl font-bold font-display text-navy-900 mt-3">Set up this school's platform</h1>
        <p className="text-sm text-navy-500 mt-1">Create the Innovexa platform administrator account. You will then add the school's staff accounts. This screen appears only once.</p>
        <div className="space-y-3 mt-5">
          <input className="input" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Full name" />
          <input type="email" className="input" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="Email" />
          <input type="password" className="input" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} aria-label="Password" />
          <input type="password" className="input" placeholder="Confirm password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} aria-label="Confirm password" />
          {error && <p className="text-sm text-error-700">{error}</p>}
          <button type="button" className="btn-primary w-full" disabled={!f.name || !f.email || !f.password} onClick={submit}>Create administrator</button>
        </div>
      </div>
    </div>
  );
}
