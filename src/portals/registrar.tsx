import { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Download, Inbox, Printer, UserMinus, UserPlus, Users } from 'lucide-react';
import {
  actions, activeStudents, allSections, className, feeAccount, fmtDate, gradesOf, money, roster, sectionsOf, studentAverage, studentById, useSchool,
} from '@/store/store';
import type { SchoolStudent } from '@/store/types';
import { downloadCsv, printHtml, tableHtml } from '@/store/files';
import { Card, ClassSectionPicker, Dialog, Field, Header, Notice, Pill, SearchBox, StackedBars, Stat, Table } from '@/components/kit';
import { StudentProfileDialog } from './common';
import { ContactLinks, greeting, useMe, type PageProps } from './shared';

export function RegistrarOverview({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const year = Number(s.school.academicYear.slice(0, 4));
  const active = activeStudents(s);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · ${s.school.academicYear} enrollment`} action={<button type="button" className="btn-primary" onClick={() => onNavigate('registration')}><UserPlus className="w-4 h-4" /> Register student</button>} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Stat label="Enrolled students" value={active.length} icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('profiles')} />
        <Stat label={`New in ${s.school.academicYear}`} value={active.filter((x) => x.yearEntered === year).length} tone="success" onClick={() => onNavigate('enrollment-reports')} />
        <Stat label="Pending applications" value={s.applications.filter((a) => a.status === 'pending').length} icon={<Inbox className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('applications')} />
        <Stat label="Guardian accounts not linked" value={active.filter((x) => !x.parentLinked).length} tone="accent" onClick={() => onNavigate('guardians')} />
        <Stat label="Transfers / withdrawals" value={s.students.filter((x) => x.status === 'transferred' || x.status === 'withdrawn').length} icon={<ArrowLeftRight className="w-5 h-5" />} onClick={() => onNavigate('transfers')} />
      </div>
      <Card title="Enrollment by class">
        <StackedBars rows={gradesOf(s).map((g) => ({ label: `Grade ${g}`, values: [roster(s, g).filter((x) => x.gender === 'F').length, roster(s, g).filter((x) => x.gender === 'M').length] }))} series={[{ name: 'Girls', color: '#8ba9d8' }, { name: 'Boys', color: '#243d6f' }]} onSelect={() => onNavigate('enrollment-reports')} />
      </Card>
      <Card title="Most recently registered">
        <Table head={['Student ID', 'Name', 'Class', 'Guardian']}>
          {s.students.slice(-6).reverse().map((x) => <tr key={x.id}><td className="font-mono text-xs">{x.studentNo}</td><td>{x.name}</td><td>{className(x.grade, x.section)}</td><td>{x.guardianName}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

const EMPTY = { firstName: '', lastName: '', gender: 'F' as 'M' | 'F', dob: '', grade: 7, section: 'A', guardianName: '', guardianRelation: 'Mother', guardianPhone: '', guardianEmail: '', address: '' };

export function StudentRegistration({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const [f, setF] = useState(EMPTY);
  const [done, setDone] = useState<string | null>(null);
  const valid = f.firstName.trim() && f.lastName.trim() && f.dob && f.guardianName.trim() && /^\+?[\d\s]{7,}$/.test(f.guardianPhone);
  const created = done ? studentById(s, done) : null;
  const fee = created ? feeAccount(s, created.id) : null;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: k === 'grade' ? Number(e.target.value) : e.target.value });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Registration" subtitle="Register a student after the school's admission decision. A unique student ID and a fee account are created automatically." />
      {created && fee && (
        <Card>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-success-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-navy-900">{created.name} registered — Student ID <span className="font-mono">{created.studentNo}</span></p>
              <p className="text-sm text-navy-600 mt-1">Placed in {className(created.grade, created.section)}. Fee account created from the configured fee structure: <b>{money(fee.charged)}</b> (balance {money(fee.balance)}). The Finance Director and class teachers were notified automatically.</p>
              <div className="flex gap-2 mt-3"><button type="button" className="btn-secondary text-sm" onClick={() => onNavigate('profiles')}>Open profiles</button><button type="button" className="btn-secondary text-sm" onClick={() => { setDone(null); setF(EMPTY); }}>Register another</button></div>
            </div>
          </div>
        </Card>
      )}
      {!created && (
        <Card>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="First name(s)"><input className="input" value={f.firstName} onChange={set('firstName')} /></Field>
            <Field label="Last name"><input className="input" value={f.lastName} onChange={set('lastName')} /></Field>
            <Field label="Gender"><select className="input" value={f.gender} onChange={set('gender')}><option value="F">Female</option><option value="M">Male</option></select></Field>
            <Field label="Date of birth"><input type="date" className="input" value={f.dob} onChange={set('dob')} /></Field>
            <Field label="Class"><select className="input" value={f.grade} onChange={(e) => setF({ ...f, grade: Number(e.target.value), section: sectionsOf(s, Number(e.target.value))[0] })}>{gradesOf(s).map((g) => <option key={g} value={g}>Grade {g}</option>)}</select></Field>
            <Field label="Section" hint={`${roster(s, f.grade, f.section).length} students currently`}><select className="input" value={f.section} onChange={set('section')}>{sectionsOf(s, f.grade).map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Home address"><input className="input" value={f.address} onChange={set('address')} placeholder="Community, city" /></Field>
            <Field label="Guardian full name"><input className="input" value={f.guardianName} onChange={set('guardianName')} /></Field>
            <Field label="Relationship"><select className="input" value={f.guardianRelation} onChange={set('guardianRelation')}>{['Mother', 'Father', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Sibling'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Guardian phone"><input className="input" value={f.guardianPhone} onChange={set('guardianPhone')} placeholder="+231 77 000 0000" /></Field>
            <Field label="Guardian email (optional)"><input type="email" className="input" value={f.guardianEmail} onChange={set('guardianEmail')} /></Field>
          </div>
          <p className="text-xs text-navy-400 mt-3">Recording guardian details does not give portal access. Parent accounts are linked separately after verification.</p>
          <div className="flex justify-end mt-4"><button type="button" className="btn-primary" disabled={!valid} onClick={() => setDone(actions.registerStudent(f, me.name))}><UserPlus className="w-4 h-4" /> Register student</button></div>
        </Card>
      )}
    </div>
  );
}

export function AdmissionApplications() {
  const s = useSchool();
  const me = useMe();
  const [approving, setApproving] = useState<string | null>(null);
  const [section, setSection] = useState('A');
  const app = s.applications.find((a) => a.id === approving);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Admission Applications" subtitle="Applications recorded at the school. Approving one (within your delegated authority) registers the student." />
      <Card>
        <Table head={['Applicant', 'Applying for', 'Previous school', 'Guardian', 'Received', 'Status', '']}>
          {s.applications.map((a) => (
            <tr key={a.id}>
              <td className="font-medium">{a.firstName} {a.lastName}<p className="text-xs text-navy-500">{a.gender === 'M' ? 'Male' : 'Female'} · born {fmtDate(a.dob)}</p></td>
              <td>Grade {a.applyingFor}</td><td className="text-sm">{a.previousSchool}</td><td className="text-sm">{a.guardianName}<p className="text-xs">{a.guardianPhone}</p></td><td className="text-xs">{fmtDate(a.submittedAt)}</td>
              <td><Pill tone={a.status === 'approved' ? 'success' : a.status === 'declined' ? 'error' : 'warning'}>{a.status}</Pill></td>
              <td>{a.status === 'pending' && <div className="flex gap-2"><button type="button" className="btn-primary text-xs py-1.5" onClick={() => { setApproving(a.id); setSection(sectionsOf(s, a.applyingFor)[0]); }}>Approve</button><button type="button" className="btn-ghost text-xs py-1.5 text-error-600" onClick={() => actions.decideApplication(a.id, 'declined')}>Decline</button></div>}</td>
            </tr>
          ))}
        </Table>
      </Card>
      <Dialog open={!!app} onClose={() => setApproving(null)} title="Approve and register" footer={<>
        <button type="button" className="btn-secondary" onClick={() => setApproving(null)}>Cancel</button>
        <button type="button" className="btn-primary" onClick={() => { if (app) { actions.registerStudent({ firstName: app.firstName, lastName: app.lastName, gender: app.gender, dob: app.dob, grade: app.applyingFor, section, guardianName: app.guardianName, guardianRelation: 'Guardian', guardianPhone: app.guardianPhone, guardianEmail: '', address: '' }, me.name); actions.decideApplication(app.id, 'approved'); } setApproving(null); }}>Register student</button>
      </>}>
        {app && <div className="space-y-3 text-sm"><p>{app.firstName} {app.lastName} will be registered in Grade {app.applyingFor}. Choose a section:</p><select className="input" value={section} onChange={(e) => setSection(e.target.value)}>{sectionsOf(s, app.applyingFor).map((x) => <option key={x} value={x}>Section {x} ({roster(s, app.applyingFor, x).length} students)</option>)}</select></div>}
      </Dialog>
    </div>
  );
}

export function StudentProfiles() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<SchoolStudent | null>(null);
  const list = activeStudents(s).filter((x) => (grade == null || x.grade === grade) && (section == null || x.section === section) && `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase()));
  const st = open ? studentById(s, open) : null;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Profiles" subtitle="One central profile per student, shared by every workspace." />
      <Card action={<ClassSectionPicker grade={grade} section={section} allowAllSections onChange={(g, x) => { setGrade(g); setSection(x); }} />}>
        <div className="max-w-sm mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search name or student ID" /></div>
        <Table head={['Student ID', 'Name', 'Class', 'Academic year', 'Guardian', 'Enrollment', '']}>
          {list.slice(0, 60).map((x) => <tr key={x.id}><td className="font-mono text-xs">{x.studentNo}</td><td className="font-medium">{x.name}</td><td>{className(x.grade, x.section)}</td><td>{s.school.academicYear}</td><td>{x.parentLinked ? <Pill tone="success">Parent account linked</Pill> : <Pill tone="muted">Not linked</Pill>}</td><td><Pill tone="success">Active</Pill></td><td className="whitespace-nowrap"><button type="button" className="text-sm text-navy-700 hover:underline mr-3" onClick={() => setOpen(x.id)}>View</button><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setEdit({ ...x })}>Edit</button></td></tr>)}
        </Table>
        {list.length > 60 && <p className="text-xs text-navy-400 mt-2">Showing 60 of {list.length}.</p>}
      </Card>
      {st && <StudentProfileDialog studentId={st.id} onClose={() => setOpen(null)} />}
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={`Update personal information — ${edit?.studentNo}`} footer={<><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (edit) actions.updateStudent(edit.id, { firstName: edit.firstName, lastName: edit.lastName, dob: edit.dob, address: edit.address, guardianName: edit.guardianName, guardianPhone: edit.guardianPhone, guardianEmail: edit.guardianEmail }); setEdit(null); }}>Save</button></>}>
        {edit && <div className="grid sm:grid-cols-2 gap-3">
          <Field label="First name(s)"><input className="input" value={edit.firstName} onChange={(e) => setEdit({ ...edit, firstName: e.target.value })} /></Field>
          <Field label="Last name"><input className="input" value={edit.lastName} onChange={(e) => setEdit({ ...edit, lastName: e.target.value })} /></Field>
          <Field label="Date of birth"><input type="date" className="input" value={edit.dob} onChange={(e) => setEdit({ ...edit, dob: e.target.value })} /></Field>
          <Field label="Address"><input className="input" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></Field>
          <Field label="Guardian"><input className="input" value={edit.guardianName} onChange={(e) => setEdit({ ...edit, guardianName: e.target.value })} /></Field>
          <Field label="Guardian phone"><input className="input" value={edit.guardianPhone} onChange={(e) => setEdit({ ...edit, guardianPhone: e.target.value })} /></Field>
          <Field label="Guardian email"><input className="input" value={edit.guardianEmail} onChange={(e) => setEdit({ ...edit, guardianEmail: e.target.value })} /></Field>
          <p className="text-xs text-navy-400 sm:col-span-2">The student ID can't be changed.</p>
        </div>}
      </Dialog>
    </div>
  );
}

export function GuardianRecords() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [linking, setLinking] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const list = activeStudents(s).filter((x) => `${x.name} ${x.guardianName} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase()));
  const st = linking ? studentById(s, linking) : null;
  const families = new Map<string, number>();
  activeStudents(s).forEach((x) => families.set(x.guardianPhone, (families.get(x.guardianPhone) ?? 0) + 1));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Parent and Guardian Records" subtitle="Link a parent account only after verifying the relationship with official documents." />
      <div className="max-w-sm"><SearchBox value={q} onChange={setQ} placeholder="Search student or guardian" /></div>
      <Card>
        <Table head={['Guardian', 'Relationship', 'Contact', 'Student', 'Class', 'Parent account', '']}>
          {list.slice(0, 60).map((x) => <tr key={x.id}><td className="font-medium">{x.guardianName}{(families.get(x.guardianPhone) ?? 0) > 1 && <p className="text-xs text-navy-500">{families.get(x.guardianPhone)} children enrolled</p>}</td><td>{x.guardianRelation}</td><td><ContactLinks phone={x.guardianPhone} email={x.guardianEmail} /></td><td>{x.name}</td><td>{className(x.grade, x.section)}</td><td>{x.parentLinked ? <Pill tone="success">Linked</Pill> : <Pill tone="muted">Not linked</Pill>}</td><td>{!x.parentLinked && <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => { setLinking(x.id); setVerified(false); }}>Link account</button>}</td></tr>)}
        </Table>
      </Card>
      <Dialog open={!!st} onClose={() => setLinking(null)} title="Link parent account" footer={<><button type="button" className="btn-secondary" onClick={() => setLinking(null)}>Cancel</button><button type="button" className="btn-primary" disabled={!verified} onClick={() => { if (st) actions.updateStudent(st.id, { parentLinked: true }); setLinking(null); }}>Link account</button></>}>
        {st && <div className="space-y-3 text-sm"><p>Link <b>{st.guardianName}</b> ({st.guardianRelation}) to <b>{st.name}</b>, {className(st.grade, st.section)}.</p><p className="text-navy-500">The parent will see only this child's permitted records: attendance, published results, released report cards, fees and school messages.</p><label className="flex items-start gap-2"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-1" /> I have verified the guardian's identity and relationship (ID card and birth certificate or court document).</label></div>}
      </Dialog>
    </div>
  );
}

export function ClassAssignment() {
  const s = useSchool();
  const [grade, setGrade] = useState<number | null>(7);
  const [moving, setMoving] = useState<SchoolStudent | null>(null);
  const [to, setTo] = useState('');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Class Assignment" subtitle="Place students into sections. Section sizes update everywhere immediately." />
      <ClassSectionPicker grade={grade} section={null} allowAllSections onChange={(g) => setGrade(g)} />
      {grade != null && (
        <div className="grid md:grid-cols-3 gap-4">
          {sectionsOf(s, grade).map((sec) => (
            <Card key={sec} title={`Grade ${grade}${sec}`} subtitle={`${roster(s, grade, sec).length} students`}>
              <ul className="text-sm divide-y divide-navy-50 max-h-80 overflow-y-auto">
                {roster(s, grade, sec).map((x) => <li key={x.id} className="py-1.5 flex justify-between gap-2"><span>{x.name}</span><button type="button" className="text-xs text-navy-600 hover:underline" onClick={() => { setMoving(x); setTo(sectionsOf(s, grade).find((y) => y !== sec) ?? sec); }}>Move</button></li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!moving} onClose={() => setMoving(null)} title={`Move ${moving?.name}`} footer={<><button type="button" className="btn-secondary" onClick={() => setMoving(null)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (moving) actions.updateStudent(moving.id, { section: to }); setMoving(null); }}>Move student</button></>}>
        {moving && <Field label="New section"><select className="input" value={to} onChange={(e) => setTo(e.target.value)}>{sectionsOf(s, moving.grade).filter((x) => x !== moving.section).map((x) => <option key={x} value={x}>Grade {moving.grade}{x} ({roster(s, moving.grade, x).length})</option>)}</select></Field>}
      </Dialog>
    </div>
  );
}

export function StudentPromotion() {
  const s = useSchool();
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const list = grade != null && section ? roster(s, grade, section) : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Promotion" subtitle="End-of-year promotion, based on the Principal-approved results and the school's pass mark." />
      <Notice tone="warning">Promotion is normally done once, after final results are approved for the year. Promoted students move to the next grade in the same section.</Notice>
      <ClassSectionPicker grade={grade} section={section} onChange={(g, x) => { setGrade(g); setSection(x); setSel([]); }} />
      {list.length > 0 && (
        <Card action={<div className="flex gap-2"><button type="button" className="btn-secondary text-sm" onClick={() => setSel(list.filter((x) => (studentAverage(s, x.id) ?? 0) >= s.grading.passMark).map((x) => x.id))}>Select all passing</button><button type="button" className="btn-primary text-sm" disabled={!sel.length} onClick={() => setConfirm(true)}>Promote {sel.length}</button></div>}>
          <Table head={['', 'Student', 'Average', 'Recommendation']}>
            {list.map((x) => { const a = studentAverage(s, x.id); const pass = (a ?? 0) >= s.grading.passMark; return <tr key={x.id}><td><input type="checkbox" aria-label={`Select ${x.name}`} checked={sel.includes(x.id)} onChange={() => setSel(sel.includes(x.id) ? sel.filter((y) => y !== x.id) : [...sel, x.id])} /></td><td>{x.name}</td><td>{a ?? '—'}%</td><td><Pill tone={pass ? 'success' : 'warning'}>{pass ? (grade === 12 ? 'Graduate' : `Promote to Grade ${(grade ?? 0) + 1}`) : 'Review / remedial'}</Pill></td></tr>; })}
          </Table>
        </Card>
      )}
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Confirm promotion" footer={<><button type="button" className="btn-secondary" onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (grade != null && section) actions.promoteSection(grade, section, sel); setSel([]); setConfirm(false); }}>Promote</button></>}>
        <p className="text-sm">{sel.length} student(s) from Grade {grade}{section} will be {grade === 12 ? 'graduated' : `moved to Grade ${(grade ?? 0) + 1}${section}`}. Their history is kept in the academic records archive.</p>
      </Dialog>
    </div>
  );
}

function ExitPage({ kind }: { kind: 'transferred' | 'withdrawn' }) {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<string | null>(null);
  const [form, setForm] = useState({ school: '', date: new Date().toISOString().slice(0, 10), reason: '' });
  const hits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const st = pick ? studentById(s, pick) : null;
  const done = s.students.filter((x) => x.status === kind);
  const label = kind === 'transferred' ? 'Transfer' : 'Withdrawal';
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={kind === 'transferred' ? 'Student Transfers' : 'Withdrawals'} subtitle={`Records are archived, never deleted. Fee balances remain on the student's account.`} />
      <Card title={`Process a ${label.toLowerCase()}`}>
        <div className="max-w-md"><SearchBox value={q} onChange={(v) => { setQ(v); setPick(null); }} placeholder="Find student by name or ID" /></div>
        <div className="flex flex-wrap gap-2 mt-3">{hits.map((x) => <button key={x.id} type="button" className={`btn-secondary text-sm ${pick === x.id ? 'ring-2 ring-navy-500' : ''}`} onClick={() => setPick(x.id)}>{x.name} · {className(x.grade, x.section)}</button>)}</div>
        {st && (
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {kind === 'transferred' && <Field label="Receiving school"><input className="input" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /></Field>}
            <Field label="Effective date"><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Reason"><input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
            <div className="md:col-span-3 flex justify-between items-center">
              <p className="text-sm text-navy-500">Outstanding balance: {money(feeAccount(s, st.id).balance)}</p>
              <button type="button" className="btn-primary" disabled={(kind === 'transferred' && !form.school) || !form.reason} onClick={() => { actions.updateStudent(st.id, { status: kind, statusNote: `${label} effective ${form.date}${form.school ? ` to ${form.school}` : ''} — ${form.reason}` }); setPick(null); setQ(''); }}>{kind === 'transferred' ? <ArrowLeftRight className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />} Record {label.toLowerCase()}</button>
            </div>
          </div>
        )}
      </Card>
      <Card title={`${label}s recorded`}>
        <Table head={['Student ID', 'Name', 'Last class', 'Details', '']}>
          {done.map((x) => <tr key={x.id}><td className="font-mono text-xs">{x.studentNo}</td><td>{x.name}</td><td>{className(x.grade, x.section)}</td><td className="text-sm">{x.statusNote}</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => actions.updateStudent(x.id, { status: 'active', statusNote: undefined })}>Re-admit</button></td></tr>)}
        </Table>
      </Card>
    </div>
  );
}
export const StudentTransfers = () => <ExitPage kind="transferred" />;
export const Withdrawals = () => <ExitPage kind="withdrawn" />;

export function IdNumbers() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const dupes = s.students.length - new Set(s.students.map((x) => x.studentNo)).size;
  const list = s.students.filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Identification Numbers" subtitle="Format: INNO-[year of entry]-[sequence]. Assigned automatically at registration and never reused." />
      <div className="grid sm:grid-cols-3 gap-4"><Stat label="IDs issued" value={s.students.length} /><Stat label="Duplicates" value={dupes} tone={dupes ? 'error' : 'success'} /><Stat label="Next sequence" value={String(s.students.length + 1).padStart(3, '0')} /></div>
      <Card action={<SearchBox value={q} onChange={setQ} placeholder="Search" />}>
        <Table head={['Student ID', 'Name', 'Year of entry', 'Status']}>{list.slice(0, 80).map((x) => <tr key={x.id}><td className="font-mono">{x.studentNo}</td><td>{x.name}</td><td>{x.yearEntered}</td><td>{x.status}</td></tr>)}</Table>
      </Card>
    </div>
  );
}

export function EnrollmentReports() {
  const s = useSchool();
  const stamp = new Date().toISOString().slice(0, 10);
  const header = ['Class', 'Section', 'Girls', 'Boys', 'Total', 'New this year', 'Parent linked'];
  const rows = allSections(s).map(({ grade, section }) => { const r = roster(s, grade, section); return [`Grade ${grade}`, section, r.filter((x) => x.gender === 'F').length, r.filter((x) => x.gender === 'M').length, r.length, r.filter((x) => x.yearEntered === 2026).length, r.filter((x) => x.parentLinked).length]; });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Enrollment Reports" action={<>
        <button type="button" className="btn-primary text-sm" onClick={() => downloadCsv(`Enrollment_${stamp}`, header, rows)}><Download className="w-4 h-4" /> Download</button>
        <button type="button" className="btn-secondary text-sm" onClick={() => printHtml('Enrollment report', `<h1>${s.school.name} — Enrollment report</h1><p class="muted">${s.school.academicYear} · ${fmtDate(stamp)}</p>${tableHtml(header, rows)}`)}><Printer className="w-4 h-4" /> Print</button>
        <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Student_list_${stamp}`, ['Student ID', 'Name', 'Gender', 'Class', 'Guardian', 'Phone'], activeStudents(s).map((x) => [x.studentNo, x.name, x.gender, className(x.grade, x.section), x.guardianName, x.guardianPhone]))}>Full student list</button>
      </>} />
      <Card><Table head={header}>{rows.map((r) => <tr key={`${r[0]}${r[1]}`}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}<tr className="font-semibold"><td>Total</td><td /><td>{rows.reduce((a, r) => a + Number(r[2]), 0)}</td><td>{rows.reduce((a, r) => a + Number(r[3]), 0)}</td><td>{rows.reduce((a, r) => a + Number(r[4]), 0)}</td><td>{rows.reduce((a, r) => a + Number(r[5]), 0)}</td><td>{rows.reduce((a, r) => a + Number(r[6]), 0)}</td></tr></Table></Card>
    </div>
  );
}

export function RecordsArchive() {
  const s = useSchool();
  const [open, setOpen] = useState<string | null>(null);
  const archived = s.students.filter((x) => x.status !== 'active');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Academic Records Archive" subtitle="Official records of former students and closed academic years. Archived, never deleted." />
      <Card title="Former students">
        <Table head={['Student ID', 'Name', 'Last class', 'Status', 'Note', '']}>{archived.map((x) => <tr key={x.id}><td className="font-mono text-xs">{x.studentNo}</td><td>{x.name}</td><td>{className(x.grade, x.section)}</td><td><Pill tone="muted">{x.status}</Pill></td><td className="text-xs">{x.statusNote}</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setOpen(x.id)}>View</button></td></tr>)}</Table>
      </Card>
      <Card title="Academic years">
        <Table head={['Year', 'Start', 'End', 'Status']}>{s.years.map((y) => <tr key={y.id}><td>{y.name}</td><td>{fmtDate(y.start)}</td><td>{fmtDate(y.end)}</td><td><Pill tone={y.status === 'current' ? 'success' : 'muted'}>{y.status === 'closed' ? 'Archived' : y.status}</Pill></td></tr>)}</Table>
      </Card>
      <StudentProfileDialog studentId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
