import { useState } from 'react';
import { Activity, Building2, Database, HardDrive, LifeBuoy, ShieldCheck, Users } from 'lucide-react';
import { actions, fmtDate, money, useSchool } from '@/store/store';
import type { TenantSchool } from '@/store/types';
import { Card, Dialog, Field, Header, Meter, Notice, Pill, Stat, Table } from '@/components/kit';
import { greeting, useMe, type PageProps } from './shared';

const PLAN: Record<TenantSchool['plan'], { price: number; storage: number }> = { Starter: { price: 600, storage: 10 }, Standard: { price: 1500, storage: 25 }, Premium: { price: 3000, storage: 60 } };
const MODULES = ['Academics', 'Finance', 'Library', 'Counseling', 'Parent portal', 'Online payments', 'Timetable'];
const statusTone = (s: TenantSchool['status']) => (s === 'active' ? 'success' : s === 'suspended' ? 'error' : 'warning');
const SECURITY_NOTE = 'Platform administrators do not have automatic access to student records, financial transactions or counseling notes. Support access must be justified, time-limited and is logged.';

export function PlatformOverview({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const storage = s.tenants.reduce((a, t) => a + t.storageGb, 0);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle="Innovexa platform operations — school deployments and infrastructure." />
      <Notice><ShieldCheck className="inline w-4 h-4 mr-1" /> {SECURITY_NOTE}</Notice>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="School deployments" value={s.tenants.length} sub={`${s.tenants.filter((t) => t.status === 'active').length} active · ${s.tenants.filter((t) => t.status === 'onboarding').length} onboarding`} icon={<Building2 className="w-5 h-5" />} onClick={() => onNavigate('schools')} />
        <Stat label="Students on platform" value={s.tenants.reduce((a, t) => a + t.students, 0)} icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('analytics')} />
        <Stat label="Open support tickets" value={s.tickets.filter((t) => t.status !== 'resolved').length} icon={<LifeBuoy className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('support')} />
        <Stat label="System health" value="Operational" sub="All services up · 99.95% uptime (30d)" icon={<Activity className="w-5 h-5" />} tone="success" onClick={() => onNavigate('monitoring')} />
        <Stat label="Storage used" value={`${storage.toFixed(1)} GB`} icon={<HardDrive className="w-5 h-5" />} onClick={() => onNavigate('storage')} />
        <Stat label="Last backup" value={<span className="text-base">{fmtDate(s.backups[0]?.at)}</span>} sub={`${s.backups[0]?.sizeGb} GB · ${s.backups[0]?.status}`} icon={<Database className="w-5 h-5" />} onClick={() => onNavigate('backups')} />
        <Stat label="Annual recurring revenue" value={money(s.tenants.filter((t) => t.status !== 'suspended').reduce((a, t) => a + PLAN[t.plan].price, 0))} tone="accent" onClick={() => onNavigate('subscriptions')} />
        <Stat label="Renewals due (60 days)" value={s.tenants.filter((t) => new Date(t.renewal).getTime() - Date.now() < 60 * 86400000).length} tone="error" onClick={() => onNavigate('subscriptions')} />
      </div>
      <Card title="Recent platform activity"><Table head={['When', 'Actor', 'Action', 'Target']}>{s.platformLog.slice(0, 6).map((l) => <tr key={l.id}><td className="text-xs">{fmtDate(l.at)}</td><td>{l.actor}</td><td>{l.action}</td><td>{l.target}</td></tr>)}</Table></Card>
    </div>
  );
}

export function SchoolManagement() {
  const s = useSchool();
  const me = useMe();
  const [pending, setPending] = useState<{ t: TenantSchool; to: TenantSchool['status'] } | null>(null);
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="School Management" subtitle="Activate or deactivate deployments according to contractual terms." />
      <Card>
        <Table head={['School', 'County', 'Plan', 'Students', 'Staff', 'Renewal', 'Status', '']}>
          {s.tenants.map((t) => <tr key={t.id}><td className="font-medium">{t.name}<p className="text-xs text-navy-500">School admin: {t.admin}</p></td><td>{t.county}</td><td>{t.plan}</td><td>{t.students}</td><td>{t.staff}</td><td className="text-xs">{fmtDate(t.renewal)}</td><td><Pill tone={statusTone(t.status)}>{t.status}</Pill></td><td>{t.status === 'suspended' ? <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => { setPending({ t, to: 'active' }); setReason(''); }}>Reactivate</button> : <button type="button" className="btn-ghost text-xs py-1.5 text-error-600" onClick={() => { setPending({ t, to: 'suspended' }); setReason(''); }}>Suspend</button>}</td></tr>)}
        </Table>
      </Card>
      <Dialog open={!!pending} onClose={() => setPending(null)} title={pending?.to === 'suspended' ? 'Suspend deployment' : 'Reactivate deployment'} footer={<><button type="button" className="btn-secondary" onClick={() => setPending(null)}>Cancel</button><button type="button" className={pending?.to === 'suspended' ? 'btn-danger' : 'btn-primary'} disabled={reason.trim().length < 5} onClick={() => { if (pending) actions.setTenant(pending.t.id, { status: pending.to }, me.name, `${pending.to === 'suspended' ? 'Suspended' : 'Reactivated'} deployment — ${reason}`); setPending(null); }}>Confirm</button></>}>
        <p className="text-sm mb-3">{pending?.t.name}: users {pending?.to === 'suspended' ? 'will be unable to sign in. Data is retained.' : 'regain access immediately.'}</p>
        <Field label="Contractual reason (logged)"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Dialog>
    </div>
  );
}

export function CreateSchool({ onNavigate }: PageProps) {
  const me = useMe();
  const [f, setF] = useState({ name: '', county: 'Montserrado', plan: 'Standard' as TenantSchool['plan'], admin: '', renewal: '', modules: ['Academics', 'Parent portal'] });
  const counties = ['Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount', 'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland', 'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe'];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Create New School" subtitle="Creates an isolated deployment in onboarding status. The school administrator receives an invitation." />
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="School name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="County"><select className="input" value={f.county} onChange={(e) => setF({ ...f, county: e.target.value })}>{counties.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Subscription plan"><select className="input" value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value as TenantSchool['plan'] })}>{Object.entries(PLAN).map(([k, v]) => <option key={k} value={k}>{k} — {money(v.price)}/year, {v.storage} GB</option>)}</select></Field>
          <Field label="School administrator (Principal or designee)"><input className="input" value={f.admin} onChange={(e) => setF({ ...f, admin: e.target.value })} /></Field>
          <Field label="Contract renewal date"><input type="date" className="input" value={f.renewal} onChange={(e) => setF({ ...f, renewal: e.target.value })} /></Field>
        </div>
        <fieldset className="mt-4"><legend className="label">Modules</legend><div className="flex flex-wrap gap-2">{MODULES.map((m) => <label key={m} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${f.modules.includes(m) ? 'border-navy-600 bg-navy-50' : 'border-navy-200'}`}><input type="checkbox" className="mr-2" checked={f.modules.includes(m)} onChange={() => setF({ ...f, modules: f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m] })} />{m}</label>)}</div></fieldset>
        <div className="flex justify-end mt-5"><button type="button" className="btn-primary" disabled={!f.name || !f.admin || !f.renewal} onClick={() => { actions.createSchool({ name: f.name, county: f.county, plan: f.plan, admin: f.admin, renewal: f.renewal, modules: f.modules, status: 'onboarding' }, me.name); onNavigate('schools'); }}>Create school</button></div>
      </Card>
    </div>
  );
}

export function SchoolConfigurations() {
  const s = useSchool();
  const me = useMe();
  const [id, setId] = useState(s.tenants[0]?.id ?? '');
  const [access, setAccess] = useState({ scope: 'Timetable configuration (read-only)', hours: '2', why: '' });
  const [granted, setGranted] = useState('');
  const t = s.tenants.find((x) => x.id === id);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="School Configurations" action={<select className="input py-2 text-sm" value={id} onChange={(e) => setId(e.target.value)} aria-label="School">{s.tenants.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>} />
      {t && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Enabled modules">
            {MODULES.map((m) => <label key={m} className="flex justify-between text-sm py-1.5"><span>{m}</span><input type="checkbox" checked={t.modules.includes(m)} onChange={() => actions.setTenant(t.id, { modules: t.modules.includes(m) ? t.modules.filter((x) => x !== m) : [...t.modules, m] }, me.name, `${t.modules.includes(m) ? 'Disabled' : 'Enabled'} module ${m}`)} /></label>)}
          </Card>
          <Card title="Controlled support access">
            <Notice>{SECURITY_NOTE}</Notice>
            {granted && <div className="mt-3"><Notice tone="success">{granted}</Notice></div>}
            <div className="space-y-3 mt-4">
              <Field label="Scope"><select className="input" value={access.scope} onChange={(e) => setAccess({ ...access, scope: e.target.value })}>{['Timetable configuration (read-only)', 'School settings (read-only)', 'User account status (no personal data)'].map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Duration"><select className="input" value={access.hours} onChange={(e) => setAccess({ ...access, hours: e.target.value })}><option value="1">1 hour</option><option value="2">2 hours</option><option value="4">4 hours</option></select></Field>
              <Field label="Justification (ticket reference)"><input className="input" value={access.why} onChange={(e) => setAccess({ ...access, why: e.target.value })} /></Field>
              <button type="button" className="btn-primary" disabled={access.why.trim().length < 5} onClick={() => { actions.logPlatform(me.name, `Support access requested (${access.hours}h, ${access.scope})`, t.name, access.why); setGranted(`Request logged. ${t.admin} must approve before access starts.`); setAccess({ ...access, why: '' }); }}>Request access</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function Subscriptions() {
  const s = useSchool();
  const me = useMe();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Subscription Management" />
      <div className="grid md:grid-cols-3 gap-4">{Object.entries(PLAN).map(([k, v]) => <Card key={k} title={k}><p className="text-2xl font-bold">{money(v.price)}<span className="text-sm font-normal text-navy-500">/year</span></p><p className="text-sm text-navy-500">{v.storage} GB storage · {s.tenants.filter((t) => t.plan === k).length} schools</p></Card>)}</div>
      <Card><Table head={['School', 'Plan', 'Annual fee', 'Renewal', 'Status', '']}>{s.tenants.map((t) => { const due = new Date(t.renewal).getTime() < Date.now(); return <tr key={t.id}><td className="font-medium">{t.name}</td><td><select className="input py-1 text-sm w-32" value={t.plan} onChange={(e) => actions.setTenant(t.id, { plan: e.target.value as TenantSchool['plan'] }, me.name, `Changed plan to ${e.target.value}`)} aria-label="Plan">{Object.keys(PLAN).map((p) => <option key={p}>{p}</option>)}</select></td><td>{money(PLAN[t.plan].price)}</td><td>{due ? <Pill tone="error">Expired {fmtDate(t.renewal)}</Pill> : fmtDate(t.renewal)}</td><td><Pill tone={statusTone(t.status)}>{t.status}</Pill></td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => { const d = new Date(Math.max(Date.now(), new Date(t.renewal).getTime())); d.setFullYear(d.getFullYear() + 1); actions.setTenant(t.id, { renewal: d.toISOString().slice(0, 10) }, me.name, 'Subscription renewed for 12 months'); }}>Renew 12 months</button></td></tr>; })}</Table></Card>
    </div>
  );
}

export function PlatformUsers() {
  const s = useSchool();
  const staff = [
    { name: 'Mr. Daniel Cooper', email: 'admin@innosys.edu', role: 'Platform Super Admin', mfa: true, last: 'Today' },
    { name: 'Ms. Aisha Kamara', email: 'support@innovexa.tech', role: 'Support Engineer', mfa: true, last: 'Yesterday' },
    { name: 'Mr. Kofi Mensah', email: 'devops@innovexa.tech', role: 'Infrastructure Engineer', mfa: true, last: '2 days ago' },
    { name: 'Mrs. Ruth Doe', email: 'onboarding@innovexa.tech', role: 'Onboarding Specialist', mfa: false, last: '5 days ago' },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Platform Users" subtitle="Innovexa staff accounts and each school's primary administrator." />
      <Card title="Innovexa staff"><Table head={['Name', 'Email', 'Role', 'MFA', 'Last active']}>{staff.map((u) => <tr key={u.email}><td className="font-medium">{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.mfa ? <Pill tone="success">On</Pill> : <Pill tone="error">Off</Pill>}</td><td>{u.last}</td></tr>)}</Table></Card>
      <Card title="School administrators"><Table head={['School', 'Administrator', 'Status']}>{s.tenants.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.admin}</td><td><Pill tone={statusTone(t.status)}>{t.status}</Pill></td></tr>)}</Table></Card>
    </div>
  );
}

export function SystemRoles() {
  const perms = ['Manage school deployments', 'Manage subscriptions', 'View system monitoring', 'Run backups', 'Request support access', 'View student records', 'View financial transactions', 'View counseling notes'];
  const roles: [string, boolean[]][] = [
    ['Platform Super Admin', [true, true, true, true, true, false, false, false]],
    ['Support Engineer', [false, false, true, false, true, false, false, false]],
    ['Infrastructure Engineer', [false, false, true, true, false, false, false, false]],
    ['Onboarding Specialist', [true, false, false, false, false, false, false, false]],
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="System Roles and Permissions" subtitle="No platform role has standing access to student, financial or counseling records." />
      <Card><Table head={['Permission', ...roles.map(([r]) => r)]}>{perms.map((p, i) => <tr key={p}><td className="font-medium">{p}</td>{roles.map(([r, v]) => <td key={r}>{v[i] ? '✔' : <span className="text-navy-300">—</span>}</td>)}</tr>)}</Table></Card>
      <Card title="School-level roles (managed by each school)"><p className="text-sm text-navy-600">Principal, Vice Principal, Dean of Students, Academic Officer, Registrar, Finance Director, Librarian, Guidance Counselor, Teacher, Student, Parent/Guardian. The Principal is never the platform Super Admin.</p></Card>
    </div>
  );
}

export function PlatformAnalytics() {
  const s = useSchool();
  const max = Math.max(...s.tenants.map((t) => t.students), 1);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Platform Analytics" subtitle="Aggregate usage only — no individual student data." />
      <div className="grid sm:grid-cols-4 gap-4"><Stat label="Schools" value={s.tenants.length} /><Stat label="Students" value={s.tenants.reduce((a, t) => a + t.students, 0)} /><Stat label="Staff" value={s.tenants.reduce((a, t) => a + t.staff, 0)} /><Stat label="Counties" value={new Set(s.tenants.map((t) => t.county)).size} /></div>
      <Card title="Students per school">{s.tenants.map((t) => <div key={t.id} className="mb-3"><div className="flex justify-between text-sm"><span>{t.name}</span><span>{t.students}</span></div><Meter value={(t.students / max) * 100} /></div>)}</Card>
      <Card title="Module adoption">{MODULES.map((m) => { const n = s.tenants.filter((t) => t.modules.includes(m)).length; return <div key={m} className="mb-3"><div className="flex justify-between text-sm"><span>{m}</span><span>{n} of {s.tenants.length}</span></div><Meter value={(n / s.tenants.length) * 100} tone="#16a34a" /></div>; })}</Card>
    </div>
  );
}

export function SystemMonitoring() {
  const services = [['Web application', 'Operational', '120 ms'], ['API', 'Operational', '85 ms'], ['Database', 'Operational', '12 ms'], ['Authentication', 'Operational', '64 ms'], ['File storage', 'Operational', '140 ms'], ['Email notifications', 'Degraded', '2.1 s'], ['Payment gateway', 'Not connected', '—']];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="System Monitoring" />
      <Card><Table head={['Service', 'Status', 'Response time']}>{services.map(([n, st, r]) => <tr key={n}><td className="font-medium">{n}</td><td><Pill tone={st === 'Operational' ? 'success' : st === 'Degraded' ? 'warning' : 'muted'}>{st}</Pill></td><td>{r}</td></tr>)}</Table></Card>
      <Card title="Recent incidents"><ul className="text-sm space-y-2"><li><b>Email notifications degraded</b> — provider delays in West Africa region; queued messages are retried automatically.</li><li className="text-navy-500">No other incidents in the last 30 days.</li></ul></Card>
    </div>
  );
}

export function StorageManagement() {
  const s = useSchool();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Storage Management" subtitle="Usage against each plan's quota." />
      <Card><Table head={['School', 'Plan', 'Used', 'Quota', 'Usage']}>{s.tenants.map((t) => { const q = PLAN[t.plan].storage; const pct = (t.storageGb / q) * 100; return <tr key={t.id}><td>{t.name}</td><td>{t.plan}</td><td>{t.storageGb} GB</td><td>{q} GB</td><td className="w-56"><div className="flex items-center gap-2"><Meter value={pct} tone={pct > 80 ? '#dc2626' : '#243d6f'} /><span className="text-xs">{Math.round(pct)}%</span></div></td></tr>; })}</Table></Card>
    </div>
  );
}

export function BackupManagement() {
  const s = useSchool();
  const me = useMe();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Backup Management" subtitle="Nightly encrypted backups, retained for 30 days." action={<button type="button" className="btn-primary" onClick={() => actions.runBackup(me.name)}><Database className="w-4 h-4" /> Run backup now</button>} />
      <Card><Table head={['Date', 'Type', 'Size', 'Status', '']}>{s.backups.map((b) => <tr key={b.id}><td>{fmtDate(b.at)}</td><td>{b.kind}</td><td>{b.sizeGb} GB</td><td><Pill tone="success">{b.status}</Pill></td><td><button type="button" className="btn-secondary text-xs py-1.5" disabled title="Restores require approval from two platform administrators and the affected school.">Restore</button></td></tr>)}</Table></Card>
      <Notice>Restoring a backup requires approval from two platform administrators and the affected school's administrator.</Notice>
    </div>
  );
}

export function AuditLogs() {
  const s = useSchool();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Security and Audit Logs" subtitle="Every platform action is recorded and cannot be edited." />
      <Card><Table head={['When', 'Actor', 'Action', 'Target', 'Justification']}>{s.platformLog.map((l) => <tr key={l.id}><td className="text-xs">{fmtDate(l.at)}</td><td>{l.actor}</td><td>{l.action}</td><td>{l.target}</td><td className="text-xs">{l.justification ?? '—'}</td></tr>)}</Table></Card>
    </div>
  );
}

export function PlatformSettings() {
  const [set, setSet] = useState({ maintenance: false, mfa: true, passwordDays: '90', session: '30', signup: false });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Platform Settings" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Security policy">
          <label className="flex justify-between text-sm py-2"><span>Require MFA for all staff accounts</span><input type="checkbox" checked={set.mfa} onChange={(e) => setSet({ ...set, mfa: e.target.checked })} /></label>
          <Field label="Password expiry (days)"><input type="number" className="input" value={set.passwordDays} onChange={(e) => setSet({ ...set, passwordDays: e.target.value })} /></Field>
          <div className="mt-3"><Field label="Session timeout (minutes)"><input type="number" className="input" value={set.session} onChange={(e) => setSet({ ...set, session: e.target.value })} /></Field></div>
        </Card>
        <Card title="Operations">
          <label className="flex justify-between text-sm py-2"><span>Maintenance mode (shows a notice to all schools)</span><input type="checkbox" checked={set.maintenance} onChange={(e) => setSet({ ...set, maintenance: e.target.checked })} /></label>
          <label className="flex justify-between text-sm py-2"><span>Allow self-service school sign-up</span><input type="checkbox" checked={set.signup} onChange={(e) => setSet({ ...set, signup: e.target.checked })} /></label>
          {set.maintenance && <Notice tone="warning">Maintenance mode is on. Remember to schedule it outside school hours (after 4 PM GMT).</Notice>}
        </Card>
      </div>
    </div>
  );
}

export function SupportMaintenance() {
  const s = useSchool();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Support and Maintenance" />
      <Card title="Support requests"><Table head={['Ticket', 'School', 'Subject', 'Priority', 'Opened', 'Status']}>{s.tickets.map((t) => <tr key={t.id}><td className="font-mono text-xs">{t.id}</td><td>{s.tenants.find((x) => x.id === t.schoolId)?.name}</td><td>{t.subject}</td><td><Pill tone={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'navy'}>{t.priority}</Pill></td><td className="text-xs">{fmtDate(t.openedAt)}</td><td><select className="input py-1 text-xs w-32" value={t.status} onChange={(e) => actions.setTicket(t.id, e.target.value as typeof t.status)} aria-label="Status"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></td></tr>)}</Table></Card>
      <Card title="Scheduled maintenance"><ul className="text-sm space-y-1"><li>Saturday 5 Dec, 22:00–23:00 GMT — database minor version upgrade</li><li>Saturday 19 Dec, 22:00–22:30 GMT — certificate rotation</li></ul></Card>
    </div>
  );
}
