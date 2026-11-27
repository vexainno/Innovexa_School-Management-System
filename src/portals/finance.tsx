import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Banknote, CheckCircle2, Download, Landmark, Printer, Receipt, Send, TrendingUp, Wallet } from 'lucide-react';
import {
  actions, activeStudents, className, feeAccount, financeSummary, fmtDate, gradesOf, money, studentById, useSchool,
} from '@/store/store';
import type { Payment, SchoolState } from '@/store/types';
import { downloadCsv, esc, printHtml, tableHtml } from '@/store/files';
import { Card, ColumnPairs, Dialog, Field, Header, Meter, Notice, Pill, SearchBox, Stat, Table } from '@/components/kit';
import { greeting, useMe, type PageProps } from './shared';

export function receiptHtml(s: SchoolState, p: Payment) {
  const st = studentById(s, p.studentId);
  const acct = feeAccount(s, p.studentId);
  return `<div class="box"><div style="text-align:center"><h1>${esc(s.school.name)}</h1><div class="muted">${esc(s.school.address)} · ${esc(s.school.phone)}</div><h2>OFFICIAL RECEIPT</h2></div>
  <table><tr><th>Receipt no.</th><td>${esc(p.receiptNo)}</td><th>Date</th><td>${esc(fmtDate(p.date))}</td></tr>
  <tr><th>Student</th><td>${esc(st?.name)}</td><th>Student ID</th><td>${esc(st?.studentNo)}</td></tr>
  <tr><th>Class</th><td>${esc(st ? className(st.grade, st.section) : '')}</td><th>Academic year</th><td>${esc(s.school.academicYear)}</td></tr>
  <tr><th>Amount received</th><td><b>${esc(money(p.amount))}</b></td><th>Method</th><td>${esc(p.method)} ${p.reference !== '—' ? `(${esc(p.reference)})` : ''}</td></tr>
  <tr><th>Total fees</th><td>${esc(money(acct.charged - acct.concessions))}</td><th>Balance after all payments</th><td>${esc(money(acct.balance))}</td></tr></table>
  <p style="margin-top:40px">Received by: ${esc(p.recordedBy)} &nbsp; ______________________ (signature &amp; stamp)</p></div>`;
}
export const printReceipt = (s: SchoolState, p: Payment) => printHtml(`Receipt ${p.receiptNo}`, receiptHtml(s, p));

export function FinanceOverview({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const f = financeSummary(s);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · ${s.school.academicYear} school year · figures in ${s.school.currency}`} action={<button type="button" className="btn-primary" onClick={() => onNavigate('record-payments')}><Receipt className="w-4 h-4" /> Record payment</button>} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Stat label="Total Income" value={money(f.income)} sub="Current school year, all fee receipts" icon={<TrendingUp className="w-5 h-5" />} tone="success" onClick={() => onNavigate('payment-history')} />
        <Stat label="Total Expenses" value={money(f.expenses)} sub="Paid expenditure incl. salaries" icon={<ArrowUpCircle className="w-5 h-5" />} tone="error" onClick={() => onNavigate('expenditure')} />
        <Stat label="Net Income" value={money(f.net)} sub="Income minus expenses" icon={<Wallet className="w-5 h-5" />} tone={f.net >= 0 ? 'success' : 'error'} onClick={() => onNavigate('financial-reports')} />
        <Stat label="Cash Position" value={money(f.cash)} sub={`Bank ${money(f.bank)} · cash on hand ${money(f.cashOnHand)}`} icon={<Landmark className="w-5 h-5" />} onClick={() => onNavigate('reconciliation')} />
        <Stat label="Upcoming Payables" value={money(f.payablesTotal)} sub={`${f.payables.length} bills due to vendors`} icon={<Banknote className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('expenditure')} />
        <Stat label="Upcoming Receivables" value={money(f.receivables)} sub="Outstanding student fees" icon={<ArrowDownCircle className="w-5 h-5" />} tone="accent" onClick={() => onNavigate('outstanding')} />
      </div>
      <Card title="Monthly revenue and expenses">
        <ColumnPairs data={f.monthly.map((m) => ({ label: new Date(`${m.month}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), values: [m.revenue, m.expenses] }))} series={[{ name: 'Revenue', color: '#243d6f' }, { name: 'Expenses', color: '#d97706' }]} format={(n) => money(n)} />
      </Card>
      <Card title="Latest payments" action={<button type="button" className="text-sm text-navy-600 hover:underline" onClick={() => onNavigate('payment-history')}>All payments</button>}>
        <Table head={['Date', 'Receipt', 'Student', 'Method', 'Amount']}>{s.payments.slice(-6).reverse().map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{studentById(s, p.studentId)?.name}</td><td>{p.method}</td><td className="font-medium">{money(p.amount)}</td></tr>)}</Table>
      </Card>
    </div>
  );
}

export function FeeStructurePage() {
  const s = useSchool();
  const [edit, setEdit] = useState<number | null>(null);
  const [items, setItems] = useState<{ name: string; amount: number }[]>([]);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="School Fee Structure" subtitle="Approved fees for the year. New registrations get a fee account from this structure automatically." />
      <div className="grid lg:grid-cols-2 gap-6">
        {s.feeStructures.map((f) => (
          <Card key={f.gradeFrom} title={`Grades ${f.gradeFrom}–${f.gradeTo} (${f.gradeFrom <= 9 ? 'Junior High' : 'Senior High'})`} action={edit === f.gradeFrom ? undefined : <button type="button" className="btn-secondary text-sm" onClick={() => { setEdit(f.gradeFrom); setItems(f.items.map((i) => ({ ...i }))); }}>Edit</button>}>
            {edit === f.gradeFrom ? (
              <div className="space-y-2">
                {items.map((it, i) => <div key={i} className="flex gap-2"><input className="input py-1.5 text-sm" value={it.name} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Fee item" /><input type="number" className="input py-1.5 text-sm w-28" value={it.amount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} aria-label="Amount" /></div>)}
                <button type="button" className="text-sm text-navy-600" onClick={() => setItems([...items, { name: 'New item', amount: 0 }])}>+ Add item</button>
                <div className="flex justify-end gap-2"><button type="button" className="btn-secondary text-sm" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn-primary text-sm" onClick={() => { actions.setFeeItems(f.gradeFrom, items.filter((x) => x.name && x.amount >= 0)); setEdit(null); }}>Save</button></div>
              </div>
            ) : (
              <>
                <Table head={['Item', 'Amount']}>{f.items.map((i) => <tr key={i.name}><td>{i.name}</td><td>{money(i.amount)}</td></tr>)}<tr className="font-semibold"><td>Total per student</td><td>{money(f.items.reduce((a, b) => a + b.amount, 0))}</td></tr></Table>
                <h3 className="text-sm font-semibold mt-4 mb-2">Payment schedule</h3>
                <ul className="text-sm space-y-1">{f.instalments.map((i) => <li key={i.label}>{i.label}: {i.percent}% — due {fmtDate(i.due)}</li>)}</ul>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function AccountDialog({ studentId, onClose, onPay }: { studentId: string | null; onClose: () => void; onPay?: (id: string) => void }) {
  const s = useSchool();
  if (!studentId) return null;
  const st = studentById(s, studentId)!;
  const a = feeAccount(s, studentId);
  return (
    <Dialog open onClose={onClose} wide title={`${st.name} — fee account`} footer={onPay && a.balance > 0 ? <button type="button" className="btn-primary" onClick={() => onPay(studentId)}>Record payment</button> : undefined}>
      <p className="text-sm text-navy-500 mb-3">{st.studentNo} · {className(st.grade, st.section)} · guardian {st.guardianName} ({st.guardianPhone})</p>
      <div className="grid grid-cols-4 gap-3 mb-4 text-center">{[['Charged', a.charged], ['Concessions', a.concessions], ['Paid', a.paid], ['Balance', a.balance]].map(([k, v]) => <div key={k} className="rounded-lg bg-navy-50 p-3"><p className="text-xs text-navy-500">{k}</p><p className="font-bold">{money(Number(v))}</p></div>)}</div>
      <Table head={['Item', 'Amount']}>{a.structure?.items.map((i) => <tr key={i.name}><td>{i.name}</td><td>{money(i.amount)}</td></tr>)}</Table>
      <h3 className="text-sm font-semibold mt-4 mb-2">Payments</h3>
      <Table head={['Date', 'Receipt', 'Method', 'Amount', '']} empty="No payments yet.">{a.payments.map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{p.method}</td><td>{money(p.amount)}</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => printReceipt(s, p)}>Receipt</button></td></tr>)}</Table>
    </Dialog>
  );
}

function useAccountFilter() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  const rows = activeStudents(s).map((st) => ({ st, a: feeAccount(s, st.id) })).filter((r) => (!grade || r.st.grade === Number(grade)) && (!status || r.a.status === status) && `${r.st.name} ${r.st.studentNo}`.toLowerCase().includes(q.toLowerCase()));
  const controls = (
    <div className="flex flex-wrap gap-2">
      <div className="w-56"><SearchBox value={q} onChange={setQ} placeholder="Name or student ID" /></div>
      <select className="input py-2 text-sm w-36" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Class"><option value="">All classes</option>{gradesOf(s).map((g) => <option key={g} value={g}>Grade {g}</option>)}</select>
      <select className="input py-2 text-sm w-36" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option><option value="paid">Fully paid</option><option value="partial">Partially paid</option><option value="unpaid">Unpaid</option></select>
    </div>
  );
  return { s, rows, controls };
}
const statusPill = (st: string) => <Pill tone={st === 'paid' ? 'success' : st === 'partial' ? 'warning' : 'error'}>{st === 'paid' ? 'Fully paid' : st === 'partial' ? 'Partial' : 'Unpaid'}</Pill>;

export function StudentAccounts({ onNavigate }: PageProps) {
  const { rows, controls } = useAccountFilter();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Fee Accounts" subtitle="Every enrolled student has an account created automatically from the fee structure." />
      <Card action={controls}>
        <Table head={['Student ID', 'Student', 'Class', 'Charged', 'Paid', 'Balance', 'Status', '']}>
          {rows.slice(0, 80).map(({ st, a }) => <tr key={st.id}><td className="font-mono text-xs">{st.studentNo}</td><td className="font-medium">{st.name}</td><td>{className(st.grade, st.section)}</td><td>{money(a.charged - a.concessions)}</td><td>{money(a.paid)}</td><td className="font-semibold">{money(a.balance)}</td><td>{statusPill(a.status)}</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setOpen(st.id)}>Open</button></td></tr>)}
        </Table>
        {rows.length > 80 && <p className="text-xs text-navy-400 mt-2">Showing 80 of {rows.length}. Use the filters.</p>}
      </Card>
      <AccountDialog studentId={open} onClose={() => setOpen(null)} onPay={(id) => onNavigate(`record-payments:${id}`)} />
    </div>
  );
}

export function RecordPayments({ param }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const [q, setQ] = useState('');
  const [id, setId] = useState<string | null>(param ?? null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Payment['method']>('Cash');
  const [ref, setRef] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const hits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const st = id ? studentById(s, id) : null;
  const a = id ? feeAccount(s, id) : null;
  const amt = Number(amount);
  const receipt = done ? s.payments.find((p) => p.receiptNo === done) : null;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Record Payments" subtitle="Recording a payment updates the balance, payment history and receipts, notifies the parent and updates the Principal's dashboard." />
      {receipt && (
        <Notice tone="success"><CheckCircle2 className="inline w-4 h-4 mr-1" /> Payment of {money(receipt.amount)} recorded. Receipt <b>{receipt.receiptNo}</b>. The guardian was notified. <button type="button" className="underline ml-2" onClick={() => printReceipt(s, receipt)}>Print receipt</button></Notice>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="1. Find the student">
          <SearchBox value={q} onChange={setQ} placeholder="Name or student ID" />
          <div className="mt-3 space-y-1">{hits.map((x) => <button key={x.id} type="button" onClick={() => { setId(x.id); setDone(null); setQ(''); }} className="w-full text-left p-2 rounded-lg hover:bg-navy-50 text-sm"><span className="font-medium">{x.name}</span> <span className="text-navy-500">· {x.studentNo} · {className(x.grade, x.section)}</span></button>)}</div>
          {st && a && (
            <div className="mt-4 rounded-xl bg-navy-50 p-4 text-sm">
              <p className="font-semibold text-navy-900">{st.name} <span className="font-mono text-xs text-navy-500">{st.studentNo}</span></p>
              <p className="text-navy-600">{className(st.grade, st.section)} · {st.guardianName}</p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center"><div><p className="text-xs text-navy-500">Fees</p><p className="font-bold">{money(a.charged - a.concessions)}</p></div><div><p className="text-xs text-navy-500">Paid</p><p className="font-bold">{money(a.paid)}</p></div><div><p className="text-xs text-navy-500">Balance</p><p className="font-bold text-error-700">{money(a.balance)}</p></div></div>
            </div>
          )}
        </Card>
        <Card title="2. Payment details">
          <div className="space-y-3">
            <Field label="Amount (US$)" hint={a ? `Full balance: ${money(a.balance)}. Partial payments are allowed.` : undefined}><input type="number" min="0" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={!st} /></Field>
            {a && a.balance > 0 && <button type="button" className="text-sm text-navy-600 hover:underline" onClick={() => setAmount(String(a.balance))}>Pay full balance</button>}
            <Field label="Method"><select className="input" value={method} onChange={(e) => setMethod(e.target.value as Payment['method'])} disabled={!st}><option>Cash</option><option>Bank deposit</option><option>Mobile money</option></select></Field>
            <Field label="Reference (bank slip / transaction no.)"><input className="input" value={ref} onChange={(e) => setRef(e.target.value)} disabled={!st || method === 'Cash'} /></Field>
            {a && amt > a.balance && <Notice tone="error">Amount is more than the outstanding balance.</Notice>}
            <button type="button" className="btn-primary w-full" disabled={!st || !(amt > 0) || (a ? amt > a.balance : true) || (method !== 'Cash' && !ref.trim())} onClick={() => { if (!id) return; const r = actions.recordPayment({ studentId: id, amount: amt, method, reference: ref, by: me.name }); setDone(r); setAmount(''); setRef(''); }}>Record payment and issue receipt</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Receipts() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const list = s.payments.filter((p) => `${p.receiptNo} ${studentById(s, p.studentId)?.name}`.toLowerCase().includes(q.toLowerCase())).slice().reverse();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Generate Receipts" subtitle="Every recorded payment has an official receipt ready to print or save as PDF." />
      <Card action={<div className="w-64"><SearchBox value={q} onChange={setQ} placeholder="Receipt no. or student" /></div>}>
        <Table head={['Receipt', 'Date', 'Student', 'Amount', 'Method', '']}>{list.slice(0, 60).map((p) => <tr key={p.id}><td className="font-mono text-xs">{p.receiptNo}</td><td>{fmtDate(p.date)}</td><td>{studentById(s, p.studentId)?.name}</td><td>{money(p.amount)}</td><td>{p.method}</td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => printReceipt(s, p)}><Printer className="w-3.5 h-3.5" /> Receipt</button></td></tr>)}</Table>
      </Card>
    </div>
  );
}

export function Outstanding({ onNavigate }: PageProps) {
  const { s, rows, controls } = useAccountFilter();
  const owing = rows.filter((r) => r.a.balance > 0).sort((a, b) => b.a.balance - a.a.balance);
  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Outstanding Balances" subtitle={`${owing.length} students owe ${money(owing.reduce((a, r) => a + r.a.balance, 0))}. Fully paid students are excluded.`} action={<button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Outstanding_${stamp}`, ['Student ID', 'Name', 'Class', 'Guardian', 'Phone', 'Paid', 'Balance'], owing.map((r) => [r.st.studentNo, r.st.name, className(r.st.grade, r.st.section), r.st.guardianName, r.st.guardianPhone, r.a.paid, r.a.balance]))}><Download className="w-4 h-4" /> Download</button>} />
      <Card action={controls}>
        <Table head={['Student', 'Class', 'Guardian', 'Paid', 'Balance', 'Status', 'Deadline', '']}>
          {owing.slice(0, 80).map(({ st, a }) => <tr key={st.id}><td className="font-medium">{st.name}</td><td>{className(st.grade, st.section)}</td><td className="text-xs">{st.guardianName}<br />{st.guardianPhone}</td><td>{money(a.paid)}</td><td className="font-semibold text-error-700">{money(a.balance)}</td><td>{statusPill(a.status)}</td><td className="text-xs">{a.overdueSince ? <Pill tone="error">Overdue since {fmtDate(a.overdueSince)}</Pill> : fmtDate(a.nextDue)}</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => onNavigate(`record-payments:${st.id}`)}>Record payment</button></td></tr>)}
        </Table>
      </Card>
      <p className="text-xs text-navy-400">{s.school.name} · reminders to guardians with balances are sent from the school's notification channel.</p>
    </div>
  );
}

export function PaymentHistory() {
  const s = useSchool();
  const [month, setMonth] = useState('');
  const list = s.payments.filter((p) => !month || p.date.startsWith(month)).slice().reverse();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Payment History" subtitle={`${list.length} payments · ${money(list.reduce((a, p) => a + p.amount, 0))}`} action={<>
        <select className="input py-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month"><option value="">All months</option>{['2026-08', '2026-09', '2026-10', '2026-11', '2026-12'].map((m) => <option key={m} value={m}>{new Date(`${m}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</option>)}</select>
        <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Payments_${month || 'all'}`, ['Date', 'Receipt', 'Student ID', 'Student', 'Method', 'Reference', 'Amount', 'Recorded by'], list.map((p) => { const st = studentById(s, p.studentId); return [p.date, p.receiptNo, st?.studentNo, st?.name, p.method, p.reference, p.amount, p.recordedBy]; }))}><Download className="w-4 h-4" /> Download</button>
      </>} />
      <Card><Table head={['Date', 'Receipt', 'Student', 'Class', 'Method', 'Reference', 'Amount']}>{list.slice(0, 100).map((p) => { const st = studentById(s, p.studentId); return <tr key={p.id}><td>{fmtDate(p.date)}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{st?.name}</td><td>{st && className(st.grade, st.section)}</td><td>{p.method}</td><td className="text-xs">{p.reference}</td><td className="font-medium">{money(p.amount)}</td></tr>; })}</Table></Card>
    </div>
  );
}

export function Concessions() {
  const s = useSchool();
  const me = useMe();
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ studentId: '', kind: 'Scholarship' as 'Scholarship' | 'Discount' | 'Waiver', amount: '', reason: '', approvedBy: 'Dr. Edward Karpeh' });
  const hits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Discounts and Scholarships" subtitle="Record only approved concessions. They reduce the student's balance immediately." />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card><Table head={['Student', 'Type', 'Amount', 'Reason', 'Approved by', 'Date']}>{s.concessions.map((c) => <tr key={c.id}><td>{studentById(s, c.studentId)?.name}</td><td><Pill tone="accent">{c.kind}</Pill></td><td>{money(c.amount)}</td><td className="text-sm">{c.reason}</td><td className="text-xs">{c.approvedBy}</td><td className="text-xs">{fmtDate(c.date)}</td></tr>)}</Table></Card>
        <Card title="Record approved concession">
          <div className="space-y-3">
            <SearchBox value={q} onChange={setQ} placeholder="Find student" />
            {hits.map((x) => <button key={x.id} type="button" className={`block w-full text-left text-sm p-1.5 rounded ${form.studentId === x.id ? 'bg-navy-100' : 'hover:bg-navy-50'}`} onClick={() => setForm({ ...form, studentId: x.id })}>{x.name} · {className(x.grade, x.section)}</button>)}
            {form.studentId && <p className="text-sm">Selected: <b>{studentById(s, form.studentId)?.name}</b></p>}
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })} aria-label="Type"><option>Scholarship</option><option>Discount</option><option>Waiver</option></select>
            <input type="number" className="input" placeholder="Amount (US$)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} aria-label="Amount" />
            <input className="input" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} aria-label="Reason" />
            <input className="input" placeholder="Approved by" value={form.approvedBy} onChange={(e) => setForm({ ...form, approvedBy: e.target.value })} aria-label="Approved by" />
            <button type="button" className="btn-primary w-full" disabled={!form.studentId || !(Number(form.amount) > 0) || !form.reason} onClick={() => { actions.addConcession({ studentId: form.studentId, kind: form.kind, amount: Number(form.amount), reason: form.reason, approvedBy: form.approvedBy || me.name }); setForm({ ...form, studentId: '', amount: '', reason: '' }); setQ(''); }}>Record</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Expenditure() {
  const s = useSchool();
  const [form, setForm] = useState({ category: 'Supplies', vendor: '', description: '', amount: '', dueDate: '' });
  const pending = s.expenses.filter((e) => e.status === 'pending').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Expenditure Management" subtitle={`Paid this year: ${money(s.expenses.filter((e) => e.status === 'paid').reduce((a, e) => a + e.amount, 0))}`} />
      <Card title="Upcoming payables">
        <Table head={['Due', 'Vendor', 'Description', 'Category', 'Amount', '']}>{pending.map((e) => <tr key={e.id}><td>{fmtDate(e.dueDate)}</td><td>{e.vendor}</td><td>{e.description}</td><td>{e.category}</td><td className="font-medium">{money(e.amount)}</td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => actions.payExpense(e.id)}>Mark paid</button></td></tr>)}</Table>
      </Card>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card title="All expenses"><Table head={['Date', 'Vendor', 'Description', 'Category', 'Amount', 'Status']}>{s.expenses.slice().reverse().slice(0, 50).map((e) => <tr key={e.id}><td>{fmtDate(e.date)}</td><td>{e.vendor}</td><td className="text-sm">{e.description}</td><td>{e.category}</td><td>{money(e.amount)}</td><td><Pill tone={e.status === 'paid' ? 'success' : 'warning'}>{e.status}</Pill></td></tr>)}</Table></Card>
        <Card title="Record expense">
          <div className="space-y-3">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label="Category">{s.budget.map((b) => <option key={b.category}>{b.category}</option>)}</select>
            <input className="input" placeholder="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} aria-label="Vendor" />
            <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
            <input type="number" className="input" placeholder="Amount (US$)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} aria-label="Amount" />
            <Field label="Due date (leave empty if paid now)"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
            <button type="button" className="btn-primary w-full" disabled={!form.vendor || !(Number(form.amount) > 0)} onClick={() => { const today = new Date().toISOString().slice(0, 10); actions.addExpense({ category: form.category, vendor: form.vendor, description: form.description, amount: Number(form.amount), date: today, status: form.dueDate ? 'pending' : 'paid', dueDate: form.dueDate || today }); setForm({ ...form, vendor: '', description: '', amount: '', dueDate: '' }); }}>Save expense</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Salaries() {
  const s = useSchool();
  const payroll = s.staff.reduce((a, x) => a + x.monthlySalary, 0);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Staff Salaries" subtitle={`Monthly payroll: ${money(payroll)} for ${s.staff.length} staff`} />
      <Card title="Payroll runs">
        <Table head={['Month', 'Amount', 'Status', 'Paid on', '']}>{s.salaryRuns.map((r) => <tr key={r.month}><td>{new Date(`${r.month}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</td><td>{money(payroll)}</td><td><Pill tone={r.status === 'paid' ? 'success' : 'warning'}>{r.status}</Pill></td><td>{fmtDate(r.paidOn)}</td><td>{r.status === 'pending' && <button type="button" className="btn-primary text-xs py-1.5" onClick={() => actions.runPayroll(r.month)}>Pay salaries</button>}</td></tr>)}</Table>
      </Card>
      <Card title="Staff salary schedule"><Table head={['Staff ID', 'Name', 'Position', 'Monthly salary']}>{s.staff.map((x) => <tr key={x.id}><td className="font-mono text-xs">{x.staffNo}</td><td>{x.name}</td><td>{x.role === 'teacher' ? `Teacher — ${x.subjects.join(', ')}` : x.position}</td><td>{money(x.monthlySalary)}</td></tr>)}</Table></Card>
    </div>
  );
}

export function Budget() {
  const s = useSchool();
  const spent = (c: string) => s.expenses.filter((e) => e.category === c && e.status === 'paid').reduce((a, e) => a + e.amount, 0);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Budget Management" subtitle={`${s.school.academicYear} budget. Spending updates from recorded expenses.`} />
      <Card>
        <Table head={['Category', 'Budget (year)', 'Spent', 'Remaining', 'Used']}>
          {s.budget.map((b) => { const sp = spent(b.category); const pct = (sp / Math.max(1, b.budgeted)) * 100; return <tr key={b.category}><td className="font-medium">{b.category}</td><td><input type="number" className="input py-1 text-sm w-32" defaultValue={b.budgeted} onBlur={(e) => actions.setBudget(b.category, Number(e.target.value))} aria-label={`${b.category} budget`} /></td><td>{money(sp)}</td><td>{money(b.budgeted - sp)}</td><td className="w-48"><div className="flex items-center gap-2"><Meter value={pct} tone={pct > 90 ? '#dc2626' : pct > 70 ? '#d97706' : '#16a34a'} /><span className="text-xs">{Math.round(pct)}%</span></div></td></tr>; })}
        </Table>
      </Card>
    </div>
  );
}

export function FinancialReports() {
  const s = useSchool();
  const me = useMe();
  const f = financeSummary(s);
  const [sent, setSent] = useState('');
  const stamp = new Date().toISOString().slice(0, 10);
  const cats = [...new Set(s.expenses.map((e) => e.category))];
  const reports = [
    { title: 'Monthly financial statement', header: ['Month', 'Revenue', 'Expenses', 'Net'], rows: f.monthly.map((m) => [m.month, m.revenue, m.expenses, m.revenue - m.expenses]) },
    { title: 'Fee collection by class', header: ['Class', 'Billed', 'Collected', 'Outstanding'], rows: gradesOf(s).map((g) => { const a = activeStudents(s).filter((x) => x.grade === g).map((x) => feeAccount(s, x.id)); return [`Grade ${g}`, a.reduce((p, x) => p + x.charged - x.concessions, 0), a.reduce((p, x) => p + x.paid, 0), a.reduce((p, x) => p + x.balance, 0)]; }) },
    { title: 'Expenditure by category', header: ['Category', 'Paid', 'Pending'], rows: cats.map((c) => [c, s.expenses.filter((e) => e.category === c && e.status === 'paid').reduce((a, e) => a + e.amount, 0), s.expenses.filter((e) => e.category === c && e.status === 'pending').reduce((a, e) => a + e.amount, 0)]) },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Financial Reports" subtitle="Prepared from live records. Submit to the Principal when ready." />
      {sent && <Notice tone="success">{sent}</Notice>}
      <div className="grid lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.title} title={r.title}>
            <Table head={r.header}>{r.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{typeof c === 'number' ? money(c) : c}</td>)}</tr>)}</Table>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="btn-secondary text-xs" onClick={() => downloadCsv(`${r.title.replace(/\s/g, '_')}_${stamp}`, r.header, r.rows)}><Download className="w-3.5 h-3.5" /> CSV</button>
              <button type="button" className="btn-secondary text-xs" onClick={() => printHtml(r.title, `<h1>${s.school.name} — ${r.title}</h1><p class="muted">${fmtDate(stamp)}</p>${tableHtml(r.header, r.rows.map((row) => row.map((c) => (typeof c === 'number' ? money(c) : c))))}`)}><Printer className="w-3.5 h-3.5" /> Print</button>
              <button type="button" className="btn-primary text-xs" onClick={() => { actions.submitFinancialReport(r.title, me.name); setSent(`"${r.title}" submitted to the Principal.`); }}><Send className="w-3.5 h-3.5" /> Submit to Principal</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Reconciliation() {
  const s = useSchool();
  const f = financeSummary(s);
  const byMethod = (['Cash', 'Bank deposit', 'Mobile money', 'Card (demo)'] as const).map((m) => ({ m, n: s.payments.filter((p) => p.method === m).length, total: s.payments.filter((p) => p.method === m).reduce((a, p) => a + p.amount, 0) }));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Reconciliation" subtitle="Match recorded receipts against bank and mobile-money statements." />
      <div className="grid sm:grid-cols-3 gap-4"><Stat label="Bank balance (book)" value={money(f.bank)} /><Stat label="Cash on hand (to deposit)" value={money(f.cashOnHand)} tone="warning" /><Stat label="Cash position" value={money(f.cash)} tone="success" /></div>
      <Card title="Receipts by payment channel">
        <Table head={['Channel', 'Transactions', 'Recorded total', 'Matched to statement']}>{byMethod.map((r) => <tr key={r.m}><td>{r.m}</td><td>{r.n}</td><td>{money(r.total)}</td><td><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!checked[r.m]} onChange={(e) => setChecked({ ...checked, [r.m]: e.target.checked })} /> {checked[r.m] ? 'Reconciled' : 'Not yet'}</label></td></tr>)}</Table>
      </Card>
      <Card title="Unreconciled items">
        <Table head={['Date', 'Receipt', 'Method', 'Reference', 'Amount']} empty="Nothing outstanding.">{s.payments.filter((p) => p.method !== 'Cash' && !checked[p.method]).slice(-10).reverse().map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{p.method}</td><td className="text-xs">{p.reference}</td><td>{money(p.amount)}</td></tr>)}</Table>
      </Card>
    </div>
  );
}
