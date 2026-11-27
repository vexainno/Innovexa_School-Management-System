import { useState } from 'react';
import { Building2, CalendarCheck, CheckCircle2, CreditCard, FileBadge, GraduationCap, Lock, Printer, Smartphone, Wallet } from 'lucide-react';
import {
  actions, attendanceSummary, batchStage, CATEGORY_LABEL, categoryFor, className, feeAccount, fmtDate, letterFor,
  money, notificationsFor, schoolDays, staffName, studentAverage, studentById, subjectTotals, useSchool,
} from '@/store/store';
import { esc, printHtml } from '@/store/files';
import { Card, Dialog, Field, Header, Meter, Notice, Pill, Stat, Table, Tabs, catTone } from '@/components/kit';
import { SectionTimetable } from './academic';
import { AttendanceHistory } from './common';
import { printReceipt } from './finance';
import { ReleasedReportCard } from './student';
import { greeting, useMe, type PageProps } from './shared';

const CHILD_KEY = 'innosysedu.parent.child';

function useChild() {
  const me = useMe();
  const s = useSchool();
  const ids = (me.linkedStudentIds ?? []).filter((id) => studentById(s, id));
  const [id, setIdState] = useState(() => { try { const v = sessionStorage.getItem(CHILD_KEY); return v && ids.includes(v) ? v : ids[0]; } catch { return ids[0]; } });
  const setId = (v: string) => { setIdState(v); try { sessionStorage.setItem(CHILD_KEY, v); } catch { /* ignore */ } };
  return { me, s, ids, id, child: studentById(s, id)!, setId };
}

function ChildSwitcher({ ids, id, setId }: { ids: string[]; id: string; setId: (v: string) => void }) {
  const s = useSchool();
  if (ids.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Select child">
      {ids.map((x) => { const st = studentById(s, x)!; return <button key={x} type="button" role="tab" aria-selected={id === x} onClick={() => setId(x)} className={`px-4 py-2 rounded-full border text-sm font-medium ${id === x ? 'bg-navy-800 text-white border-navy-800' : 'bg-white border-navy-200 text-navy-700 hover:bg-navy-50'}`}>{st.firstName} · {className(st.grade, st.section)}</button>; })}
    </div>
  );
}

function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: (ctx: ReturnType<typeof useChild>) => React.ReactNode }) {
  const ctx = useChild();
  if (!ctx.child) return <Notice>No verified children are linked to this account yet.</Notice>;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={title} subtitle={subtitle ?? `${ctx.child.name} · ${className(ctx.child.grade, ctx.child.section)}`} />
      <ChildSwitcher ids={ctx.ids} id={ctx.id} setId={ctx.setId} />
      {children(ctx)}
    </div>
  );
}

export function ParentOverview({ onNavigate }: PageProps) {
  const { me, s, ids } = useChild();
  const notes = notificationsFor(s, me).slice(0, 5);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · ${ids.length} children linked to your account`} />
      <div className="grid lg:grid-cols-3 gap-4">
        {ids.map((id) => {
          const st = studentById(s, id)!;
          const att = attendanceSummary([id], schoolDays(20));
          const avg = studentAverage(s, id, { approvedOnly: true });
          const fee = feeAccount(s, id);
          const stage = batchStage(s, st.grade, st.section);
          const go = (p: string) => { try { sessionStorage.setItem(CHILD_KEY, id); } catch { /* ignore */ } onNavigate(p); };
          return (
            <Card key={id} title={st.name} subtitle={`${className(st.grade, st.section)} · ${st.studentNo}`}>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => go('attendance')} className="rounded-lg bg-navy-50 p-3 text-left hover:bg-navy-100"><CalendarCheck className="w-4 h-4 text-navy-500" /><p className="text-lg font-bold">{att.rate}%</p><p className="text-xs text-navy-500">Attendance · {att.absent} absent</p></button>
                <button type="button" onClick={() => go('academic-performance')} className="rounded-lg bg-navy-50 p-3 text-left hover:bg-navy-100"><GraduationCap className="w-4 h-4 text-navy-500" /><p className="text-lg font-bold">{avg ?? '—'}{avg != null && '%'}</p><p className="text-xs text-navy-500">Average (published)</p></button>
                <button type="button" onClick={() => go('fees')} className="rounded-lg bg-navy-50 p-3 text-left hover:bg-navy-100"><Wallet className="w-4 h-4 text-navy-500" /><p className={`text-lg font-bold ${fee.balance ? 'text-error-700' : 'text-success-700'}`}>{money(fee.balance)}</p><p className="text-xs text-navy-500">{fee.balance ? (fee.overdueSince ? `Overdue since ${fmtDate(fee.overdueSince)}` : `Balance · due ${fmtDate(fee.nextDue)}`) : 'Fully paid'}</p></button>
                <button type="button" onClick={() => go('report-cards')} className="rounded-lg bg-navy-50 p-3 text-left hover:bg-navy-100"><FileBadge className="w-4 h-4 text-navy-500" /><p className="text-sm font-bold mt-1">{stage === 'released' ? 'Available' : 'Not yet'}</p><p className="text-xs text-navy-500">Report card</p></button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card title="Latest from the school" action={<button type="button" className="text-sm text-navy-600 hover:underline" onClick={() => onNavigate('notifications')}>All notifications</button>}>
        <ul className="divide-y divide-navy-100">{notes.map((n) => <li key={n.id} className="py-2.5"><button type="button" className="text-left w-full" onClick={() => { actions.markRead(n.id, me.id); if (n.link) onNavigate(n.link); }}><p className={`text-sm ${n.readBy.includes(me.id) ? '' : 'font-semibold'}`}>{n.title}</p><p className="text-xs text-navy-500">{n.body} · {fmtDate(n.createdAt)}</p></button></li>)}</ul>
      </Card>
    </div>
  );
}

export function MyChildren({ onNavigate }: PageProps) {
  const { s, ids, setId } = useChild();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Children" subtitle="Officially registered students linked to your account after school verification." />
      <div className="grid md:grid-cols-3 gap-4">
        {ids.map((id) => { const st = studentById(s, id)!; const sponsor = s.staff.find((t) => t.sponsorOf === `${st.grade}${st.section}`); return (
          <Card key={id} title={st.name} subtitle={st.studentNo}>
            <dl className="text-sm space-y-1.5"><div className="flex justify-between"><dt className="text-navy-500">Class</dt><dd>{className(st.grade, st.section)}</dd></div><div className="flex justify-between"><dt className="text-navy-500">Class sponsor</dt><dd>{sponsor?.name ?? '—'}</dd></div><div className="flex justify-between"><dt className="text-navy-500">Enrolled since</dt><dd>{st.yearEntered}</dd></div><div className="flex justify-between"><dt className="text-navy-500">Relationship</dt><dd>{st.guardianRelation} · verified</dd></div></dl>
            <div className="flex flex-wrap gap-2 mt-4">{[['attendance', 'Attendance'], ['academic-performance', 'Performance'], ['fees', 'Fees'], ['timetable', 'Timetable']].map(([p, l]) => <button key={p} type="button" className="btn-secondary text-xs py-1.5" onClick={() => { setId(id); onNavigate(p); }}>{l}</button>)}</div>
          </Card>
        ); })}
      </div>
    </div>
  );
}

export function ParentAttendance() {
  return (
    <Page title="Attendance">
      {({ child }) => { const a = attendanceSummary([child.id], schoolDays(20)); return (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Stat label="Days present" value={a.present} tone="success" /><Stat label="Days absent" value={a.absent} tone="error" /><Stat label="Late arrivals" value={a.late} tone="warning" /><Stat label="Attendance" value={`${a.rate}%`} footer={<Meter value={a.rate} />} /></div>
          <Card title="Attendance history (last 20 school days)"><AttendanceHistory studentId={child.id} /></Card>
        </>
      ); }}
    </Page>
  );
}

function assignmentsFor(subject: string, studentId: string, total: number | null) {
  const h = (k: string) => [...`${studentId}${subject}${k}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const d = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  return [
    { title: `${subject} — Classwork exercise`, due: d(-18), max: 20, submitted: true, marked: true, score: total != null ? Math.round(((total + (h('a') % 9) - 4) / 100) * 20) : null },
    { title: `${subject} — Quiz 2`, due: d(-9), max: 10, submitted: true, marked: true, score: total != null ? Math.round(((total + (h('b') % 11) - 5) / 100) * 10) : null },
    { title: `${subject} — Homework assignment`, due: d(4 + (h('c') % 5)), max: 20, submitted: h('d') % 3 === 0, marked: false, score: null },
  ].map((x) => ({ ...x, overdue: !x.submitted && x.due < today }));
}

export function ParentPerformance() {
  const [tab, setTab] = useState<'subjects' | 'assignments' | 'progress'>('subjects');
  return (
    <Page title="Academic Performance">
      {({ s, child }) => {
        const rows = subjectTotals(s, child.id, { approvedOnly: true });
        const avg = studentAverage(s, child.id, { approvedOnly: true });
        const batch = s.batches.find((b) => b.key === `${child.grade}${child.section}`);
        const released = batch?.status === 'released';
        return (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <Stat label="Average (published marks)" value={`${avg ?? '—'}%`} sub={avg != null ? <Pill tone={catTone(categoryFor(avg, s.grading))}>{CATEGORY_LABEL[categoryFor(avg, s.grading)]}</Pill> : 'Marks appear after Principal approval'} />
              <Stat label="Subjects published" value={`${rows.length} of ${subjectTotals(s, child.id).length || rows.length}`} />
              <Stat label="Report card" value={<span className="text-base">{released ? 'Released' : 'Not yet released'}</span>} />
            </div>
            <Tabs tabs={[{ id: 'subjects', label: 'Subject grades' }, { id: 'assignments', label: 'Assignments and quizzes' }, { id: 'progress', label: 'Progress over time' }]} value={tab} onChange={setTab} />
            {tab === 'subjects' && (
              <Card>
                <Table head={['Subject', 'Teacher', 'Total', 'Grade', 'Teacher feedback']} empty="No subject marks have been approved for publication yet.">
                  {rows.map((r) => <tr key={r.subject}><td className="font-medium">{r.subject}</td><td className="text-sm">{staffName(s, r.teacherId)}</td><td className="font-semibold">{r.total ?? '—'}</td><td>{r.total != null ? letterFor(r.total, s.grading).letter : '—'}</td><td className="text-sm text-navy-600">{r.total == null ? '' : r.total >= 85 ? 'Excellent work.' : r.total >= 70 ? 'Good, keep practising.' : 'Needs extra practice — please encourage revision at home.'}</td></tr>)}
                </Table>
                {released && batch?.sheets[child.id]?.teacherRemark && <p className="text-sm mt-3"><b>Class sponsor:</b> {batch.sheets[child.id].teacherRemark}</p>}
              </Card>
            )}
            {tab === 'assignments' && (
              <Card>
                <Table head={['Assignment', 'Due', 'Submitted', 'Marked', 'Score']}>
                  {subjectTotals(s, child.id).flatMap((r) => assignmentsFor(r.subject, child.id, r.total)).map((a) => <tr key={a.title}><td>{a.title}</td><td className="text-xs">{fmtDate(a.due)}</td><td>{a.submitted ? <Pill tone="success">Submitted</Pill> : a.overdue ? <Pill tone="error">Missing</Pill> : <Pill tone="muted">Not yet</Pill>}</td><td>{a.marked ? 'Yes' : 'No'}</td><td>{a.marked && a.score != null ? `${a.score} / ${a.max}` : '—'}</td></tr>)}
                </Table>
              </Card>
            )}
            {tab === 'progress' && (
              <Card title="Average by marking period">
                {(() => { const base = avg ?? studentAverage(s, child.id) ?? 70; const pts = [{ l: '2025/26 Sem 2', v: Math.max(40, base - 3) }, { l: 'MP1 2026/27', v: Math.max(40, base - 1.5) }, { l: 'MP2 2026/27', v: base }]; return <div className="space-y-3">{pts.map((p) => <div key={p.l}><div className="flex justify-between text-sm"><span>{p.l}</span><span>{Math.round(p.v * 10) / 10}%</span></div><Meter value={p.v} /></div>)}</div>; })()}
              </Card>
            )}
          </>
        );
      }}
    </Page>
  );
}

export function ExamResults() {
  return (
    <Page title="Examination Results">
      {({ s, child }) => (
        <Card subtitle="Results are shown after the Principal approves the subject gradebook.">
          <Table head={['Subject', 'Midterm', 'Final exam', 'Subject total', 'Status']}>
            {subjectTotals(s, child.id).map((r) => { const pub = r.status === 'approved'; return <tr key={r.subject}><td className="font-medium">{r.subject}</td><td>{pub ? r.marks?.midterm ?? '—' : '—'}</td><td>{pub ? r.marks?.final ?? '—' : '—'}</td><td className="font-semibold">{pub ? r.total ?? '—' : '—'}</td><td><Pill tone={pub ? 'success' : 'muted'}>{pub ? 'Published' : 'Awaiting approval'}</Pill></td></tr>; })}
          </Table>
        </Card>
      )}
    </Page>
  );
}

export function ParentReportCards() {
  return <Page title="Report Cards">{({ child }) => <ReleasedReportCard studentId={child.id} />}</Page>;
}

export function ChildTimetable() {
  return <Page title="Class Timetable">{({ child }) => <Card><SectionTimetable grade={child.grade} section={child.section} /></Card>}</Page>;
}

export function TeacherCommunication() {
  const { me, s, ids, id, child, setId } = useChild();
  const threads = s.threads.filter((t) => t.parentUserId === me.id);
  const [active, setActive] = useState<string | null>(threads[0]?.id ?? null);
  const [reply, setReply] = useState('');
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ staffId: '', subject: '', text: '' });
  const thread = threads.find((t) => t.id === active);
  const contacts = [
    ...[...new Set(s.assignments.filter((a) => a.grade === child?.grade && a.section === child?.section && a.teacherId).map((a) => a.teacherId))].map((tid) => ({ id: tid, label: `${staffName(s, tid)} — ${s.assignments.filter((a) => a.teacherId === tid && a.grade === child?.grade && a.section === child?.section).map((a) => a.subject).join(', ')}` })),
    ...[['u1', 'Principal'], ['u3', 'Dean of Students'], ['u8', 'Finance Director'], ['u4', 'Registrar']].map(([sid, r]) => ({ id: sid, label: `${staffName(s, sid)} — ${r}` })),
  ];
  if (!s.school.parentTeacherMessaging) return <div className="space-y-6"><Header title="Teacher Communication" /><Notice tone="warning">The school has turned off parent–teacher messaging. You will still receive official messages from the school.</Notice></div>;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Teacher Communication" subtitle="Messages with your children's teachers and school offices, under the school's communication policy." action={<button type="button" className="btn-primary" onClick={() => setCompose(true)}>New message</button>} />
      <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        <Card>{threads.length === 0 ? <p className="text-sm text-navy-500">No conversations yet.</p> : threads.map((t) => <button key={t.id} type="button" onClick={() => setActive(t.id)} className={`w-full text-left p-2.5 rounded-lg ${active === t.id ? 'bg-navy-50' : ''}`}><p className="text-sm font-medium">{t.staffName}</p><p className="text-xs text-navy-500">{t.subject} · {studentById(s, t.studentId)?.firstName}</p></button>)}</Card>
        <Card title={thread ? `${thread.staffName} — ${thread.subject}` : 'Select a conversation'}>
          {thread && <>
            <div className="space-y-3 max-h-96 overflow-y-auto">{thread.messages.map((m, i) => <div key={i} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.from === 'parent' ? 'ml-auto bg-navy-700 text-white' : 'bg-navy-50'}`}>{m.text}<p className="text-[10px] opacity-70 mt-1">{fmtDate(m.at)}</p></div>)}</div>
            <div className="flex gap-2 mt-4"><input className="input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" aria-label="Reply" /><button type="button" className="btn-primary" disabled={!reply.trim()} onClick={() => { actions.sendMessage(thread.id, { parentUserId: me.id, staffId: thread.staffId, staffName: thread.staffName, studentId: thread.studentId, subject: thread.subject, from: 'parent', text: reply.trim() }); setReply(''); }}>Send</button></div>
          </>}
        </Card>
      </div>
      <Dialog open={compose} onClose={() => setCompose(false)} title="New message" footer={<><button type="button" className="btn-secondary" onClick={() => setCompose(false)}>Cancel</button><button type="button" className="btn-primary" disabled={!form.staffId || !form.subject || !form.text} onClick={() => { actions.sendMessage(null, { parentUserId: me.id, staffId: form.staffId, staffName: staffName(s, form.staffId), studentId: id, subject: form.subject, from: 'parent', text: form.text }); setCompose(false); setForm({ staffId: '', subject: '', text: '' }); }}>Send</button></>}>
        <div className="space-y-3">
          <Field label="About"><select className="input" value={id} onChange={(e) => setId(e.target.value)}>{ids.map((x) => <option key={x} value={x}>{studentById(s, x)?.name}</option>)}</select></Field>
          <Field label="To"><select className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}><option value="">Select</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
          <Field label="Subject"><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Message"><textarea className="input min-h-[100px]" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></Field>
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------ Fees & payment ------------------------------ */

const METHODS = [
  { id: 'visa', label: 'Visa', detail: '•••• 4417 · saved', icon: CreditCard, brand: 'bg-gradient-to-br from-navy-700 to-navy-900 text-white' },
  { id: 'mc', label: 'Mastercard', detail: '•••• 9021 · saved', icon: CreditCard, brand: 'bg-gradient-to-br from-accent-500 to-error-600 text-white' },
  { id: 'momo', label: 'MTN Mobile Money', detail: '+231 88 ••• 7781', icon: Smartphone, brand: 'bg-gradient-to-br from-accent-300 to-accent-500 text-navy-900' },
  { id: 'orange', label: 'Orange Money', detail: '+231 77 ••• 4567', icon: Smartphone, brand: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' },
];

export function FeesAndPayment() {
  const { me, s, ids, id, child, setId } = useChild();
  const [mode, setMode] = useState<'statement' | 'card' | 'bank'>('statement');
  const [method, setMethod] = useState('visa');
  const [full, setFull] = useState(true);
  const [partial, setPartial] = useState('');
  const [agree, setAgree] = useState(false);
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');
  const [receipt, setReceipt] = useState('');
  if (!child) return null;
  const a = feeAccount(s, id);
  const amount = full ? a.balance : Math.min(Number(partial) || 0, a.balance);
  const pay = () => {
    setStage('processing');
    setTimeout(() => { setReceipt(actions.recordPayment({ studentId: id, amount, method: 'Card (demo)', reference: `DEMO-${METHODS.find((m) => m.id === method)?.label.toUpperCase().replace(/\s/g, '')}`, by: `${me.name} (online)` })); setStage('done'); }, 1400);
  };
  const slip = () => printHtml('Bank deposit slip', `<div class="box"><h1>${esc(s.school.bank.bank)}</h1><p class="muted">${esc(s.school.bank.branch)}</p><h2>SCHOOL FEES DEPOSIT SLIP</h2>
    <table><tr><th>Account name</th><td>${esc(s.school.bank.accountName)}</td></tr><tr><th>Account number</th><td><b>${esc(s.school.bank.accountNo)}</b></td></tr><tr><th>SWIFT</th><td>${esc(s.school.bank.swift)}</td></tr>
    <tr><th>Student name</th><td>${esc(child.name)}</td></tr><tr><th>Student ID (payment reference)</th><td><b>${esc(child.studentNo)}</b></td></tr><tr><th>Class</th><td>${esc(className(child.grade, child.section))}</td></tr>
    <tr><th>Amount</th><td>${esc(money(a.balance))} (outstanding balance)</td></tr><tr><th>Depositor</th><td>${esc(me.name)}</td></tr><tr><th>Date</th><td>____________________</td></tr></table>
    <p class="muted" style="margin-top:16px">Write the Student ID as the reference. Bring the bank-stamped slip to the Finance Office or keep it for your records; the payment is recorded once the school confirms it.</p></div>`);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Fee Statement and Payment" subtitle={`${child.name} · ${className(child.grade, child.section)} · ${s.school.academicYear}`} />
      <ChildSwitcher ids={ids} id={id} setId={(v) => { setId(v); setStage('form'); setMode('statement'); }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total fees charged" value={money(a.charged)} />
        <Stat label="Amount paid" value={money(a.paid + a.concessions)} sub={a.concessions ? `incl. ${money(a.concessions)} scholarship/discount` : undefined} tone="success" />
        <Stat label="Outstanding balance" value={money(a.balance)} tone={a.balance ? 'error' : 'success'} />
        {a.overdueSince ? <Stat label="Payment overdue" value={<span className="text-base">Since {fmtDate(a.overdueSince)}</span>} sub={`Next deadline ${fmtDate(a.nextDue)}`} tone="error" /> : <Stat label="Next deadline" value={<span className="text-base">{a.balance ? fmtDate(a.nextDue) : 'None — fully paid'}</span>} tone="warning" />}
      </div>
      <Tabs tabs={[{ id: 'statement', label: 'Statement' }, { id: 'card', label: 'Pay online' }, { id: 'bank', label: 'Pay at the bank' }]} value={mode} onChange={(m) => { setMode(m); setStage('form'); }} />
      {mode === 'statement' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Fees charged"><Table head={['Item', 'Amount']}>{a.structure?.items.map((i) => <tr key={i.name}><td>{i.name}</td><td>{money(i.amount)}</td></tr>)}<tr className="font-semibold"><td>Total</td><td>{money(a.charged)}</td></tr></Table></Card>
          <Card title="Payment deadlines"><Table head={['Instalment', 'Due', 'Amount', 'Status']}>{a.structure?.instalments.map((i) => { const cumulative = a.structure!.instalments.filter((x) => x.due <= i.due).reduce((p, x) => p + x.percent, 0) / 100 * (a.charged - a.concessions); const met = a.paid >= cumulative - 0.5; return <tr key={i.label}><td>{i.label}</td><td>{fmtDate(i.due)}</td><td>{money(Math.round((i.percent / 100) * (a.charged - a.concessions)))}</td><td>{met ? <Pill tone="success">Covered</Pill> : i.due < today ? <Pill tone="error">Overdue</Pill> : <Pill tone="muted">Upcoming</Pill>}</td></tr>; })}</Table></Card>
          <Card title="Receipts" className="lg:col-span-2"><Table head={['Date', 'Receipt', 'Method', 'Amount', '']} empty="No payments recorded yet.">{a.payments.map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{p.method}</td><td>{money(p.amount)}</td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => printReceipt(s, p)}><Printer className="w-3.5 h-3.5" /> Download receipt</button></td></tr>)}</Table></Card>
        </div>
      )}
      {mode === 'card' && (stage !== 'done' && a.balance <= 0 ? <Notice tone="success">{child.firstName}'s fees are fully paid. Thank you!</Notice> : stage === 'done' ? (
        <Card>
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-success-600 mx-auto" />
            <h2 className="text-xl font-bold text-navy-900 mt-3">Demo payment complete</h2>
            <p className="text-sm text-navy-600 mt-1">Receipt {receipt}. {child.firstName}'s new balance is {money(feeAccount(s, id).balance)}. The Finance Office has been notified.</p>
            <p className="text-xs text-navy-400 mt-2">This was a demonstration — no money moved. Live payments will go through a licensed payment provider.</p>
            <div className="flex justify-center gap-2 mt-4"><button type="button" className="btn-secondary" onClick={() => { const p = s.payments.find((x) => x.receiptNo === receipt); if (p) printReceipt(s, p); }}><Printer className="w-4 h-4" /> Receipt</button><button type="button" className="btn-primary" onClick={() => { setStage('form'); setMode('statement'); }}>Back to statement</button></div>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <Card title="Choose a payment method">
            <div className="grid sm:grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)} aria-pressed={method === m.id} className={`relative rounded-2xl p-4 text-left h-28 flex flex-col justify-between transition-all ${m.brand} ${method === m.id ? 'ring-4 ring-navy-400 ring-offset-2 scale-[1.01]' : 'opacity-80 hover:opacity-100'}`}>
                  <m.icon className="w-6 h-6" />
                  <span><span className="block font-semibold">{m.label}</span><span className="block text-xs opacity-90">{m.detail}</span></span>
                  {method === m.id && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5" />}
                </button>
              ))}
            </div>
            <button type="button" className="mt-3 text-sm text-navy-500 cursor-not-allowed" disabled title="New cards are added on the payment provider's secure page once live payments are enabled.">+ Add payment method (available when live payments are enabled)</button>
            <div className="mt-5 space-y-3">
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={full} onChange={() => setFull(true)} /> Pay full balance — {money(a.balance)}</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={!full} onChange={() => setFull(false)} /> Pay part of the balance</label>
              {!full && <input type="number" className="input max-w-xs" placeholder="Amount (US$)" value={partial} onChange={(e) => setPartial(e.target.value)} aria-label="Partial amount" />}
            </div>
          </Card>
          <Card title="Summary">
            <dl className="text-sm space-y-2">
              {[['School', s.school.name], ['Student', child.name], ['Student ID', child.studentNo], ['Fee', 'School fees ' + s.school.academicYear], ['Outstanding', money(a.balance)]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-navy-500">{k}</dt><dd className="text-right">{v}</dd></div>)}
              <div className="flex justify-between gap-3 border-t border-navy-100 pt-2 text-base font-bold"><dt>Paying now</dt><dd>{money(amount)}</dd></div>
            </dl>
            <div className="rounded-lg bg-navy-50 p-3 mt-4 text-xs text-navy-600 flex gap-2"><Lock className="w-4 h-4 shrink-0" /> Card details are never stored by the school. Live payments will be processed on the payment provider's secure page.</div>
            <label className="flex items-start gap-2 text-sm mt-3"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" /> I agree to the school's fee payment terms.</label>
            <button type="button" className="btn-primary w-full mt-4" disabled={!agree || amount <= 0 || stage === 'processing'} onClick={pay}>{stage === 'processing' ? 'Processing…' : `Pay ${money(amount)} (demo)`}</button>
            <p className="text-[11px] text-navy-400 mt-2 text-center">Demonstration checkout — no money is charged.</p>
          </Card>
        </div>
      ))}
      {mode === 'bank' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="School bank account">
            <dl className="text-sm divide-y divide-navy-100">{[['Bank', s.school.bank.bank], ['Account name', s.school.bank.accountName], ['Account number', s.school.bank.accountNo], ['Branch', s.school.bank.branch], ['SWIFT', s.school.bank.swift], ['Payment reference', child.studentNo]].map(([k, v]) => <div key={k} className="grid grid-cols-[150px_1fr] py-2"><dt className="text-navy-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          </Card>
          <Card title="Deposit slip">
            <Building2 className="w-8 h-8 text-navy-400" />
            <p className="text-sm text-navy-600 mt-2">Download a pre-filled deposit slip for {child.firstName} ({money(a.balance)}), take it to any {s.school.bank.bank} branch, and use the Student ID as the reference. The Finance Office records the payment once confirmed and you receive a receipt here.</p>
            <button type="button" className="btn-primary mt-4" onClick={slip}><Printer className="w-4 h-4" /> Download / print bank slip</button>
          </Card>
        </div>
      )}
    </div>
  );
}

export function ParentPaymentHistory() {
  const { s, ids } = useChild();
  const list = s.payments.filter((p) => ids.includes(p.studentId)).slice().reverse();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Payment History" subtitle={`${list.length} payments · ${money(list.reduce((a, p) => a + p.amount, 0))} across your children`} />
      <Card><Table head={['Date', 'Child', 'Receipt', 'Method', 'Amount', '']}>{list.map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td>{studentById(s, p.studentId)?.name}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{p.method}</td><td className="font-medium">{money(p.amount)}</td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => printReceipt(s, p)}><Printer className="w-3.5 h-3.5" /> Receipt</button></td></tr>)}</Table></Card>
    </div>
  );
}

export function ParentProfile() {
  const { me, s, ids } = useChild();
  const [prefs, setPrefs] = useState({ results: true, attendance: true, fees: true, messages: true });
  const [req, setReq] = useState({ name: '', no: '' });
  const [sent, setSent] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Profile and Settings" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="My profile"><dl className="text-sm divide-y divide-navy-100">{[['Name', me.name], ['Email', me.email], ['Phone', studentById(s, ids[0])?.guardianPhone ?? '—']].map(([k, v]) => <div key={k} className="grid grid-cols-[100px_1fr] py-2"><dt className="text-navy-500">{k}</dt><dd>{v}</dd></div>)}</dl><p className="text-xs text-navy-400 mt-3">To change these details, contact the Registrar's office.</p></Card>
        <Card title="Notify me about">{([['results', 'Results and report cards'], ['attendance', 'Absences and late arrivals'], ['fees', 'Fee deadlines and receipts'], ['messages', 'Messages from teachers']] as const).map(([k, l]) => <label key={k} className="flex justify-between text-sm py-1.5"><span>{l}</span><input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} /></label>)}</Card>
        <Card title="Linked children">{ids.map((x) => { const st = studentById(s, x)!; return <p key={x} className="text-sm py-1">{st.name} · {className(st.grade, st.section)} <Pill tone="success">Verified</Pill></p>; })}</Card>
        <Card title="Request to link another child">
          {sent ? <Notice tone="success">Request sent to the Registrar. Bring your ID and the child's birth certificate to the school for verification.</Notice> : <div className="space-y-3"><input className="input" placeholder="Child's full name" value={req.name} onChange={(e) => setReq({ ...req, name: e.target.value })} aria-label="Child name" /><input className="input" placeholder="Student ID (if known)" value={req.no} onChange={(e) => setReq({ ...req, no: e.target.value })} aria-label="Student ID" /><button type="button" className="btn-primary" disabled={!req.name} onClick={() => { actions.notifyRoles(['registrar'], `Guardian link request from ${me.name}`, `Requests access to ${req.name}${req.no ? ` (${req.no})` : ''}. Verify identity and relationship before linking.`, 'guardians'); setSent(true); }}>Send request</button></div>}
        </Card>
      </div>
    </div>
  );
}
