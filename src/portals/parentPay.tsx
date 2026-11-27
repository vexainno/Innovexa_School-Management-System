import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, Lock, Phone, Printer, ShieldCheck, Smartphone } from 'lucide-react';
import { actions, feeAccount, money, studentById, useSchool } from '@/store/store';
import { cardBrand, expiryValid, formatCardNumber, luhnValid, paymentGateway } from '@/services/paymentGateway';
import { Card, Field, Notice } from '@/components/kit';
import { printReceipt } from './finance';
import { useMe } from './shared';

type Method = 'card' | 'mtn' | 'orange';
type Step = 'details' | 'otp' | 'phone' | 'done';

const METHOD_INFO: Record<Method, { label: string; sub: string; brand: string; icon: typeof CreditCard }> = {
  card: { label: 'Debit / credit card', sub: 'Visa · Mastercard · Verve', brand: 'from-navy-700 to-navy-900 text-white', icon: CreditCard },
  mtn: { label: 'MTN Mobile Money', sub: 'Approve on your phone', brand: 'from-accent-300 to-accent-500 text-navy-900', icon: Smartphone },
  orange: { label: 'Orange Money', sub: 'Approve on your phone', brand: 'from-orange-400 to-orange-600 text-white', icon: Smartphone },
};

export function OnlinePayment({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const s = useSchool();
  const me = useMe();
  const child = studentById(s, studentId)!;
  const a = feeAccount(s, studentId);
  const [method, setMethod] = useState<Method>('card');
  const [full, setFull] = useState(true);
  const [partial, setPartial] = useState('');
  const [agree, setAgree] = useState(false);
  const [step, setStep] = useState<Step>('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [session, setSession] = useState<{ id: string; last4: string; brand: string } | null>(null);
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState(child.guardianPhone);
  const [requestId, setRequestId] = useState('');
  const [seconds, setSeconds] = useState(120);
  const [receipt, setReceipt] = useState('');
  const amount = Math.round((full ? a.balance : Math.min(Number(partial) || 0, a.balance)) * 100) / 100;
  const wallet = s.school.mobileMoney.find((w) => (method === 'mtn' ? w.provider === 'MTN Mobile Money' : w.provider === 'Orange Money'));
  const demo = !paymentGateway.live;

  useEffect(() => {
    if (step !== 'phone') return;
    const t = setInterval(() => setSeconds((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const cardErrors = {
    name: card.name.trim().length < 3 ? 'Enter the name on the card' : '',
    number: !luhnValid(card.number) ? 'Card number is not valid' : '',
    expiry: !expiryValid(card.expiry) ? 'Use MM/YY and a future date' : '',
    cvv: !/^\d{3,4}$/.test(card.cvv) ? '3 or 4 digits' : '',
  };
  const cardOk = !Object.values(cardErrors).some(Boolean);
  const phoneOk = /^\+?[\d\s]{9,}$/.test(phone);

  const finish = (reference: string, m: 'card' | 'mobile') => {
    const r = actions.recordPayment({ studentId, amount, method: m === 'card' ? (demo ? 'Card (demo)' : 'Card') : (demo ? 'Mobile money (demo)' : 'Mobile money'), reference, by: `${me.name} (online)` });
    setReceipt(r);
    setCard({ name: '', number: '', expiry: '', cvv: '' });
    setStep('done');
  };

  const payCard = async () => {
    setError(''); setBusy(true);
    try {
      const r = await paymentGateway.startCardPayment({ amount, cardNumber: card.number, expiry: card.expiry, cvv: card.cvv, name: card.name });
      setSession({ id: r.sessionId, last4: r.last4, brand: r.brand });
      // Card details are cleared as soon as they have been handed to the provider.
      setCard((c) => ({ ...c, number: '', cvv: '' }));
      setStep('otp');
    } finally { setBusy(false); }
  };
  const confirmOtp = async () => {
    if (!session) return;
    setError(''); setBusy(true);
    const r = await paymentGateway.confirmCardOtp(session.id, otp);
    setBusy(false);
    if (!r.ok) { setError(r.message ?? 'Payment failed.'); return; }
    finish(`${session.brand} •••• ${session.last4} · ${r.reference}`, 'card');
  };
  const requestMomo = async () => {
    setError(''); setBusy(true);
    const r = await paymentGateway.requestMobileMoney({ provider: METHOD_INFO[method].label, phone, amount });
    setBusy(false);
    setRequestId(r.requestId); setSeconds(120); setStep('phone');
  };
  const checkMomo = async () => {
    setBusy(true);
    const r = await paymentGateway.checkMobileMoney(requestId);
    setBusy(false);
    if (r.ok) finish(`${METHOD_INFO[method].label} ${phone} · ${r.reference}`, 'mobile');
  };

  if (step === 'done') {
    const p = s.payments.find((x) => x.receiptNo === receipt);
    return (
      <Card>
        <div className="text-center py-6">
          <CheckCircle2 className="w-14 h-14 text-success-600 mx-auto" />
          <h2 className="text-xl font-bold text-navy-900 mt-3">Payment received by {s.school.name}</h2>
          <p className="text-sm text-navy-600 mt-1">{money(p?.amount ?? amount)} for {child.name}. Receipt <b>{receipt}</b>. New balance: <b>{money(feeAccount(s, studentId).balance)}</b>. The Finance Office has been notified.</p>
          {demo && <p className="text-xs text-warning-700 mt-2">Demonstration mode — no money moved. Live payments start once the school's payment provider is connected.</p>}
          <div className="flex justify-center gap-2 mt-4">{p && <button type="button" className="btn-secondary" onClick={() => printReceipt(s, p)}><Printer className="w-4 h-4" /> Download receipt</button>}<button type="button" className="btn-primary" onClick={onBack}>Back to statement</button></div>
        </div>
      </Card>
    );
  }

  const summary = (
    <Card title="Payment summary">
      <dl className="text-sm space-y-2">
        {[['Paid to', s.school.name], ['Student', child.name], ['Student ID', child.studentNo], ['Fee', `School fees ${s.school.academicYear}`], ['Outstanding', money(a.balance)]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-navy-500">{k}</dt><dd className="text-right">{v}</dd></div>)}
        <div className="flex justify-between gap-3 border-t border-navy-100 pt-2 text-base font-bold"><dt>Paying now</dt><dd>{money(amount)}</dd></div>
      </dl>
      {step === 'details' && (
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="radio" checked={full} onChange={() => setFull(true)} /> Full balance</label>
          <label className="flex items-center gap-2"><input type="radio" checked={!full} onChange={() => setFull(false)} /> Part payment</label>
          {!full && <input type="number" min="1" className="input" placeholder="Amount (US$)" value={partial} onChange={(e) => setPartial(e.target.value)} aria-label="Amount" />}
        </div>
      )}
      <div className="rounded-lg bg-navy-50 p-3 mt-4 text-xs text-navy-600 flex gap-2"><Lock className="w-4 h-4 shrink-0" /> Secured payment. The school never stores card numbers or PINs; only the card brand and last 4 digits appear on your receipt.</div>
      {demo && <p className="text-[11px] text-warning-700 mt-2">Demonstration mode — no money is charged until the school's payment provider is connected.</p>}
    </Card>
  );

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-5">
        {step === 'details' && (
          <Card title="How would you like to pay?">
            <div className="grid sm:grid-cols-3 gap-3">
              {(Object.keys(METHOD_INFO) as Method[]).map((m) => { const M = METHOD_INFO[m]; return (
                <button key={m} type="button" onClick={() => { setMethod(m); setError(''); }} aria-pressed={method === m} className={`relative rounded-2xl p-4 text-left h-28 flex flex-col justify-between bg-gradient-to-br ${M.brand} transition-all ${method === m ? 'ring-4 ring-navy-400 ring-offset-2' : 'opacity-75 hover:opacity-100'}`}>
                  <M.icon className="w-6 h-6" />
                  <span><span className="block font-semibold">{M.label}</span><span className="block text-xs opacity-90">{M.sub}</span></span>
                  {method === m && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5" />}
                </button>
              ); })}
            </div>
          </Card>
        )}

        {step === 'details' && method === 'card' && (
          <Card title="Card details" subtitle="Enter the details exactly as they appear on the card.">
            <div className="space-y-4">
              <Field label="Name on card"><input className="input" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></Field>
              <Field label="Card number">
                <div className="relative">
                  <input className="input pr-28 tracking-wider" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} />
                  {card.number && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-navy-600">{cardBrand(card.number)}</span>}
                </div>
                {card.number.replace(/\D/g, '').length >= 13 && cardErrors.number && <span className="text-xs text-error-600">{cardErrors.number}</span>}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry (MM/YY)"><input className="input" inputMode="numeric" autoComplete="cc-exp" placeholder="08/28" value={card.expiry} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} />{card.expiry.length === 5 && cardErrors.expiry && <span className="text-xs text-error-600">{cardErrors.expiry}</span>}</Field>
                <Field label="Security code (CVV)"><input className="input" type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} /></Field>
              </div>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" /> I authorize {s.school.name} to charge {money(amount)} to this card for school fees.</label>
              {error && <Notice tone="error">{error}</Notice>}
              <button type="button" className="btn-primary w-full py-3" disabled={!cardOk || !agree || amount <= 0 || busy} onClick={payCard}>{busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Contacting your bank…</> : <><Lock className="w-4 h-4" /> Pay {money(amount)}</>}</button>
              {demo && <p className="text-xs text-navy-400">Demo tip: use test card 4242 4242 4242 4242, any future expiry and any 3-digit CVV.</p>}
            </div>
          </Card>
        )}

        {step === 'otp' && session && (
          <Card title="Verify with your bank">
            <div className="flex gap-3 items-start">
              <ShieldCheck className="w-8 h-8 text-navy-600 shrink-0" />
              <div className="flex-1 space-y-3">
                <p className="text-sm text-navy-700">Your bank sent a one-time code by SMS to confirm this payment of <b>{money(amount)}</b> on {session.brand} •••• {session.last4}.</p>
                <input className="input tracking-[0.5em] text-center text-lg max-w-xs" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} aria-label="One-time code" />
                {demo && <p className="text-xs text-navy-400">Demonstration mode: enter any 6 digits.</p>}
                {error && <Notice tone="error">{error}</Notice>}
                <div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => { setStep('details'); setOtp(''); }}>Cancel</button><button type="button" className="btn-primary" disabled={otp.length !== 6 || busy} onClick={confirmOtp}>{busy ? 'Confirming…' : 'Confirm payment'}</button></div>
              </div>
            </div>
          </Card>
        )}

        {step === 'details' && method !== 'card' && (
          <Card title={METHOD_INFO[method].label} subtitle="We'll send a payment request to your phone. Approve it with your mobile money PIN and the money goes straight to the school's account.">
            <div className="space-y-4">
              <Field label={`Your ${method === 'mtn' ? 'MTN' : 'Orange'} mobile money number`}><input className="input" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <div className="rounded-lg bg-navy-50 p-3 text-sm">Paying to: <b>{wallet?.merchantName ?? s.school.name}</b>{wallet?.number ? ` · ${wallet.number}` : ''} ({METHOD_INFO[method].label})</div>
              {!wallet && <Notice tone="warning">The school has not added its {METHOD_INFO[method].label} account yet. Please use another method or contact the Finance Office.</Notice>}
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" /> I agree to pay {money(amount)} from this mobile money account.</label>
              <button type="button" className="btn-primary w-full py-3" disabled={!phoneOk || !agree || amount <= 0 || busy || !wallet} onClick={requestMomo}>{busy ? 'Sending request…' : `Send ${money(amount)} payment request to my phone`}</button>
            </div>
          </Card>
        )}

        {step === 'phone' && (
          <Card title="Check your phone">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center shrink-0"><Phone className="w-7 h-7 text-navy-700 animate-pulse" /></div>
              <div className="flex-1 space-y-3 text-sm">
                <ol className="list-decimal pl-5 space-y-1 text-navy-700">
                  <li>A {METHOD_INFO[method].label} prompt has been sent to <b>{phone}</b>.</li>
                  <li>Confirm the amount <b>{money(amount)}</b> to <b>{wallet?.merchantName ?? s.school.name}</b>.</li>
                  <li>Enter your mobile money PIN on your phone to approve. Never share your PIN with anyone.</li>
                </ol>
                <p className="text-navy-500">Waiting for approval… {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} · Request {requestId}</p>
                <div className="flex flex-wrap gap-2">
                  {wallet?.dialCode && <a className="btn-secondary" href={`tel:${encodeURIComponent(wallet.dialCode)}`}><Phone className="w-4 h-4" /> Didn't get the prompt? Open my mobile money menu</a>}
                  <button type="button" className="btn-primary" disabled={busy} onClick={checkMomo}>{busy ? 'Checking…' : demo ? 'Simulate approval on phone (demo)' : "I've approved it"}</button>
                  <button type="button" className="btn-ghost" onClick={() => setStep('details')}>Cancel</button>
                </div>
                {!wallet?.dialCode && <p className="text-xs text-navy-400">If no prompt arrives, open your mobile money menu on your phone and choose “Pay merchant” to {wallet?.number}.</p>}
              </div>
            </div>
          </Card>
        )}
      </div>
      {summary}
    </div>
  );
}
