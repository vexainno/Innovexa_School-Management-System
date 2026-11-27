import { useState } from 'react';
import { AlertTriangle, Award, CalendarX, ClipboardList, Download, Gavel, MessageSquare, Repeat, ShieldAlert } from 'lucide-react';
import {
  actions, activeStudents, attendanceSummary, className, fmtDate, schoolDays, studentById, useSchool,
} from '@/store/store';
import type { Incident } from '@/store/types';
import { downloadCsv } from '@/store/files';
import { Card, Dialog, Field, Header, Notice, Pill, SearchBox, StackedBars, Stat, Table, Tabs } from '@/components/kit';
import { StudentProfileDialog } from './common';
import { ContactLinks, greeting, useMe, type PageProps } from './shared';

const STATUS_LABEL: Record<Incident['status'], string> = {
  new: 'New', under_review: 'Under review', investigating: 'Investigating', resolved: 'Resolved', referred_principal: 'Referred to Principal', referred_counselor: 'Referred to Counselor',
};
const statusTone = (s: Incident['status']) => (s === 'new' ? 'error' : s === 'resolved' ? 'success' : s === 'referred_principal' ? 'accent' : 'warning');
const sevTone = (s: Incident['severity']) => (s === 'serious' ? 'error' : s === 'moderate' ? 'warning' : 'navy');

function useDean() {
  const s = useSchool();
  const days = schoolDays(20);
  const chronic = activeStudents(s).map((x) => ({ x, a: attendanceSummary([x.id], days) })).filter((r) => r.a.absent >= 3 || r.a.late >= 4).sort((a, b) => b.a.absent - a.a.absent);
  const counts = new Map<string, number>();
  s.incidents.forEach((i) => counts.set(i.studentId, (counts.get(i.studentId) ?? 0) + 1));
  return { s, chronic, counts, repeat: [...counts.entries()].filter(([, n]) => n >= 2) };
}

export function DeanOverview({ onNavigate }: PageProps) {
  const me = useMe();
  const { s, chronic, repeat } = useDean();
  const fresh = s.incidents.filter((i) => i.status === 'new');
  const open = s.incidents.filter((i) => !['resolved'].includes(i.status));
  const byCat = [...new Set(s.incidents.map((i) => i.category))].map((c) => ({ label: c, values: (['minor', 'moderate', 'serious'] as const).map((sv) => s.incidents.filter((i) => i.category === c && i.severity === sv).length) }));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · Dean of Students`} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="New incident reports" value={fresh.length} sub="From teachers, awaiting your review" icon={<AlertTriangle className="w-5 h-5" />} tone="error" onClick={() => onNavigate('incident-reports')} />
        <Stat label="Open disciplinary cases" value={open.length} icon={<Gavel className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('disciplinary-cases')} />
        <Stat label="Repeated cases" value={repeat.length} sub="Students with 2+ incidents" icon={<Repeat className="w-5 h-5" />} onClick={() => onNavigate('student-conduct')} />
        <Stat label="Persistent attendance problems" value={chronic.length} icon={<CalendarX className="w-5 h-5" />} tone="accent" onClick={() => onNavigate('attendance-monitoring')} />
        <Stat label="Student complaints" value={s.complaints.filter((c) => c.status !== 'resolved').length} icon={<MessageSquare className="w-5 h-5" />} onClick={() => onNavigate('complaints')} />
        <Stat label="Referred to Principal" value={s.incidents.filter((i) => i.status === 'referred_principal').length} icon={<ShieldAlert className="w-5 h-5" />} tone="error" onClick={() => onNavigate('disciplinary-cases')} />
        <Stat label="Student leaders" value={s.leadership.length} icon={<Award className="w-5 h-5" />} tone="success" onClick={() => onNavigate('leadership')} />
        <Stat label="Follow-up actions due" value={s.followUps.filter((f) => !f.done).length} icon={<ClipboardList className="w-5 h-5" />} onClick={() => onNavigate('follow-ups')} />
      </div>
      <div className="grid xl:grid-cols-2 gap-6">
        <Card title="Latest incident reports" action={<button type="button" className="text-sm text-navy-600 hover:underline" onClick={() => onNavigate('incident-reports')}>All reports</button>}>
          <Table head={['Student', 'Category', 'Severity', 'Status']}>{s.incidents.slice(0, 6).map((i) => { const st = studentById(s, i.studentId); return <tr key={i.id} className="cursor-pointer" onClick={() => onNavigate(`disciplinary-cases:${i.id}`)}><td className="font-medium">{st?.name}<p className="text-xs text-navy-500">{st && className(st.grade, st.section)} · {i.reportedByName}</p></td><td>{i.category}</td><td><Pill tone={sevTone(i.severity)}>{i.severity}</Pill></td><td><Pill tone={statusTone(i.status)}>{STATUS_LABEL[i.status]}</Pill></td></tr>; })}</Table>
        </Card>
        <Card title="Incidents by category"><StackedBars rows={byCat} series={[{ name: 'Minor', color: '#8ba9d8' }, { name: 'Moderate', color: '#d97706' }, { name: 'Serious', color: '#dc2626' }]} /></Card>
      </div>
    </div>
  );
}

function CaseDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useSchool();
  const me = useMe();
  const inc = s.incidents.find((i) => i.id === id);
  const [note, setNote] = useState('');
  const [resp, setResp] = useState(inc?.studentResponse ?? '');
  const [outcome, setOutcome] = useState(inc?.outcome ?? '');
  const [act, setAct] = useState(inc?.action ?? '');
  if (!inc) return null;
  const st = studentById(s, inc.studentId);
  const save = (status?: Incident['status'], label?: string) => actions.updateIncident(inc.id, { studentResponse: resp, outcome, action: act, ...(status ? { status } : {}) }, me.name, label ?? 'Case details updated');
  return (
    <Dialog open onClose={onClose} wide="xl" title={`Case — ${st?.name} · ${inc.category}`} footer={<>
      <button type="button" className="btn-secondary" onClick={() => { save(); onClose(); }}>Save</button>
      <button type="button" className="btn-secondary" onClick={() => { save('referred_counselor', 'Referred to the Guidance Counselor'); onClose(); }}>Refer to Counselor</button>
      <button type="button" className="btn-danger" onClick={() => { save('referred_principal', 'Serious case referred to the Principal'); onClose(); }}>Refer to Principal</button>
      <button type="button" className="btn-primary" disabled={!outcome.trim()} onClick={() => { save('resolved', `Case closed: ${outcome}`); onClose(); }}>Record outcome and close</button>
    </>}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2"><Pill tone={sevTone(inc.severity)}>{inc.severity}</Pill><Pill tone={statusTone(inc.status)}>{STATUS_LABEL[inc.status]}</Pill>{st && <Pill>{className(st.grade, st.section)}</Pill>}</div>
          <div><h3 className="text-sm font-semibold text-navy-900">1. Teacher's report</h3><p className="text-sm text-navy-700 mt-1">{inc.description}</p><p className="text-xs text-navy-500 mt-1">{inc.reportedByName} · {inc.location} · {fmtDate(inc.reportedAt)}</p></div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900">2. Investigation (confidential)</h3>
            <ul className="text-sm space-y-1 mt-1">{inc.investigation.map((n, i) => <li key={i}>• {n.action} <span className="text-xs text-navy-400">— {n.by}, {fmtDate(n.at)}</span></li>)}</ul>
            <div className="flex gap-2 mt-2"><input className="input py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add investigation note…" aria-label="Investigation note" /><button type="button" className="btn-secondary text-sm" disabled={!note.trim()} onClick={() => { actions.addInvestigationNote(inc.id, note.trim(), me.name); setNote(''); }}>Add</button></div>
          </div>
          <Field label="3. Student's response"><textarea className="input min-h-[70px]" value={resp} onChange={(e) => setResp(e.target.value)} /></Field>
          <Field label="4. Outcome / decision"><textarea className="input min-h-[70px]" value={outcome} onChange={(e) => setOutcome(e.target.value)} /></Field>
          <Field label="Action taken"><select className="input" value={act} onChange={(e) => setAct(e.target.value)}><option value="">—</option>{['Verbal warning', 'Written warning', 'Detention', 'Parent conference', 'Community service', 'Suspension (Principal approval)', 'No action'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inc.parentVisible} onChange={(e) => actions.updateIncident(inc.id, { parentVisible: e.target.checked }, me.name, e.target.checked ? 'Outcome shared with parent' : 'Hidden from parent')} /> Share the outcome with the student's guardian (per school policy)</label>
        </div>
        <div className="space-y-4">
          {st && <Card title="Guardian"><p className="text-sm">{st.guardianName} ({st.guardianRelation})</p><ContactLinks phone={st.guardianPhone} email={st.guardianEmail} /></Card>}
          <Card title="Case history"><ul className="text-sm space-y-1.5">{inc.history.slice().reverse().map((h, i) => <li key={i}><span className="text-xs text-navy-400">{fmtDate(h.at)}</span> · {h.action} <span className="text-navy-500">— {h.by}</span></li>)}</ul></Card>
          <Card title="Other incidents for this student"><ul className="text-sm space-y-1">{s.incidents.filter((x) => x.studentId === inc.studentId && x.id !== inc.id).map((x) => <li key={x.id}>{fmtDate(x.reportedAt)} — {x.category} ({STATUS_LABEL[x.status]})</li>)}</ul></Card>
        </div>
      </div>
    </Dialog>
  );
}

export function DisciplinaryCases({ param }: PageProps) {
  const s = useSchool();
  const [open, setOpen] = useState<string | null>(param ?? null);
  const [tab, setTab] = useState<'open' | 'principal' | 'closed'>('open');
  const list = s.incidents.filter((i) => (tab === 'open' ? !['resolved', 'referred_principal'].includes(i.status) : tab === 'principal' ? i.status === 'referred_principal' : i.status === 'resolved'));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Disciplinary Cases" subtitle="Investigate, record the student's response and the outcome. Every step is kept in the case history." />
      <Tabs tabs={[{ id: 'open', label: 'Open cases', count: s.incidents.filter((i) => !['resolved', 'referred_principal'].includes(i.status)).length }, { id: 'principal', label: 'With the Principal' }, { id: 'closed', label: 'Closed' }]} value={tab} onChange={setTab} />
      <Card>
        <Table head={['Reported', 'Student', 'Category', 'Severity', 'Reported by', 'Status', '']}>
          {list.map((i) => { const st = studentById(s, i.studentId); return <tr key={i.id}><td className="text-xs">{fmtDate(i.reportedAt)}</td><td className="font-medium">{st?.name}<p className="text-xs text-navy-500">{st && className(st.grade, st.section)}</p></td><td>{i.category}</td><td><Pill tone={sevTone(i.severity)}>{i.severity}</Pill></td><td className="text-xs">{i.reportedByName}</td><td><Pill tone={statusTone(i.status)}>{STATUS_LABEL[i.status]}</Pill></td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => setOpen(i.id)}>Open case</button></td></tr>; })}
        </Table>
      </Card>
      <CaseDialog key={open ?? ''} id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function IncidentReports() {
  const s = useSchool();
  const me = useMe();
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ studentId: '', category: 'Disruptive behaviour', severity: 'minor' as Incident['severity'], location: '', description: '' });
  const hits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const fresh = s.incidents.filter((i) => i.status === 'new');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Incident Reports" subtitle="Reports submitted by teachers, plus misconduct you record yourself." />
      <Card title={`New reports from teachers (${fresh.length})`}>
        <Table head={['Received', 'Student', 'Category', 'Severity', 'From', '']} empty="No new reports.">
          {fresh.map((i) => { const st = studentById(s, i.studentId); return <tr key={i.id}><td className="text-xs">{fmtDate(i.reportedAt)}</td><td className="font-medium">{st?.name}</td><td>{i.category}</td><td><Pill tone={sevTone(i.severity)}>{i.severity}</Pill></td><td className="text-xs">{i.reportedByName}</td><td><button type="button" className="btn-primary text-xs py-1.5" onClick={() => { actions.updateIncident(i.id, { status: 'under_review' }, me.name, 'Opened and reviewed by the Dean'); setOpen(i.id); }}>Review</button></td></tr>; })}
        </Table>
      </Card>
      <Card title="Record a misconduct incident">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <SearchBox value={q} onChange={setQ} placeholder="Find student" />
            {hits.map((x) => <button key={x.id} type="button" className={`block w-full text-left text-sm p-1.5 rounded ${form.studentId === x.id ? 'bg-navy-100' : 'hover:bg-navy-50'}`} onClick={() => setForm({ ...form, studentId: x.id })}>{x.name} · {className(x.grade, x.section)}</button>)}
            {form.studentId && <p className="text-sm">Student: <b>{studentById(s, form.studentId)?.name}</b></p>}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3"><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label="Category">{['Disruptive behaviour', 'Fighting', 'Bullying', 'Truancy', 'Academic dishonesty', 'Disrespect to staff', 'Uniform violation', 'Damage to property', 'Other'].map((c) => <option key={c}>{c}</option>)}</select><select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Incident['severity'] })} aria-label="Severity"><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="serious">Serious</option></select></div>
            <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} aria-label="Location" />
            <textarea className="input min-h-[80px]" placeholder="What happened" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
            <button type="button" className="btn-primary w-full" disabled={!form.studentId || form.description.length < 10} onClick={() => { actions.recordIncidentByDean(form, me.name); setForm({ ...form, studentId: '', location: '', description: '' }); setQ(''); }}>Record incident</button>
          </div>
        </div>
      </Card>
      <CaseDialog key={open ?? ''} id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function StudentConduct() {
  const { s, counts } = useDean();
  const [open, setOpen] = useState<string | null>(null);
  const rows = [...counts.entries()].map(([id, n]) => ({ st: studentById(s, id)!, n, last: s.incidents.filter((i) => i.studentId === id)[0] })).filter((r) => r.st).sort((a, b) => b.n - a.n);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Conduct" subtitle="Conduct records for students with at least one incident. Repeated cases are flagged." />
      <Card>
        <Table head={['Student', 'Class', 'Incidents', 'Most recent', 'Flag', '']}>
          {rows.map((r) => <tr key={r.st.id}><td className="font-medium">{r.st.name}</td><td>{className(r.st.grade, r.st.section)}</td><td>{r.n}</td><td className="text-sm">{r.last?.category} · {fmtDate(r.last?.reportedAt)}</td><td>{r.n >= 2 ? <Pill tone="error">Repeated</Pill> : <Pill tone="muted">Single</Pill>}</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setOpen(r.st.id)}>Profile</button></td></tr>)}
        </Table>
      </Card>
      <StudentProfileDialog studentId={open} onClose={() => setOpen(null)} showFees={false} />
    </div>
  );
}

export function AttendanceMonitoring() {
  const { chronic } = useDean();
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Attendance Monitoring" subtitle="Students with persistent absence (3+ in 20 school days) or repeated lateness (4+)." />
      <Card>
        <Table head={['Student', 'Class', 'Absent', 'Late', 'Rate', 'Guardian', '']}>
          {chronic.map(({ x, a }) => <tr key={x.id}><td className="font-medium">{x.name}</td><td>{className(x.grade, x.section)}</td><td>{a.absent}</td><td>{a.late}</td><td>{a.rate}%</td><td><ContactLinks phone={x.guardianPhone} /></td><td>{sent.includes(x.id) ? <Pill tone="success">Parent notified</Pill> : <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => { actions.notifyParent(x.id, 'Message from the Dean of Students: attendance concern', `${x.firstName} has missed ${a.absent} day(s) and arrived late ${a.late} time(s) in the last 20 school days. Please contact the Dean's office.`); setSent([...sent, x.id]); }}>Notify parent</button>}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

export function StudentComplaints() {
  const s = useSchool();
  const [resp, setResp] = useState<Record<string, string>>({});
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Complaints" subtitle="Concerns raised by students. Respond and track until resolved." />
      <div className="space-y-4">
        {s.complaints.map((c) => { const st = studentById(s, c.studentId); return (
          <Card key={c.id} title={c.subject} subtitle={`${st?.name} · ${st && className(st.grade, st.section)} · ${fmtDate(c.date)}`} action={<Pill tone={c.status === 'resolved' ? 'success' : c.status === 'in_review' ? 'warning' : 'error'}>{c.status.replace('_', ' ')}</Pill>}>
            <p className="text-sm text-navy-700">{c.detail}</p>
            {c.response && <p className="text-sm mt-2"><b>Response:</b> {c.response}</p>}
            {c.status !== 'resolved' && <div className="flex flex-wrap gap-2 mt-3"><input className="input py-2 text-sm flex-1 min-w-[200px]" placeholder="Response / action taken" value={resp[c.id] ?? ''} onChange={(e) => setResp({ ...resp, [c.id]: e.target.value })} aria-label="Response" /><button type="button" className="btn-secondary text-sm" onClick={() => actions.setComplaint(c.id, { status: 'in_review', response: resp[c.id] || c.response })}>Mark in review</button><button type="button" className="btn-primary text-sm" disabled={!(resp[c.id] || c.response)} onClick={() => actions.setComplaint(c.id, { status: 'resolved', response: resp[c.id] || c.response })}>Resolve</button></div>}
          </Card>
        ); })}
      </div>
    </div>
  );
}

export function StudentLeadership() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [pick, setPick] = useState('');
  const [title, setTitle] = useState('Class Monitor');
  const hits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Leadership" subtitle="Prefects, monitors and student council records." />
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <Card><Table head={['Position', 'Student', 'Class', 'Since', '']}>{s.leadership.map((l) => { const st = studentById(s, l.studentId); return <tr key={l.id}><td className="font-medium">{l.title}</td><td>{st?.name}</td><td>{st && className(st.grade, st.section)}</td><td>{fmtDate(l.since)}</td><td><button type="button" className="text-sm text-error-600 hover:underline" onClick={() => actions.removeLeadership(l.id)}>Remove</button></td></tr>; })}</Table></Card>
        <Card title="Appoint">
          <div className="space-y-3">
            <SearchBox value={q} onChange={setQ} placeholder="Find student" />
            {hits.map((x) => <button key={x.id} type="button" className={`block w-full text-left text-sm p-1.5 rounded ${pick === x.id ? 'bg-navy-100' : 'hover:bg-navy-50'}`} onClick={() => setPick(x.id)}>{x.name} · {className(x.grade, x.section)}</button>)}
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Position" />
            <button type="button" className="btn-primary w-full" disabled={!pick || !title} onClick={() => { actions.setLeadership(pick, title); setPick(''); setQ(''); }}>Appoint</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ParentNotifications() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [pick, setPick] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ok, setOk] = useState(false);
  const hits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const sent = s.notifications.filter((n) => n.title.startsWith('Message from the Dean'));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Parent Notifications" subtitle="Send a private notice to one student's linked guardian(s). Not every incident should be shared — follow school policy." />
      {ok && <Notice tone="success">Notification sent to the guardian's account.</Notice>}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="New notice">
          <div className="space-y-3">
            <SearchBox value={q} onChange={setQ} placeholder="Find student" />
            {hits.map((x) => <button key={x.id} type="button" className={`block w-full text-left text-sm p-1.5 rounded ${pick === x.id ? 'bg-navy-100' : 'hover:bg-navy-50'}`} onClick={() => setPick(x.id)}>{x.name} · guardian {x.guardianName}{!x.parentLinked && ' (no linked account)'}</button>)}
            <input className="input" placeholder="Subject" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Subject" />
            <textarea className="input min-h-[100px]" placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" />
            {pick && !studentById(s, pick)?.parentLinked && <Notice tone="warning">This guardian has no linked parent account. Contact them by phone: {studentById(s, pick)?.guardianPhone}</Notice>}
            <button type="button" className="btn-primary w-full" disabled={!pick || !title || !body} onClick={() => { actions.notifyParent(pick, `Message from the Dean of Students: ${title}`, body); setOk(true); setTitle(''); setBody(''); setPick(''); setQ(''); }}>Send to guardian</button>
          </div>
        </Card>
        <Card title="Sent notices"><Table head={['Date', 'Student', 'Subject']}>{sent.map((n) => <tr key={n.id}><td className="text-xs">{fmtDate(n.createdAt)}</td><td>{studentById(s, n.toStudentIds?.[0] ?? '')?.name}</td><td className="text-sm">{n.title.replace('Message from the Dean of Students: ', '')}</td></tr>)}</Table></Card>
      </div>
    </div>
  );
}

export function WelfareReports() {
  const s = useSchool();
  const stamp = new Date().toISOString().slice(0, 10);
  const cats = [...new Set(s.incidents.map((i) => i.category))];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Welfare Reports" action={<button type="button" className="btn-primary text-sm" onClick={() => downloadCsv(`Welfare_report_${stamp}`, ['Date', 'Student', 'Class', 'Category', 'Severity', 'Status', 'Action', 'Outcome'], s.incidents.map((i) => { const st = studentById(s, i.studentId); return [i.reportedAt.slice(0, 10), st?.name, st ? className(st.grade, st.section) : '', i.category, i.severity, STATUS_LABEL[i.status], i.action ?? '', i.outcome ?? '']; }))}><Download className="w-4 h-4" /> Download</button>} />
      <div className="grid sm:grid-cols-4 gap-4"><Stat label="Total incidents" value={s.incidents.length} /><Stat label="Serious" value={s.incidents.filter((i) => i.severity === 'serious').length} tone="error" /><Stat label="Resolved" value={s.incidents.filter((i) => i.status === 'resolved').length} tone="success" /><Stat label="Complaints" value={s.complaints.length} /></div>
      <Card title="Incidents by category and status"><Table head={['Category', 'Total', 'Open', 'Resolved', 'Referred']}>{cats.map((c) => { const l = s.incidents.filter((i) => i.category === c); return <tr key={c}><td>{c}</td><td>{l.length}</td><td>{l.filter((i) => !['resolved', 'referred_principal', 'referred_counselor'].includes(i.status)).length}</td><td>{l.filter((i) => i.status === 'resolved').length}</td><td>{l.filter((i) => i.status.startsWith('referred')).length}</td></tr>; })}</Table></Card>
      <Card title="By class"><Table head={['Class', 'Incidents']}>{[...new Set(s.incidents.map((i) => { const st = studentById(s, i.studentId); return st ? className(st.grade, st.section) : ''; }))].map((c) => <tr key={c}><td>{c}</td><td>{s.incidents.filter((i) => { const st = studentById(s, i.studentId); return st && className(st.grade, st.section) === c; }).length}</td></tr>)}</Table></Card>
    </div>
  );
}

export function FollowUps() {
  const s = useSchool();
  const [form, setForm] = useState({ incidentId: '', task: '', due: '' });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Follow-up Actions" />
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <Card><Table head={['', 'Task', 'Case', 'Due']}>{s.followUps.map((f) => { const inc = s.incidents.find((i) => i.id === f.incidentId); return <tr key={f.id} className={f.done ? 'opacity-60' : ''}><td><input type="checkbox" aria-label="Done" checked={f.done} onChange={() => actions.toggleFollowUp(f.id)} /></td><td className={f.done ? 'line-through' : ''}>{f.task}</td><td className="text-xs">{studentById(s, inc?.studentId ?? '')?.name} · {inc?.category}</td><td className="text-xs">{f.due < new Date().toISOString().slice(0, 10) && !f.done ? <Pill tone="error">{fmtDate(f.due)}</Pill> : fmtDate(f.due)}</td></tr>; })}</Table></Card>
        <Card title="Add follow-up">
          <div className="space-y-3">
            <select className="input" value={form.incidentId} onChange={(e) => setForm({ ...form, incidentId: e.target.value })} aria-label="Case"><option value="">Select case</option>{s.incidents.filter((i) => i.status !== 'resolved').map((i) => <option key={i.id} value={i.id}>{studentById(s, i.studentId)?.name} — {i.category}</option>)}</select>
            <input className="input" placeholder="Task" value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} aria-label="Task" />
            <input type="date" className="input" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} aria-label="Due date" />
            <button type="button" className="btn-primary w-full" disabled={!form.incidentId || !form.task || !form.due} onClick={() => { actions.addFollowUp(form); setForm({ incidentId: '', task: '', due: '' }); }}>Add</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
