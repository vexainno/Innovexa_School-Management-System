import { useState } from 'react';
import { CalendarDays, CalendarPlus, Repeat2, Send, UserCheck, UserX, Users } from 'lucide-react';
import {
  actions, activeStudents, allSections, attendanceSummary, blockTime, className, fmtDate, lastSchoolDay, lessonBlocks, staffName, studentAttendance, teachers, useSchool,
} from '@/store/store';
import type { SchoolState, StaffAttendanceStatus, TimetableSlot } from '@/store/types';
import { Card, Header, Notice, Pill, Stat, Table, Tabs } from '@/components/kit';
import { SectionTimetable } from './academic';
import { AttendanceReports } from './principal';
import { greeting, useMe, type PageProps } from './shared';

const WEEK: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const todayDay = (): TimetableSlot['day'] => WEEK[Math.max(0, Math.min(5, new Date(`${lastSchoolDay()}T12:00:00`).getDay() - 1))];
const currentPeriod = (s: SchoolState) => {
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  let p = 1;
  lessonBlocks(s).forEach((b, i) => { const [h, m] = b.start.split(':').map(Number); if (now >= h * 60 + m) p = i + 1; });
  return p;
};
const STATUS: { id: StaffAttendanceStatus; label: string; tone: 'success' | 'warning' | 'error' | 'accent' | 'muted' }[] = [
  { id: 'present', label: 'Present', tone: 'success' }, { id: 'late', label: 'Late', tone: 'warning' },
  { id: 'absent', label: 'Absent', tone: 'error' }, { id: 'on_leave', label: 'On leave', tone: 'accent' }, { id: 'not_recorded', label: 'Not recorded', tone: 'muted' },
];
const tone = (st: StaffAttendanceStatus) => STATUS.find((x) => x.id === st)?.tone ?? 'muted';

function useToday() {
  const s = useSchool();
  const date = lastSchoolDay();
  const rec = (id: string) => s.staffAttendance.find((a) => a.staffId === id && a.date === date);
  return { s, date, rec, status: (id: string): StaffAttendanceStatus => rec(id)?.status ?? 'not_recorded' };
}

function AttendanceRegister({ onNavigate, compact }: { onNavigate: (p: string) => void; compact?: boolean }) {
  const me = useMe();
  const { s, date, rec, status } = useToday();
  const set = (staffId: string, st: StaffAttendanceStatus) => actions.setStaffAttendance({ staffId, date, status: st, arrival: st === 'present' ? new Date().toTimeString().slice(0, 5) : st === 'late' ? new Date().toTimeString().slice(0, 5) : undefined, recordedBy: me.name, note: rec(staffId)?.note });
  return (
    <Table head={['Teacher', 'Subjects', 'Lessons today', 'Status', 'Arrival', compact ? '' : 'Record', '']}>
      {teachers(s).map((t) => {
        const st = status(t.id);
        const lessons = s.timetable.filter((x) => x.teacherId === t.id && x.day === todayDay()).length;
        return (
          <tr key={t.id}>
            <td className="font-medium">{t.name}</td>
            <td className="text-xs">{t.subjects.join(', ')}</td>
            <td>{lessons}</td>
            <td><Pill tone={tone(st)}>{STATUS.find((x) => x.id === st)?.label}</Pill></td>
            <td>{rec(t.id)?.arrival ?? '—'}</td>
            <td>{!compact && (
              <select aria-label={`Record attendance for ${t.name}`} className="input py-1.5 text-xs w-32" value={st} onChange={(e) => set(t.id, e.target.value as StaffAttendanceStatus)}>
                {STATUS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            )}</td>
            <td>{(st === 'absent' || st === 'on_leave') && lessons > 0 && <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => onNavigate(`substitutes:${t.id}`)}><Repeat2 className="w-3.5 h-3.5" /> Arrange substitute</button>}</td>
          </tr>
        );
      })}
    </Table>
  );
}

export function VPOverview({ onNavigate }: PageProps) {
  const me = useMe();
  const { s, date, status } = useToday();
  const ts = teachers(s);
  const present = ts.filter((t) => ['present', 'late'].includes(status(t.id))).length;
  const onLeave = ts.filter((t) => status(t.id) === 'on_leave').length;
  const today = new Date().toISOString().slice(0, 10);
  const meetings = [...s.opsLog.filter((o) => o.kind === 'meeting' && (o.date ?? '') >= today).map((o) => ({ title: o.title, date: o.date! })), ...s.calendar.filter((e) => e.kind === 'meeting' && e.date >= today).map((e) => ({ title: e.title, date: e.date }))]
    .filter((m, i, arr) => arr.findIndex((x) => x.title === m.title) === i).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · ${fmtDate(date)}`} action={<><button type="button" className="btn-secondary" onClick={() => onNavigate('class-schedules')}>Build weekly class schedule</button><button type="button" className="btn-primary" onClick={() => onNavigate('calendar')}><CalendarDays className="w-4 h-4" /> Manage school calendar</button></>} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total Teachers" value={ts.length} icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('teacher-attendance')} />
        <Stat label="Present Today" value={`${Math.round((present / ts.length) * 100)}%`} sub={`${present} of ${ts.length} teachers reported`} icon={<UserCheck className="w-5 h-5" />} tone="success" onClick={() => onNavigate('teacher-attendance')} />
        <Stat label="On Leave" value={onLeave} sub={`${ts.filter((t) => status(t.id) === 'absent').length} absent without leave`} icon={<UserX className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('teacher-attendance')} />
        <Stat label="Upcoming Meetings Scheduled" value={meetings.length} sub={meetings[0] ? `Next: ${meetings[0].title}, ${fmtDate(meetings[0].date)}` : undefined} icon={<CalendarPlus className="w-5 h-5" />} tone="accent" onClick={() => onNavigate('daily-activities')} />
      </div>
      <Card title="Teacher attendance record" subtitle="Record each teacher as they report. Absent teachers with lessons today need a substitute." action={<button type="button" className="btn-secondary text-sm" onClick={() => onNavigate('teacher-attendance')}>Full register</button>}>
        <AttendanceRegister onNavigate={onNavigate} />
      </Card>
    </div>
  );
}

export function TeacherAttendance({ onNavigate }: PageProps) {
  const { s, date, status } = useToday();
  const ts = teachers(s);
  const c = (st: StaffAttendanceStatus) => ts.filter((t) => status(t.id) === st).length;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Teacher Attendance" subtitle={`Register for ${fmtDate(date)}. Visible to the Principal immediately.`} />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{STATUS.map((x) => <Stat key={x.id} label={x.label} value={c(x.id)} tone={x.tone === 'muted' ? 'navy' : x.tone} />)}</div>
      <Notice>Example workflow: a Mathematics teacher is absent → mark <b>Absent</b> → <b>Arrange substitute</b> shows their lessons today → assign an authorized, free teacher → update the class schedule → inform the affected students.</Notice>
      <Card><AttendanceRegister onNavigate={onNavigate} /></Card>
    </div>
  );
}

export function StudentAttendance(props: PageProps) {
  const s = useSchool();
  const late = activeStudents(s).filter((x) => studentAttendance(x.id, lastSchoolDay()) === 'late');
  return (
    <div className="space-y-6">
      <AttendanceReports {...props} />
      <Card title={`Lateness report — ${fmtDate(lastSchoolDay())}`} subtitle={`${late.length} students arrived late`}>
        <Table head={['Student', 'Class', 'Late (last 20 days)']}>{late.map((x) => <tr key={x.id}><td>{x.name}</td><td>{className(x.grade, x.section)}</td><td>{attendanceSummary([x.id], [lastSchoolDay()]).late}</td></tr>)}</Table>
      </Card>
    </div>
  );
}

export function ClassMonitoring() {
  const { s, status } = useToday();
  const [day, setDay] = useState(todayDay());
  const [period, setPeriod] = useState(() => currentPeriod(s));
  const subs = s.substitutions.filter((x) => x.date === lastSchoolDay());
  const rows = allSections(s).map(({ grade, section }) => {
    const slot = s.timetable.find((t) => t.grade === grade && t.section === section && t.day === day && t.period === period);
    const sub = subs.find((x) => x.grade === grade && x.section === section && x.period === period && x.day === day);
    const teacherOk = slot?.teacherId && ['present', 'late'].includes(status(slot.teacherId));
    const state = !slot?.teacherId ? 'no_teacher' : sub ? 'substitute' : teacherOk ? 'ok' : 'uncovered';
    return { grade, section, slot, sub, state };
  });
  const unassigned = s.assignments.filter((a) => !a.teacherId);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Class Monitoring" subtitle="Is every lesson taking place? Based on the timetable and today's teacher attendance." action={
        <div className="flex gap-2">
          <select className="input py-2 text-sm" value={day} onChange={(e) => setDay(e.target.value as typeof day)} aria-label="Day">{s.schedule.days.map((d) => <option key={d}>{d}</option>)}</select>
          <select className="input py-2 text-sm" value={period} onChange={(e) => setPeriod(Number(e.target.value))} aria-label="Period">{lessonBlocks(s).map((b, i) => <option key={b.id} value={i + 1}>{b.label} ({blockTime(b)})</option>)}</select>
        </div>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Lessons taking place" value={rows.filter((r) => r.state === 'ok').length} tone="success" />
        <Stat label="Covered by substitute" value={rows.filter((r) => r.state === 'substitute').length} tone="accent" />
        <Stat label="Teacher absent — not covered" value={rows.filter((r) => r.state === 'uncovered').length} tone="error" />
        <Stat label="No teacher assigned" value={rows.filter((r) => r.state === 'no_teacher').length} tone="warning" />
      </div>
      <Card>
        <Table head={['Class', 'Room', 'Subject', 'Teacher', 'Lesson status']}>
          {rows.map((r) => <tr key={`${r.grade}${r.section}`}><td className="font-medium">{className(r.grade, r.section)}</td><td>{r.slot?.room}</td><td>{r.slot?.subject}</td><td>{r.sub ? `${staffName(s, r.sub.substituteId)} (substitute)` : r.slot?.teacherId ? staffName(s, r.slot.teacherId) : '—'}</td><td><Pill tone={r.state === 'ok' ? 'success' : r.state === 'substitute' ? 'accent' : r.state === 'uncovered' ? 'error' : 'warning'}>{r.state === 'ok' ? 'Taking place' : r.state === 'substitute' ? 'Substitute in class' : r.state === 'uncovered' ? 'Teacher absent' : r.slot?.subject === 'Study Hall' ? 'Study hall — supervise' : 'No teacher assigned'}</Pill></td></tr>)}
        </Table>
      </Card>
      {unassigned.length > 0 && <Card title="Classes without an assigned subject teacher"><ul className="text-sm list-disc pl-5">{unassigned.map((a) => <li key={`${a.grade}${a.section}${a.subject}`}>{className(a.grade, a.section)} — {a.subject}</li>)}</ul></Card>}
    </div>
  );
}

export function TeacherTimetables() {
  const s = useSchool();
  const [id, setId] = useState(teachers(s)[0]?.id ?? '');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Teacher Timetables" action={<select className="input py-2 text-sm" value={id} onChange={(e) => setId(e.target.value)} aria-label="Teacher">{teachers(s).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>} />
      <Card title={staffName(s, id)} subtitle={`${s.timetable.filter((t) => t.teacherId === id).length} lessons per week`}><SectionTimetable teacherId={id} /></Card>
    </div>
  );
}

export { ClassSchedules } from './scheduleBuilder';

export function Substitutes({ param }: PageProps) {
  const me = useMe();
  const { s, date, status } = useToday();
  const absent = teachers(s).filter((t) => ['absent', 'on_leave'].includes(status(t.id)));
  const [teacherId, setTeacherId] = useState(param ?? absent[0]?.id ?? '');
  const [choice, setChoice] = useState<Record<number, string>>({});
  const [informed, setInformed] = useState(true);
  const [scheduled, setScheduled] = useState(true);
  const [msg, setMsg] = useState('');
  const day = todayDay();
  const lessons = s.timetable.filter((t) => t.teacherId === teacherId && t.day === day).sort((a, b) => a.period - b.period);
  const existing = s.substitutions.filter((x) => x.date === date);
  const freeAt = (period: number) => teachers(s).filter((t) => t.id !== teacherId && ['present', 'late'].includes(status(t.id)) && !s.timetable.some((x) => x.teacherId === t.id && x.day === day && x.period === period) && !existing.some((x) => x.substituteId === t.id && x.period === period));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Substitute Teacher Management" subtitle={`${day}, ${fmtDate(date)}. Only teachers who are present and free in that period are offered.`} />
      {msg && <Notice tone="success">{msg}</Notice>}
      <Card title="1. Identify the absent teacher">
        {absent.length === 0 ? <p className="text-sm text-navy-500">No teachers are recorded absent or on leave today.</p> : (
          <div className="flex flex-wrap gap-2">{absent.map((t) => <button key={t.id} type="button" onClick={() => { setTeacherId(t.id); setChoice({}); }} className={`px-4 py-2 rounded-lg border text-sm ${teacherId === t.id ? 'bg-navy-800 text-white border-navy-800' : 'border-navy-200'}`}>{t.name} · <span className="opacity-80">{status(t.id).replace('_', ' ')}</span></button>)}</div>
        )}
      </Card>
      {teacherId && (
        <Card title={`2. ${staffName(s, teacherId)}'s scheduled lessons today`}>
          <Table head={['Period', 'Class', 'Subject', 'Room', 'Substitute']}>
            {lessons.map((l) => {
              const done = existing.find((x) => x.absentTeacherId === teacherId && x.period === l.period);
              return <tr key={l.period}><td>P{l.period} · {lessonBlocks(s)[l.period - 1] ? blockTime(lessonBlocks(s)[l.period - 1]) : ''}</td><td>{className(l.grade, l.section)}</td><td>{l.subject}</td><td>{l.room}</td><td>{done ? <Pill tone="success">{staffName(s, done.substituteId)}</Pill> : <select aria-label={`Substitute for period ${l.period}`} className="input py-1.5 text-sm" value={choice[l.period] ?? ''} onChange={(e) => setChoice({ ...choice, [l.period]: e.target.value })}><option value="">Select substitute</option>{freeAt(l.period).map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subjects.join(', ')})</option>)}</select>}</td></tr>;
            })}
          </Table>
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} /> 3. Update the class schedule for today</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={informed} onChange={(e) => setInformed(e.target.checked)} /> 4. Inform the affected students (in-app notification)</label>
          </div>
          <div className="flex justify-end mt-4"><button type="button" className="btn-primary" disabled={!Object.values(choice).some(Boolean)} onClick={() => {
            lessons.forEach((l) => { const sub = choice[l.period]; if (sub) actions.addSubstitution({ date, absentTeacherId: teacherId, day, period: l.period, grade: l.grade, section: l.section, subject: l.subject, substituteId: sub, studentsInformed: informed, scheduleUpdated: scheduled }); });
            actions.addOpsLog({ kind: 'activity', title: `Substitutes arranged for ${staffName(s, teacherId)}`, detail: `${Object.values(choice).filter(Boolean).length} lesson(s) covered`, by: me.name, status: 'completed' });
            setMsg('Substitutes assigned and notified.'); setChoice({});
          }}>Assign substitutes</button></div>
        </Card>
      )}
      <Card title="Today's substitutions">
        <Table head={['Period', 'Class', 'Subject', 'Absent teacher', 'Substitute', 'Students informed']}>
          {existing.map((x) => <tr key={x.id}><td>P{x.period}</td><td>{className(x.grade, x.section)}</td><td>{x.subject}</td><td>{staffName(s, x.absentTeacherId)}</td><td>{staffName(s, x.substituteId)}</td><td>{x.studentsInformed ? 'Yes' : <button type="button" className="text-sm text-navy-700 underline" onClick={() => actions.updateSubstitution(x.id, { studentsInformed: true })}>Mark informed</button>}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

function OpsLogPage({ kind, title, subtitle, placeholder }: { kind: 'activity' | 'movement' | 'incident' | 'meeting'; title: string; subtitle: string; placeholder: string }) {
  const s = useSchool();
  const me = useMe();
  const [form, setForm] = useState({ title: '', detail: '', date: '' });
  const list = s.opsLog.filter((o) => o.kind === kind || (kind === 'activity' && o.kind === 'meeting'));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={title} subtitle={subtitle} />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <Table head={['When', 'Entry', 'Details', 'Recorded by', 'Status']}>
            {list.map((o) => <tr key={o.id}><td className="text-xs">{fmtDate(o.date ?? o.at)}</td><td className="font-medium">{o.kind === 'meeting' && <Pill tone="accent">Meeting</Pill>} {o.title}</td><td className="text-sm">{o.detail}</td><td className="text-xs">{o.by}</td><td>{o.status === 'resolved' || o.status === 'completed' ? <Pill tone="success">{o.status}</Pill> : <Pill tone="warning">{o.status}</Pill>}</td></tr>)}
          </Table>
        </Card>
        <Card title="Record new">
          <div className="space-y-3">
            <input className="input" placeholder={placeholder} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Title" />
            <textarea className="input min-h-[90px]" placeholder="Details" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} aria-label="Details" />
            {kind === 'activity' && <label className="block"><span className="label">Meeting date (only for meetings)</span><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>}
            <button type="button" className="btn-primary w-full" disabled={!form.title} onClick={() => { actions.addOpsLog({ kind: kind === 'activity' && form.date ? 'meeting' : kind, title: form.title, detail: form.detail, by: me.name, status: form.date ? 'scheduled' : kind === 'incident' ? 'open' : 'recorded', date: form.date || undefined }); setForm({ title: '', detail: '', date: '' }); }}>Save</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export const DailyActivities = () => <OpsLogPage kind="activity" title="Daily Activities" subtitle="Assemblies, events, supervision duties and scheduled meetings." placeholder="e.g. Morning assembly" />;
export const OperationalIncidents = () => <OpsLogPage kind="incident" title="Incident Reports" subtitle="Operational incidents (facilities, safety, power, transport). Student misconduct goes to the Dean." placeholder="e.g. Generator failure" />;

export function StudentMovement() {
  const s = useSchool();
  const [tab, setTab] = useState<'log' | 'late'>('log');
  const late = activeStudents(s).filter((x) => studentAttendance(x.id, lastSchoolDay()) === 'late');
  return (
    <div className="space-y-6">
      <Tabs tabs={[{ id: 'log', label: 'Movement and supervision log' }, { id: 'late', label: 'Late arrivals today', count: late.length }]} value={tab} onChange={setTab} />
      {tab === 'log' ? <OpsLogPage kind="movement" title="Student Movement and Supervision" subtitle="Class movements, excursions, early dismissals and supervision duties." placeholder="e.g. Grade 12A to science lab" /> : (
        <Card title={`Late arrivals — ${fmtDate(lastSchoolDay())}`}><Table head={['Student', 'Class', 'Guardian']}>{late.map((x) => <tr key={x.id}><td>{x.name}</td><td>{className(x.grade, x.section)}</td><td>{x.guardianName} · {x.guardianPhone}</td></tr>)}</Table></Card>
      )}
    </div>
  );
}

export function StaffReports() {
  const me = useMe();
  const { s, date, status } = useToday();
  const absent = teachers(s).filter((t) => ['absent', 'on_leave'].includes(status(t.id)));
  const subsToday = s.substitutions.filter((x) => x.date === date).length;
  const incidents = s.opsLog.filter((o) => o.kind === 'incident' && o.at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const att = attendanceSummary(activeStudents(s).map((x) => x.id), [date]);
  const [summary, setSummary] = useState(`Teachers absent/on leave: ${absent.map((t) => t.name).join(', ') || 'none'}. ${subsToday} lesson(s) covered by substitutes. Student attendance ${att.rate}% (${att.absent} absent, ${att.late} late). `);
  const [sent, setSent] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Staff Reports" subtitle="Submit the daily operations report to the Principal." />
      <Card title={`Daily report — ${fmtDate(date)}`}>
        <textarea className="input min-h-[140px]" value={summary} onChange={(e) => setSummary(e.target.value)} aria-label="Report" />
        <div className="flex justify-between items-center mt-3">
          {sent ? <Notice tone="success">Submitted. The Principal has been notified.</Notice> : <span className="text-xs text-navy-400">Pre-filled from today's records; edit before sending.</span>}
          <button type="button" className="btn-primary" disabled={!summary.trim()} onClick={() => { actions.submitStaffReport({ date, author: me.name, summary, teachersAbsent: absent.length, incidents }); setSent(true); }}><Send className="w-4 h-4" /> Submit to Principal</button>
        </div>
      </Card>
      <Card title="Previous reports">
        {s.staffReports.map((r) => <div key={r.id} className="py-3 border-b border-navy-100 last:border-0"><p className="text-sm font-medium">{fmtDate(r.date)}</p><p className="text-sm text-navy-700">{r.summary}</p></div>)}
      </Card>
      <Card title="Staff attendance summary (last 20 days)">
        <Table head={['Teacher', 'Present', 'Late', 'Absent', 'Rate']}>
          {teachers(s).map((t) => { const h = s.staffAttendance.filter((a) => a.staffId === t.id); const c = (x: string) => h.filter((a) => a.status === x).length; return <tr key={t.id}><td>{t.name}</td><td>{c('present')}</td><td>{c('late')}</td><td>{c('absent')}</td><td>{Math.round(((c('present') + c('late')) / Math.max(1, h.length)) * 100)}%</td></tr>; })}
        </Table>
      </Card>
    </div>
  );
}

