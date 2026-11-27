import { useMemo, useState } from 'react';
import {
  AlertTriangle, Award, BookOpenCheck, CheckCircle2, Download, FileBadge, FileSpreadsheet, GraduationCap, Layers,
  Printer, Send, Users,
} from 'lucide-react';
import {
  actions, activeStudents, allSections, attendanceSummary, batchStage, BATCH_LABEL, blockTime, CATEGORY_LABEL, categoryFor, className,
  fmtDate, GRADEBOOK_LABEL, gradesOf, letterFor, notificationsFor, roster, schoolDays, schoolPerformance, sectionsOf,
  staffName, studentAverage, studentById, subjectTotals, teachers, useSchool, validateSection,
} from '@/store/store';
import { subjectsForGrade } from '@/store/seed';
import type { GradingConfig, ReportBatch, ReportTemplate } from '@/store/types';
import { downloadCsv, printHtml, tableHtml } from '@/store/files';
import {
  CAT_COLORS, Card, ClassSectionPicker, Dialog, Header, Meter, Notice, Pill, SearchBox, StackedBars, Stat, Table, Tabs, catTone,
} from '@/components/kit';
import { ReportCardView } from '@/components/ReportCard';
import { AttendanceHistory, GradebookDialog, gradebookTone } from './common';
import { CalendarPage, greeting, useMe, type PageProps } from './shared';
import { SchoolTemplateUpload } from './schoolTemplate';
import { reportCardDocx, zipFiles } from '@/store/docxTemplate';
import { downloadBlob } from '@/store/files';

const stageTone = (s: string) => (s === 'released' ? 'success' : s === 'authorized' ? 'accent' : s === 'submitted' ? 'warning' : s === 'returned' ? 'error' : s === 'in_progress' ? 'navy' : 'muted');

/* ================================== DASHBOARD ================================== */

export function AcademicDashboard({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const perf = schoolPerformance(s);
  const generatedKeys = new Set(s.batches.map((b) => b.key));
  const awaitingProcessing = s.gradebooks.filter((g) => g.status === 'approved' && !generatedKeys.has(`${g.grade}${g.section}`)).length;
  const inProgressSheets = s.batches.filter((b) => b.status === 'in_progress' || b.status === 'returned').reduce((a, b) => a + Object.keys(b.sheets).length, 0);
  const submitted = s.batches.filter((b) => b.status === 'submitted').length;
  const authorized = s.batches.filter((b) => b.status === 'authorized').length;
  const releasedCards = s.batches.filter((b) => b.status === 'released').reduce((a, b) => a + Object.keys(b.sheets).length, 0);
  const attention = perf.rows.filter((r) => categoryFor(r.avg, s.grading) === 'at_risk').length;
  const notes = notificationsFor(s, me).slice(0, 7);
  const activity = [
    ...s.gradebooks.filter((g) => g.submittedAt).map((g) => ({ at: g.status === 'approved' ? g.approvedAt! : g.submittedAt!, desc: g.status === 'approved' ? `Gradebook approved — ${g.subject}` : g.status === 'returned' ? `Gradebook returned — ${g.subject}` : `Gradebook submitted — ${g.subject}`, cls: className(g.grade, g.section), who: g.status === 'approved' ? 'Principal' : staffName(s, g.teacherId), status: GRADEBOOK_LABEL[g.status], link: 'gradebook-processing' })),
    ...s.batches.map((b) => ({ at: b.releasedAt ?? b.authorizedAt ?? b.submittedAt ?? b.generatedAt ?? '', desc: b.history[b.history.length - 1]?.action ?? '', cls: className(b.grade, b.section), who: b.history[b.history.length - 1]?.by ?? '', status: BATCH_LABEL[b.status], link: `report-cards:${b.status === 'in_progress' ? 'progress' : b.status}` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · ${s.school.academicYear} Academic Year${s.school.currentPeriod ? ` · ${s.school.currentPeriod}` : ''} · Academic Officer`} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total Students" value={activeStudents(s).length} sub="Officially enrolled" icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('student-records')} />
        <Stat label="Classes and Sections" value={`${gradesOf(s).length} / ${allSections(s).length}`} sub="Classes / sections" icon={<Layers className="w-5 h-5" />} onClick={() => onNavigate('classes-sections')} />
        <Stat label="Gradebooks Awaiting Processing" value={awaitingProcessing} sub="Approved by the Principal" icon={<FileSpreadsheet className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('gradebook-processing')} />
        <Stat label="Gradesheets in Progress" value={inProgressSheets} sub="Being generated or reviewed" icon={<BookOpenCheck className="w-5 h-5" />} onClick={() => onNavigate('report-cards:progress')} />
        <Stat label="Awaiting Principal Review" value={submitted} sub="Class batches submitted" icon={<Send className="w-5 h-5" />} tone="accent" onClick={() => onNavigate('report-cards:submitted')} />
        <Stat label="Authorized for Release" value={authorized} sub="Ready for you to release" icon={<CheckCircle2 className="w-5 h-5" />} tone="success" onClick={() => onNavigate('report-cards:authorized')} />
        <Stat label="Released Report Cards" value={releasedCards} sub="Delivered to students and guardians" icon={<FileBadge className="w-5 h-5" />} onClick={() => onNavigate('report-cards:released')} />
        <Stat label="Academic Performance" value={`${perf.overall}%`} sub={<><Pill tone={catTone(perf.category)}>{CATEGORY_LABEL[perf.category]}</Pill> <span className="ml-1">{perf.rows.filter((r) => categoryFor(r.avg, s.grading) === 'good').length} doing well · {attention} need attention</span></>} icon={<GraduationCap className="w-5 h-5" />} tone={catTone(perf.category)} onClick={() => onNavigate('performance')} />
      </div>
      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6">
        <Card title="Academic activity">
          <Table head={['Activity', 'Class', 'Date', 'By', 'Status', '']}>
            {activity.map((a, i) => <tr key={i}><td>{a.desc}</td><td>{a.cls}</td><td className="text-xs">{fmtDate(a.at)}</td><td className="text-xs">{a.who}</td><td><Pill tone="navy">{a.status}</Pill></td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => onNavigate(a.link)}>Open</button></td></tr>)}
          </Table>
        </Card>
        <Card title="Notifications" action={<button type="button" className="text-sm text-navy-600 hover:underline" onClick={() => onNavigate('notifications')}>View all</button>}>
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.id}><button type="button" onClick={() => { actions.markRead(n.id, me.id); if (n.link) onNavigate(n.link); }} className="w-full text-left rounded-lg p-2 hover:bg-navy-50">
                <p className={`text-sm ${n.readBy.includes(me.id) ? 'text-navy-600' : 'font-semibold text-navy-900'}`}>{n.title}</p>
                <p className="text-xs text-navy-500">{fmtDate(n.createdAt)}</p>
              </button></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ============================== ACADEMIC STRUCTURE ============================== */

export function AcademicStructure() {
  const s = useSchool();
  const year = s.years.find((y) => y.status === 'current')!;
  const [form, setForm] = useState({ name: '', kind: 'marking_period' as 'semester' | 'marking_period' | 'term', start: '', end: '' });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Academic Structure" subtitle="Academic years and the school's own period structure (semesters, terms or marking periods)." />
      <Card title={`Current academic year: ${year.name}`} subtitle={`${fmtDate(year.start)} – ${fmtDate(year.end)}`}>
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <label><span className="label">Current academic period</span>
            <select className="input py-2 text-sm min-w-[240px]" value={s.school.currentPeriod ?? ''} onChange={(e) => actions.setCurrentPeriod(e.target.value || null)}>
              <option value="">Not configured (no period shown)</option>
              {year.periods.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </label>
          <p className="text-xs text-navy-500 pb-2">The selected period appears in every workspace header. Leave it unset until the school confirms its current period.</p>
        </div>
        <Table head={['Period', 'Type', 'Belongs to', 'Start', 'End', 'Status']}>
          {year.periods.map((p) => {
            const today = new Date().toISOString().slice(0, 10);
            const st = today < p.start ? 'Upcoming' : today > p.end ? 'Completed' : 'In progress';
            return <tr key={p.id}><td className="font-medium">{p.name}</td><td>{p.kind.replace('_', ' ')}</td><td>{year.periods.find((x) => x.id === p.parent)?.name ?? '—'}</td><td>{fmtDate(p.start)}</td><td>{fmtDate(p.end)}</td><td><Pill tone={st === 'In progress' ? 'success' : st === 'Upcoming' ? 'navy' : 'muted'}>{st}</Pill></td></tr>;
          })}
        </Table>
      </Card>
      <Card title="Add a period">
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <label className="sm:col-span-2"><span className="label">Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Third Term" /></label>
          <label><span className="label">Type</span><select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}><option value="semester">Semester</option><option value="term">Term</option><option value="marking_period">Marking period</option></select></label>
          <label><span className="label">Start</span><input type="date" className="input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
          <label><span className="label">End</span><input type="date" className="input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
        </div>
        <div className="flex justify-end mt-3"><button type="button" className="btn-primary" disabled={!form.name || !form.start || !form.end || form.end < form.start} onClick={() => { actions.addPeriod(year.id, form); setForm({ name: '', kind: 'marking_period', start: '', end: '' }); }}>Add period</button></div>
      </Card>
      <Card title="Historical academic years">
        <Table head={['Year', 'Start', 'End', 'Status']}>
          {s.years.map((y) => <tr key={y.id}><td className="font-medium">{y.name}</td><td>{fmtDate(y.start)}</td><td>{fmtDate(y.end)}</td><td><Pill tone={y.status === 'current' ? 'success' : 'muted'}>{y.status}</Pill></td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

export function AcademicCalendarPage(props: PageProps) {
  return <CalendarPage {...props} editable />;
}

/* ============================== CLASSES AND SECTIONS ============================== */

export function ClassesSections() {
  const s = useSchool();
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const kids = grade != null && section ? roster(s, grade, section) : [];
  const sponsor = s.staff.find((t) => t.sponsorOf === `${grade}${section}`);
  const avgs = kids.map((k) => studentAverage(s, k.id)).filter((x): x is number => x != null);
  const avg = avgs.length ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10 : 0;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Classes and Sections" back={grade != null ? { label: section ? `Grade ${grade}` : 'All classes', onClick: () => (section ? setSection(null) : setGrade(null)) } : undefined} />
      {grade == null && <AddSection />}
      {grade == null && (
        <Card>
          <Table head={['Class', 'Level', 'Sections', 'Total students', '']}>
            {gradesOf(s).map((g) => <tr key={g}><td className="font-medium">Grade {g}</td><td>{g <= 9 ? 'Junior High' : 'Senior High'}</td><td>{sectionsOf(s, g).join(', ')}</td><td>{roster(s, g).length}</td><td><button type="button" className="text-sm font-medium text-navy-700 hover:underline" onClick={() => setGrade(g)}>Open</button></td></tr>)}
          </Table>
        </Card>
      )}
      {grade != null && !section && (
        <div className="grid sm:grid-cols-3 gap-4">
          {sectionsOf(s, grade).map((sec) => (
            <button key={sec} type="button" className="card p-5 text-left hover:border-navy-300" onClick={() => setSection(sec)}>
              <p className="font-semibold text-lg text-navy-900">Grade {grade}{sec}</p>
              <p className="text-sm text-navy-500">{roster(s, grade, sec).length} students</p>
              <div className="mt-2"><Pill tone={stageTone(batchStage(s, grade, sec))}>{BATCH_LABEL[batchStage(s, grade, sec)]}</Pill></div>
            </button>
          ))}
        </div>
      )}
      {grade != null && section && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat label="Class sponsor" value={<span className="text-base">{sponsor?.name ?? 'Not assigned'}</span>} />
            <Stat label="Students enrolled" value={kids.length} />
            <Stat label="Class average" value={`${avg}%`} tone={catTone(categoryFor(avg, s.grading))} />
            <Stat label="Report cards" value={<span className="text-base">{BATCH_LABEL[batchStage(s, grade, section)]}</span>} />
          </div>
          <Card title="Subjects, teachers and gradebook status">
            <Table head={['Subject', 'Teacher', 'Periods / week', 'Gradebook']}>
              {subjectsForGrade(grade).map((sub) => {
                const a = s.assignments.find((x) => x.grade === grade && x.section === section && x.subject === sub);
                const g = s.gradebooks.find((x) => x.grade === grade && x.section === section && x.subject === sub);
                return <tr key={sub}><td className="font-medium">{sub}</td><td>{a?.teacherId ? staffName(s, a.teacherId) : <Pill tone="error">Unassigned</Pill>}</td><td>{s.timetable.filter((t) => t.grade === grade && t.section === section && t.subject === sub).length}</td><td>{g ? <Pill tone={gradebookTone(g.status)}>{GRADEBOOK_LABEL[g.status]}</Pill> : '—'}</td></tr>;
              })}
            </Table>
          </Card>
          <Card title="Weekly timetable"><SectionTimetable grade={grade} section={section} /></Card>
          <Card title="Students">
            <Table head={['Student ID', 'Name', 'Gender', 'Average']}>
              {kids.map((k) => { const a = studentAverage(s, k.id); return <tr key={k.id}><td className="font-mono text-xs">{k.studentNo}</td><td>{k.name}</td><td>{k.gender}</td><td>{a != null ? <Pill tone={catTone(categoryFor(a, s.grading))}>{a}%</Pill> : '—'}</td></tr>; })}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}

function AddSection() {
  const [g, setG] = useState('7');
  const [sec, setSec] = useState('');
  const [ok, setOk] = useState('');
  return (
    <Card title="Add a class or section">
      <div className="flex flex-wrap items-end gap-3">
        <label><span className="label">Grade</span><select className="input py-2 text-sm" value={g} onChange={(e) => setG(e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Grade {n}</option>)}</select></label>
        <label><span className="label">Section</span><input className="input py-2 text-sm w-24 uppercase" maxLength={1} value={sec} onChange={(e) => setSec(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="A" /></label>
        <button type="button" className="btn-primary text-sm" disabled={!sec} onClick={() => { actions.addSection(Number(g), sec); setOk(`Grade ${g}${sec} added.`); setSec(''); }}>Add</button>
        {ok && <span className="text-sm text-success-700">{ok}</span>}
      </div>
    </Card>
  );
}

export function SectionTimetable({ grade, section, teacherId }: { grade?: number; section?: string; teacherId?: string }) {
  const s = useSchool();
  const slots = s.timetable.filter((t) => (teacherId ? t.teacherId === teacherId : t.grade === grade && t.section === section));
  const days = s.schedule.days;
  let lesson = 0;
  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-6">
      {s.schedule.status === 'draft' && <p className="px-5 sm:px-6 pb-2 text-xs text-warning-700">Draft timetable — changes are being prepared by the Vice Principal.</p>}
      <table className="min-w-full text-xs">
        <thead><tr className="bg-navy-50"><th className="px-3 py-2 text-left text-navy-600">Time</th>{days.map((d) => <th key={d} className="px-3 py-2 text-left text-navy-600">{d}</th>)}</tr></thead>
        <tbody>
          {s.schedule.blocks.map((b) => {
            if (b.kind !== 'lesson') {
              return <tr key={b.id} className="border-t border-navy-100 bg-navy-50/60"><td className="px-3 py-1.5 whitespace-nowrap text-navy-500">{blockTime(b)}</td><td colSpan={days.length} className="px-3 py-1.5 text-center font-medium text-navy-600 uppercase tracking-wide text-[11px]">{b.label}</td></tr>;
            }
            lesson += 1;
            const n = lesson;
            return (
              <tr key={b.id} className="border-t border-navy-100">
                <td className="px-3 py-2 whitespace-nowrap text-navy-500">{blockTime(b)}<span className="block text-[10px] text-navy-400">{b.label}</span></td>
                {days.map((d) => {
                  const here = slots.filter((x) => x.day === d && x.period === n);
                  return <td key={d} className="px-3 py-2 align-top">{here.map((x, i) => <div key={i} className={x.subject === 'Study Hall' ? 'text-navy-400' : ''}><span className="font-medium text-navy-800">{x.subject}</span>{teacherId ? <span className="text-navy-500"> – {x.grade}{x.section}</span> : <span className="block text-navy-500">{x.teacherId ? staffName(s, x.teacherId) : 'No teacher'}</span>}<span className="block text-navy-400">{x.room}</span></div>)}{!here.length && <span className="text-navy-300">—</span>}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================ SUBJECTS / ASSIGNMENTS ============================ */

export function SubjectsCourses() {
  const s = useSchool();
  const subjects = [...new Set(s.assignments.map((a) => a.subject))];
  const code = (n: string) => n.split(' ').map((w) => w.slice(0, 4).toUpperCase()).join('-');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Subjects and Courses" subtitle="School-configured curriculum. Junior and senior high offer different subjects." />
      <Card>
        <Table head={['Subject', 'Code', 'Grade levels', 'Assigned teachers', 'Status']}>
          {subjects.map((sub) => {
            const rows = s.assignments.filter((a) => a.subject === sub);
            const grades = [...new Set(rows.map((r) => r.grade))];
            const missing = rows.filter((r) => !r.teacherId).length;
            return <tr key={sub}><td className="font-medium">{sub}</td><td className="font-mono text-xs">{code(sub)}</td><td>{grades.map((g) => `G${g}`).join(', ')}</td><td className="text-sm">{[...new Set(rows.filter((r) => r.teacherId).map((r) => staffName(s, r.teacherId)))].join(', ')}</td><td>{missing ? <Pill tone="warning">{missing} section(s) unassigned</Pill> : <Pill tone="success">Active</Pill>}</td></tr>;
          })}
        </Table>
      </Card>
    </div>
  );
}

export function TeacherAssignments() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const conflicts = useMemo(() => {
    const seen = new Map<string, number>();
    s.timetable.forEach((t) => { if (t.teacherId) { const k = `${t.teacherId}|${t.day}|${t.period}`; seen.set(k, (seen.get(k) ?? 0) + 1); } });
    return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k.split('|'));
  }, [s.timetable]);
  const missing = s.assignments.filter((a) => !a.teacherId);
  const rows = s.assignments.filter((a) => a.teacherId && `${staffName(s, a.teacherId)} ${a.subject} ${a.grade}${a.section}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Teacher Academic Assignments" subtitle={`${s.school.academicYear}${s.school.currentPeriod ? ` · ${s.school.currentPeriod}` : ''}`} />
      {missing.length > 0 && <Notice tone="warning"><b>Missing assignments:</b> {missing.map((m) => `${className(m.grade, m.section)} ${m.subject}`).join(', ')}. Coordinate with the Vice Principal to assign a teacher.</Notice>}
      {conflicts.length > 0 ? <Notice tone="error">{conflicts.length} timetable conflict(s) detected.</Notice> : <Notice tone="success">No teacher timetable conflicts detected.</Notice>}
      <AssignTeacher />
      <div className="max-w-sm"><SearchBox value={q} onChange={setQ} placeholder="Filter by teacher, subject or class" /></div>
      <Card>
        <Table head={['Teacher', 'Staff ID', 'Class', 'Section', 'Subject', 'Academic year']}>
          {rows.map((a) => { const t = s.staff.find((x) => x.id === a.teacherId); return <tr key={`${a.grade}${a.section}${a.subject}`}><td className="font-medium">{t?.name}</td><td className="font-mono text-xs">{t?.staffNo}</td><td>Grade {a.grade}</td><td>{a.section}</td><td>{a.subject}</td><td>{s.school.academicYear}</td></tr>; })}
        </Table>
      </Card>
    </div>
  );
}

function AssignTeacher() {
  const s = useSchool();
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [ok, setOk] = useState('');
  return (
    <Card title="Assign a teacher to a class subject" subtitle="Assignments control what each teacher sees and which gradebooks they submit.">
      <div className="flex flex-wrap items-end gap-3">
        <ClassSectionPicker grade={grade} section={section} onChange={(g, x) => { setGrade(g); setSection(x); }} />
        <label><span className="label">Subject</span><input className="input py-2 text-sm" list="subjects-list" value={subject} onChange={(e) => setSubject(e.target.value)} /><datalist id="subjects-list">{(grade ? subjectsForGrade(grade) : []).map((x) => <option key={x} value={x} />)}</datalist></label>
        <label><span className="label">Teacher</span><select className="input py-2 text-sm" value={teacher} onChange={(e) => setTeacher(e.target.value)}><option value="">Select</option>{teachers(s).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <button type="button" className="btn-primary text-sm" disabled={grade == null || !section || !subject || !teacher} onClick={() => { actions.setTeacherAssignment(grade!, section!, subject, teacher); setOk(`${staffName(s, teacher)} assigned to Grade ${grade}${section} ${subject}.`); }}>Assign</button>
      </div>
      {ok && <p className="text-sm text-success-700 mt-2">{ok}</p>}
    </Card>
  );
}

/* ============================== EXAMINATIONS ============================== */

export function ExaminationManagement() {
  const s = useSchool();
  const [tab, setTab] = useState<'schedule' | 'missing' | 'national'>('schedule');
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const exams = s.exams.filter((e) => e.kind !== 'National' && (grade == null || e.grade === grade) && (section == null || e.section === section));
  const missing = s.exams.filter((e) => e.status === 'missing_records');
  const tone = (st: string) => (st === 'marks_submitted' ? 'success' : st === 'missing_records' ? 'error' : st === 'completed' ? 'navy' : 'muted');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Examination Management" subtitle="Internal assessment schedule and completion status. National examinations are tracked separately." />
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Scheduled" value={s.exams.filter((e) => e.status === 'scheduled' && e.kind !== 'National').length} />
        <Stat label="Marks submitted" value={s.exams.filter((e) => e.status === 'marks_submitted').length} tone="success" />
        <Stat label="Missing records" value={missing.length} tone="error" onClick={() => setTab('missing')} />
        <Stat label="National exams" value={s.exams.filter((e) => e.kind === 'National').length} tone="accent" onClick={() => setTab('national')} />
      </div>
      <Tabs tabs={[{ id: 'schedule', label: 'Examination schedule' }, { id: 'missing', label: 'Missing records', count: missing.length }, { id: 'national', label: 'National examinations' }]} value={tab} onChange={setTab} />
      {tab === 'schedule' && (
        <Card action={<ClassSectionPicker grade={grade} section={section} allowAllSections onChange={(g, x) => { setGrade(g); setSection(x); }} />}>
          <Table head={['Examination', 'Type', 'Class', 'Subject', 'Teacher', 'Date', 'Max', 'Status']}>
            {exams.slice(0, 120).map((e) => { const a = s.assignments.find((x) => x.grade === e.grade && x.section === e.section && x.subject === e.subject); return <tr key={e.id}><td className="font-medium">{e.name}</td><td>{e.kind}</td><td>{className(e.grade, e.section)}</td><td>{e.subject}</td><td className="text-xs">{a?.teacherId ? staffName(s, a.teacherId) : '—'}</td><td>{fmtDate(e.date)}</td><td>{e.maxMarks}</td><td><Pill tone={tone(e.status)}>{e.status.replace('_', ' ')}</Pill></td></tr>; })}
          </Table>
        </Card>
      )}
      {tab === 'missing' && (
        <Card><Table head={['Class', 'Subject', 'Examination', 'Teacher', 'Gradebook']}>
          {missing.map((e) => { const g = s.gradebooks.find((x) => x.grade === e.grade && x.section === e.section && x.subject === e.subject); return <tr key={e.id}><td>{className(e.grade, e.section)}</td><td>{e.subject}</td><td>{e.name}</td><td>{g ? staffName(s, g.teacherId) : '—'}</td><td>{g && <Pill tone={gradebookTone(g.status)}>{GRADEBOOK_LABEL[g.status]}</Pill>}</td></tr>; })}
        </Table></Card>
      )}
      {tab === 'national' && (
        <Card>
          <Notice>National examination results (LPSCE, LJHSCE, WASSCE) are recorded separately and are never treated as an ordinary classroom gradebook.</Notice>
          <div className="mt-4"><Table head={['Examination', 'Candidates', 'Date', 'Status']}>
            {s.exams.filter((e) => e.kind === 'National').map((e) => <tr key={e.id}><td className="font-medium">{e.name}</td><td>{roster(s, e.grade).length} (Grade {e.grade})</td><td>{fmtDate(e.date)}</td><td><Pill>{e.status}</Pill></td></tr>)}
          </Table></div>
        </Card>
      )}
    </div>
  );
}

/* ============================== GRADEBOOK PROCESSING ============================== */

export function GradebookProcessing({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const [tab, setTab] = useState<'approved' | 'processing' | 'completed'>('approved');
  const [sel, setSel] = useState<{ grade: number; section: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mapping, setMapping] = useState(false);
  const generated = new Set(s.batches.map((b) => b.key));
  const waiting = allSections(s).filter(({ grade, section }) => !generated.has(`${grade}${section}`) && s.gradebooks.some((g) => g.grade === grade && g.section === section && g.status === 'approved'));
  const processing = s.batches.filter((b) => b.status === 'in_progress' || b.status === 'returned');
  const completed = s.batches.filter((b) => ['submitted', 'authorized', 'released'].includes(b.status));
  const open = s.gradebooks.find((g) => g.id === openId) ?? null;
  const books = sel ? s.gradebooks.filter((g) => g.grade === sel.grade && g.section === sel.section) : [];
  const allApproved = books.length > 0 && books.every((g) => g.status === 'approved');
  const v = sel ? validateSection(s, sel.grade, sel.section) : null;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Gradebook Processing" subtitle="Gradebooks approved by the Principal arrive here. Validate them, then generate individual gradesheets." />
      <Tabs tabs={[{ id: 'approved', label: 'Approved Gradebooks', count: waiting.length }, { id: 'processing', label: 'Processing', count: processing.length }, { id: 'completed', label: 'Completed', count: completed.length }]} value={tab} onChange={setTab} />
      {tab === 'approved' && (
        <>
          <Card title="Class sections with approved gradebooks" subtitle="Grouped by class and section. A section can be processed once every subject is approved.">
            <Table head={['Class', 'Section', 'Approved', 'Awaiting Principal', 'Not submitted', 'Status', '']}>
              {waiting.map(({ grade, section }) => {
                const gbs = s.gradebooks.filter((g) => g.grade === grade && g.section === section);
                const c = (st: string) => gbs.filter((g) => g.status === st).length;
                const stage = batchStage(s, grade, section);
                return <tr key={`${grade}${section}`}><td className="font-medium">Grade {grade}</td><td>{section}</td><td>{c('approved')} / {gbs.length}</td><td>{c('submitted')}</td><td>{c('draft') + c('returned')}</td><td><Pill tone={stage === 'awaiting_processing' ? 'warning' : 'muted'}>{stage === 'awaiting_processing' ? 'Approved — Awaiting Processing' : 'Waiting for remaining subjects'}</Pill></td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => setSel({ grade, section })}>Open</button></td></tr>;
              })}
            </Table>
          </Card>
          {sel && (
            <Card title={`Grade ${sel.grade} → Section ${sel.section}`} subtitle={`${s.school.academicYear}${s.school.currentPeriod ? ` · ${s.school.currentPeriod}` : ''}`} action={<button type="button" className="text-sm text-navy-600" onClick={() => setSel(null)}>Close</button>}>
              <Table head={['Subject', 'Submitted by', 'Submitted', 'Principal approval', 'Status', '']}>
                {books.map((g) => <tr key={g.id}><td className="font-medium">{g.subject}</td><td>{staffName(s, g.teacherId)}</td><td className="text-xs">{fmtDate(g.submittedAt)}</td><td className="text-xs">{fmtDate(g.approvedAt)}</td><td><Pill tone={gradebookTone(g.status)}>{g.status === 'approved' ? 'Approved — Awaiting Processing' : GRADEBOOK_LABEL[g.status]}</Pill></td><td><button type="button" className="btn-secondary text-xs py-1.5" disabled={g.status === 'draft'} onClick={() => setOpenId(g.id)}>Open Gradebook</button></td></tr>)}
              </Table>
              {v && (
                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Validation summary</h3>
                    <ul className="text-sm space-y-1.5">
                      <li>✔ {v.identified} students identified across {v.subjects} subject gradebooks</li>
                      <li>✔ {v.matched} records matched to official student IDs</li>
                      <li>✔ {v.duplicates} duplicate records</li>
                      <li className={v.missing.length ? 'text-error-700' : ''}>{v.missing.length ? '✖' : '✔'} {v.missing.length} missing mark(s)</li>
                      <li className={v.notEnrolled.length ? 'text-warning-700' : ''}>{v.notEnrolled.length ? '⚠' : '✔'} {v.notEnrolled.length} student(s) no longer enrolled in this class</li>
                      <li className={v.invalid.length ? 'text-error-700' : ''}>{v.invalid.length ? '✖' : '✔'} {v.invalid.length} mark(s) outside 0–100</li>
                      <li className={v.unmatched.length ? 'text-warning-700' : ''}>{v.unmatched.length ? '⚠' : '✔'} {v.unmatched.length} enrolled student(s) with no marks</li>
                    </ul>
                    {v.missing.length > 0 && <div className="mt-3"><Notice tone="error">{v.missing.map((m) => `${studentById(s, m.studentId)?.name} (${studentById(s, m.studentId)?.studentNo}) — ${m.subject}, ${m.field}`).join('; ')}. These gradesheets will be flagged “Requires Correction”. Approved marks are never changed automatically — the subject gradebook must be corrected and re-approved.</Notice></div>}
                    {v.notEnrolled.length > 0 && <div className="mt-3"><Notice tone="warning">{v.notEnrolled.map((id) => `${studentById(s, id)?.name}: ${studentById(s, id)?.statusNote ?? 'not enrolled'}`).join('; ')}. No gradesheet will be generated for students who are no longer enrolled.</Notice></div>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Generate gradesheets</h3>
                    <p className="text-sm text-navy-600 mb-3">The platform matches marks by student ID, keeps each teacher's subject totals unchanged, calculates the overall average using grading configuration v{s.grading.version} ({s.grading.averageMethod} average) and fills the school's report-card template.</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-secondary" onClick={() => setMapping(true)}>Mapping preview</button>
                      <button type="button" className="btn-primary" disabled={!allApproved} onClick={() => { actions.generateGradesheets(sel.grade, sel.section, me.name); onNavigate(`report-cards:progress`); }}>Process gradebook — generate {roster(s, sel.grade, sel.section).length} gradesheets</button>
                    </div>
                    {!allApproved && <p className="text-xs text-warning-700 mt-2">Available once every subject gradebook for this section is approved by the Principal.</p>}
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
      {tab === 'processing' && <BatchTable batches={processing} onOpen={() => onNavigate('report-cards:progress')} />}
      {tab === 'completed' && <BatchTable batches={completed} onOpen={(b) => onNavigate(`report-cards:${b.status}`)} />}
      <GradebookDialog gradebook={open} onClose={() => setOpenId(null)} />
      <Dialog open={mapping && !!sel} onClose={() => setMapping(false)} wide="xl" title={`Student ID mapping — Grade ${sel?.grade}${sel?.section}`}>
        {sel && (
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead className="bg-navy-50"><tr><th className="p-2 text-left">Student ID</th><th className="p-2 text-left">Official record</th>{books.map((g) => <th key={g.id} className="p-2">{g.subject}</th>)}<th className="p-2">Match</th></tr></thead>
              <tbody>
                {Object.keys(books[0]?.marks ?? {}).map((sid) => { const st = studentById(s, sid); return <tr key={sid} className="border-t border-navy-100"><td className="p-2 font-mono">{st?.studentNo}</td><td className="p-2">{st?.name} {st?.status !== 'active' && <Pill tone="warning">{st?.status}</Pill>}</td>{books.map((g) => <td key={g.id} className={`p-2 text-center ${g.marks[sid]?.total == null ? 'text-error-600 font-semibold' : ''}`}>{g.marks[sid]?.total ?? 'Missing'}</td>)}<td className="p-2 text-center">{st?.status === 'active' ? '✔' : '—'}</td></tr>; })}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function BatchTable({ batches, onOpen }: { batches: ReportBatch[]; onOpen: (b: ReportBatch) => void }) {
  return (
    <Card>
      <Table head={['Class', 'Gradesheets', 'Reviewed', 'Needs correction', 'Status', 'Updated', '']}>
        {batches.map((b) => { const sh = Object.values(b.sheets); return <tr key={b.key}><td className="font-medium">{className(b.grade, b.section)}</td><td>{sh.length}</td><td>{sh.filter((x) => x.status === 'reviewed').length}</td><td>{sh.filter((x) => x.status === 'requires_correction').length}</td><td><Pill tone={stageTone(b.status)}>{BATCH_LABEL[b.status]}</Pill></td><td className="text-xs">{fmtDate(b.history[b.history.length - 1]?.at)}</td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => onOpen(b)}>Open</button></td></tr>; })}
      </Table>
    </Card>
  );
}

/* ============================== GRADING CONFIGURATION ============================== */

export function GradingConfiguration() {
  const s = useSchool();
  const [g, setG] = useState<GradingConfig>(s.grading);
  const [saved, setSaved] = useState(false);
  const total = g.components.reduce((a, c) => a + Number(c.weight || 0), 0);
  const subjects = [...new Set(s.assignments.map((a) => a.subject))];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Grading Configuration" subtitle={`Active: version ${s.grading.version}, effective ${fmtDate(s.grading.effectiveFrom)}. Saving creates a new version; past results keep the version they were calculated with.`} />
      {saved && <Notice tone="success">Saved as version {s.grading.version}. Previous configuration preserved in history.</Notice>}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Assessment components">
          <Table head={['Component', 'Weight %', 'Max marks']}>
            {g.components.map((c, i) => (
              <tr key={c.key}>
                <td><input className="input py-1.5 text-sm" value={c.name} onChange={(e) => setG({ ...g, components: g.components.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></td>
                <td><input type="number" className="input py-1.5 text-sm w-24" value={c.weight} onChange={(e) => setG({ ...g, components: g.components.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} /></td>
                <td><input type="number" className="input py-1.5 text-sm w-24" value={c.maxMarks} onChange={(e) => setG({ ...g, components: g.components.map((x, j) => (j === i ? { ...x, maxMarks: Number(e.target.value) } : x)) })} /></td>
              </tr>
            ))}
          </Table>
          <div className="mt-3">{total === 100 ? <Notice tone="success">Total weighting: 100%</Notice> : <Notice tone="error">Total weighting is {total}%. It must equal 100% before saving.</Notice>}</div>
          <p className="text-xs text-navy-400 mt-2">Applies to all subjects and grades unless the school configures otherwise.</p>
        </Card>
        <Card title="Grade boundaries">
          <Table head={['Min %', 'Max %', 'Letter', 'Grade point', 'Remark']}>
            {g.boundaries.map((b, i) => {
              const set = (patch: Partial<typeof b>) => setG({ ...g, boundaries: g.boundaries.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
              return <tr key={i}><td><input type="number" className="input py-1.5 text-sm w-20" value={b.min} onChange={(e) => set({ min: Number(e.target.value) })} /></td><td><input type="number" className="input py-1.5 text-sm w-20" value={b.max} onChange={(e) => set({ max: Number(e.target.value) })} /></td><td><input className="input py-1.5 text-sm w-16" value={b.letter} onChange={(e) => set({ letter: e.target.value })} /></td><td><input type="number" step="0.1" className="input py-1.5 text-sm w-20" value={b.point} onChange={(e) => set({ point: Number(e.target.value) })} /></td><td><input className="input py-1.5 text-sm" value={b.remark} onChange={(e) => set({ remark: e.target.value })} /></td></tr>;
            })}
          </Table>
        </Card>
        <Card title="Overall student average">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={g.averageMethod === 'simple'} onChange={() => setG({ ...g, averageMethod: 'simple' })} /> Simple average of subject totals</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={g.averageMethod === 'weighted'} onChange={() => setG({ ...g, averageMethod: 'weighted' })} /> Weighted average (by subject weight)</label>
            {g.averageMethod === 'weighted' && (
              <div className="grid grid-cols-2 gap-2">{subjects.map((sub) => <label key={sub} className="text-sm flex items-center justify-between gap-2">{sub}<input type="number" step="0.5" className="input py-1 w-20" value={g.subjectWeights[sub] ?? 1} onChange={(e) => setG({ ...g, subjectWeights: { ...g.subjectWeights, [sub]: Number(e.target.value) } })} /></label>)}</div>
            )}
            <div className="rounded-lg bg-navy-50 p-3 text-xs text-navy-600">Example: subject totals 82, 75, 90, 68, 71, 88 → simple average = (82+75+90+68+71+88) ÷ 6 = <b>79.0%</b></div>
          </div>
        </Card>
        <Card title="Performance categories">
          <div className="grid grid-cols-3 gap-3">
            <label><span className="label">Pass mark</span><input type="number" className="input" value={g.passMark} onChange={(e) => setG({ ...g, passMark: Number(e.target.value) })} /></label>
            <label><span className="label">At-risk below</span><input type="number" className="input" value={g.atRiskBelow} onChange={(e) => setG({ ...g, atRiskBelow: Number(e.target.value) })} /></label>
            <label><span className="label">Good from</span><input type="number" className="input" value={g.goodFrom} onChange={(e) => setG({ ...g, goodFrom: Number(e.target.value) })} /></label>
          </div>
          <p className="text-xs text-navy-500 mt-2">Used for the At-risk / Moderate / Good–Excellent categories on the Principal's and your dashboards.</p>
        </Card>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setG(s.grading)}>Discard changes</button>
        <button type="button" className="btn-primary" disabled={total !== 100} onClick={() => { actions.saveGrading(g); setSaved(true); }}>Save as new version</button>
      </div>
      <Card title="Configuration history">
        <Table head={['Version', 'Effective from', 'Components', 'Method']}>
          {[s.grading, ...s.gradingHistory.slice().reverse()].map((h) => <tr key={h.version}><td>v{h.version}{h === s.grading && <Pill tone="success">Active</Pill>}</td><td>{fmtDate(h.effectiveFrom)}</td><td className="text-xs">{h.components.map((c) => `${c.name} ${c.weight}%`).join(', ')}</td><td>{h.averageMethod}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

/* ============================== REPORT CARD MANAGEMENT ============================== */

type RCTab = 'templates' | 'progress' | 'completed' | 'submitted' | 'returned' | 'authorized' | 'released' | 'history';

export function ReportCardManagement({ param, onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const initial = (['templates', 'progress', 'completed', 'submitted', 'returned', 'authorized', 'released', 'history'] as RCTab[]).includes(param as RCTab) ? (param as RCTab) : 'progress';
  const [tab, setTab] = useState<RCTab>(initial);
  const [key, setKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'submit' | 'release' | null>(null);
  const [flash, setFlash] = useState('');
  const by = (st: ReportBatch['status'][]) => s.batches.filter((b) => st.includes(b.status));
  const allReviewed = (b: ReportBatch) => Object.values(b.sheets).every((x) => x.status === 'reviewed');
  const lists: Record<Exclude<RCTab, 'templates' | 'history'>, ReportBatch[]> = {
    progress: by(['in_progress', 'returned']).filter((b) => !allReviewed(b)),
    completed: by(['in_progress', 'returned']).filter(allReviewed),
    submitted: by(['submitted']),
    returned: by(['returned']),
    authorized: by(['authorized']),
    released: by(['released']),
  };
  const batch = s.batches.find((b) => b.key === key) ?? null;
  const tabs: { id: RCTab; label: string; count?: number }[] = [
    { id: 'templates', label: 'Report Card Templates' }, { id: 'progress', label: 'Gradesheets in Progress', count: lists.progress.length },
    { id: 'completed', label: 'Completed Gradesheets', count: lists.completed.length }, { id: 'submitted', label: 'Submitted for Principal Review', count: lists.submitted.length },
    { id: 'returned', label: 'Returned for Correction', count: lists.returned.length }, { id: 'authorized', label: 'Authorized for Release', count: lists.authorized.length },
    { id: 'released', label: 'Released Report Cards', count: lists.released.length }, { id: 'history', label: 'Historical Report Cards' },
  ];
  const kids = batch ? roster(s, batch.grade, batch.section) : [];
  const sheets = batch ? Object.entries(batch.sheets) : [];
  const outstanding = batch ? kids.filter((k) => !batch.sheets[k.id] || batch.sheets[k.id].status !== 'reviewed') : [];
  const counts = batch ? { total: kids.length, generated: sheets.length, reviewed: sheets.filter(([, x]) => x.status === 'reviewed').length, errors: sheets.filter(([, x]) => x.status === 'requires_correction').length, draft: sheets.filter(([, x]) => x.status === 'draft').length } : null;
  const canEdit = batch && (batch.status === 'in_progress' || batch.status === 'returned');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Report Card Management" subtitle="Generate, review and submit individual gradesheets; release them after the Principal authorizes." />
      <Tabs tabs={tabs} value={tab} onChange={(t) => { setTab(t); setKey(null); setFlash(''); }} />
      {flash && <Notice tone="success">{flash}</Notice>}
      {tab === 'templates' && <TemplateDesigner />}
      {tab === 'history' && (
        <Card title="Release history">
          <Table head={['Class', 'Students', 'Submitted', 'Authorized by', 'Authorized', 'Released by', 'Released']}>
            {s.batches.filter((b) => b.authorizedAt).map((b) => <tr key={b.key}><td className="font-medium">{className(b.grade, b.section)}</td><td>{Object.keys(b.sheets).length}</td><td>{fmtDate(b.submittedAt)}</td><td>{b.authorizedBy}</td><td>{fmtDate(b.authorizedAt)}</td><td>{b.releasedBy ?? '—'}</td><td>{fmtDate(b.releasedAt)}</td></tr>)}
          </Table>
        </Card>
      )}
      {tab !== 'templates' && tab !== 'history' && !batch && (
        <Card>
          <Table head={['Class', 'Total students', 'Gradesheets', 'Reviewed', 'Status', 'Updated', '']} empty="Nothing here right now.">
            {lists[tab].map((b) => { const sh = Object.values(b.sheets); return <tr key={b.key}><td className="font-medium">{className(b.grade, b.section)}</td><td>{roster(s, b.grade, b.section).length}</td><td>{sh.length}</td><td>{sh.filter((x) => x.status === 'reviewed').length}</td><td><Pill tone={stageTone(b.status)}>{BATCH_LABEL[b.status]}</Pill></td><td className="text-xs">{fmtDate(b.history[b.history.length - 1]?.at)}</td><td><button type="button" className="btn-secondary text-xs py-1.5" onClick={() => setKey(b.key)}>Open</button></td></tr>; })}
          </Table>
          {tab === 'progress' && <p className="text-sm text-navy-500 mt-4">To start a new class, go to <button type="button" className="text-navy-700 underline" onClick={() => onNavigate('gradebook-processing')}>Gradebook Processing</button>.</p>}
        </Card>
      )}
      {batch && counts && (
        <div className="space-y-5">
          <button type="button" className="text-sm text-navy-500 hover:text-navy-800" onClick={() => setKey(null)}>← Back to list</button>
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-navy-900">{className(batch.grade, batch.section)}</h2><Pill tone={stageTone(batch.status)}>{BATCH_LABEL[batch.status]}</Pill></div>
          {batch.returnComment && batch.status === 'returned' && <Notice tone="error"><b>Principal's comments:</b> {batch.returnComment}. Make the permitted corrections, then resubmit.</Notice>}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Total students" value={counts.total} />
            <Stat label="Gradesheets generated" value={counts.generated} />
            <Stat label="Reviewed" value={counts.reviewed} tone="success" />
            <Stat label="Awaiting review" value={counts.draft} tone="warning" />
            <Stat label="Requires correction" value={counts.errors} tone="error" />
          </div>
          <Card title="Individual gradesheets" action={<div className="flex flex-wrap gap-2">{s.reportTemplateFile?.active && <button type="button" className="btn-secondary text-sm" onClick={async () => { const files = (await Promise.all(kids.map(async (k) => ({ name: `${k.studentNo}_${k.name.replace(/\W+/g, '_')}.docx`, blob: await reportCardDocx(s, k.id) })))).filter((f): f is { name: string; blob: Blob } => !!f.blob); downloadBlob(await zipFiles(files), `Report_cards_${batch.grade}${batch.section}.zip`); }}><Download className="w-4 h-4" /> All report cards (.zip, school template)</button>}{canEdit && counts.draft > 0 && <button type="button" className="btn-secondary text-sm" onClick={() => actions.reviewAll(batch.key)}>Mark all drafts as reviewed</button>}</div>}>
            <Table head={['Student ID', 'Student', 'Subjects', 'Overall average', 'Gradesheet status', batch.status === 'released' ? 'Access' : '', '']}>
              {kids.map((k) => {
                const sh = batch.sheets[k.id];
                const avg = studentAverage(s, k.id);
                const n = subjectTotals(s, k.id).length;
                return (
                  <tr key={k.id}>
                    <td className="font-mono text-xs">{k.studentNo}</td><td className="font-medium">{k.name}</td><td>{n}</td><td>{avg ?? '—'}%</td>
                    <td>{sh ? <Pill tone={sh.status === 'reviewed' ? 'success' : sh.status === 'requires_correction' ? 'error' : 'warning'}>{sh.status === 'reviewed' ? (batch.status === 'released' ? 'Released' : batch.status === 'submitted' ? 'Submitted to Principal' : 'Ready for review ✓') : sh.status === 'requires_correction' ? 'Requires correction' : 'Draft'}</Pill> : <Pill tone="error">Not generated</Pill>}{sh?.correctionNote && <p className="text-[11px] text-error-600 max-w-xs">{sh.correctionNote}</p>}</td>
                    <td className="text-xs">{batch.status === 'released' ? <>Student: {fmtDate(batch.releasedAt)}<br />Guardian: {k.parentLinked ? 'Available' : 'No linked account'}</> : ''}</td>
                    <td><button type="button" className="text-sm font-medium text-navy-700 hover:underline" onClick={() => setPreview(k.id)}>Preview</button></td>
                  </tr>
                );
              })}
            </Table>
          </Card>
          {canEdit && (
            <Card>
              {outstanding.length > 0 ? (
                <Notice tone="warning"><b>{outstanding.length} gradesheet{outstanding.length === 1 ? '' : 's'} still outstanding. Submission unavailable.</b> {outstanding.slice(0, 6).map((k) => <button key={k.id} type="button" className="underline ml-1" onClick={() => setPreview(k.id)}>{k.name}</button>)}</Notice>
              ) : <Notice tone="success">All {counts.total} gradesheets are complete and validated.</Notice>}
              <div className="flex justify-end mt-4"><button type="button" className="btn-primary" disabled={outstanding.length > 0} onClick={() => setConfirm('submit')}><Send className="w-4 h-4" /> Submit Class Report Cards to Principal</button></div>
            </Card>
          )}
          {batch.status === 'submitted' && <Notice>Submitted {fmtDate(batch.submittedAt)}. Awaiting the Principal's review — the batch can't be edited while under review.</Notice>}
          {batch.status === 'authorized' && (
            <Card>
              <Notice tone="success">Release authorized by {batch.authorizedBy} on {fmtDate(batch.authorizedAt)}.</Notice>
              <div className="flex justify-end mt-4"><button type="button" className="btn-primary" onClick={() => setConfirm('release')}><Award className="w-4 h-4" /> Release Report Cards</button></div>
            </Card>
          )}
          <Card title="Batch history"><ul className="text-sm space-y-1">{batch.history.slice().reverse().map((h, i) => <li key={i}><span className="text-navy-400">{fmtDate(h.at)}</span> · {h.action} <span className="text-navy-500">— {h.by}</span></li>)}</ul></Card>
        </div>
      )}
      <Dialog open={!!preview && !!batch} onClose={() => setPreview(null)} wide="xl" title="Gradesheet preview" footer={preview && batch && canEdit ? <SheetActions batchKey={batch.key} studentId={preview} onDone={() => setPreview(null)} /> : undefined}>
        {preview && <ReportCardView school={s} studentId={preview} />}
      </Dialog>
      <Dialog open={confirm === 'submit'} onClose={() => setConfirm(null)} title="Submit to Principal" footer={<><button type="button" className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (batch) { actions.submitBatch(batch.key, me.name); setFlash(`${className(batch.grade, batch.section)} submitted. The Principal has been notified.`); setKey(null); setTab('submitted'); } setConfirm(null); }}>Submit</button></>}>
        {batch && counts && <dl className="text-sm grid grid-cols-2 gap-2"><dt className="text-navy-500">Academic year</dt><dd>{s.school.academicYear}</dd><dt className="text-navy-500">Period</dt><dd>{s.school.currentPeriod ?? 'Not configured'}</dd><dt className="text-navy-500">Class / section</dt><dd>Grade {batch.grade} / {batch.section}</dd><dt className="text-navy-500">Total students</dt><dd>{counts.total}</dd><dt className="text-navy-500">Total gradesheets</dt><dd>{counts.generated}</dd><dt className="text-navy-500">Validation</dt><dd className="text-success-700">All reviewed ✓</dd></dl>}
      </Dialog>
      <Dialog open={confirm === 'release'} onClose={() => setConfirm(null)} title={`Release report cards — ${batch ? className(batch.grade, batch.section) : ''}`} footer={<><button type="button" className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (batch) { actions.releaseBatch(batch.key, me.name); setFlash(`${className(batch.grade, batch.section)} report cards released privately to ${Object.keys(batch.sheets).length} students and their linked guardians.`); setKey(null); setTab('released'); } setConfirm(null); }}>Release now</button></>}>
        <p className="text-sm text-navy-700">Each report card will be visible only to its student and that student's linked guardian(s). Students never see classmates' report cards.</p>
      </Dialog>
    </div>
  );
}

function SheetActions({ batchKey, studentId, onDone }: { batchKey: string; studentId: string; onDone: () => void }) {
  const s = useSchool();
  const sh = s.batches.find((b) => b.key === batchKey)?.sheets[studentId];
  const [t, setT] = useState(sh?.teacherRemark ?? '');
  const [a, setA] = useState(sh?.academicRemark ?? '');
  if (!sh) return null;
  return (
    <div className="w-full space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className="label">Class sponsor's remark</span><input className="input py-2 text-sm" value={t} onChange={(e) => setT(e.target.value)} /></label>
        <label><span className="label">Academic Officer's remark</span><input className="input py-2 text-sm" value={a} onChange={(e) => setA(e.target.value)} /></label>
      </div>
      <p className="text-xs text-navy-400">Subject marks come from the approved teacher gradebook and can't be edited here. Use the correction and re-approval process for mark errors.</p>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => { actions.setSheet(batchKey, studentId, { teacherRemark: t, academicRemark: a, status: 'draft' }); onDone(); }}>Return to processing</button>
        <button type="button" className="btn-primary" disabled={sh.status === 'requires_correction'} title={sh.status === 'requires_correction' ? 'Missing marks must be corrected first' : undefined} onClick={() => { actions.setSheet(batchKey, studentId, { teacherRemark: t, academicRemark: a, status: 'reviewed' }); onDone(); }}><CheckCircle2 className="w-4 h-4" /> Save and mark as reviewed</button>
      </div>
    </div>
  );
}

function TemplateDesigner() {
  const s = useSchool();
  const [t, setT] = useState<ReportTemplate>(s.template);
  const [saved, setSaved] = useState(false);
  const toggles: [keyof ReportTemplate, string][] = [
    ['showLetterGrade', 'Letter grade'], ['showGradePoint', 'Grade point'], ['showPosition', 'Class position'], ['showAttendance', 'Attendance summary'],
    ['showConduct', 'Conduct'], ['showTeacherRemark', 'Class sponsor remark'], ['showAcademicRemark', 'Academic Officer remark'], ['showPrincipalRemark', 'Principal remark'], ['showSignatures', 'Signature areas'],
  ];
  const preview = useMemo(() => ({ ...s, template: t }), [s, t]);
  return (
    <div className="space-y-6">
    <SchoolTemplateUpload />
    {s.reportTemplateFile?.active && <Notice>The school's Word template is in use, so report cards download in that design. The built-in layout below is still used for on-screen previews.</Notice>}
    <div className="grid xl:grid-cols-[340px_1fr] gap-6">
      <Card title="Template settings" subtitle="Reused for every class. Live preview on the right.">
        <div className="space-y-3">
          <label className="block"><span className="label">Title</span><input className="input py-2 text-sm" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} /></label>
          <label className="block"><span className="label">School address</span><input className="input py-2 text-sm" value={t.schoolAddress} onChange={(e) => setT({ ...t, schoolAddress: e.target.value })} /></label>
          <label className="block"><span className="label">Motto</span><input className="input py-2 text-sm" value={t.motto} onChange={(e) => setT({ ...t, motto: e.target.value })} /></label>
          <label className="block"><span className="label">Accent colour</span><input type="color" className="h-10 w-20 rounded border border-navy-200" value={t.accent} onChange={(e) => setT({ ...t, accent: e.target.value })} /></label>
          <div className="pt-2 space-y-2">{toggles.map(([k, label]) => <label key={k} className="flex items-center justify-between text-sm"><span>{label}</span><input type="checkbox" checked={Boolean(t[k])} onChange={(e) => setT({ ...t, [k]: e.target.checked })} /></label>)}</div>
          <button type="button" className="btn-primary w-full" onClick={() => { actions.saveTemplate(t); setSaved(true); }}>{saved ? 'Template saved' : 'Save template'}</button>
        </div>
      </Card>
      <Card title="Built-in layout — live preview">{s.students[0] ? <ReportCardView school={preview} studentId={s.students.find((x) => x.status === 'active')?.id ?? s.students[0].id} /> : <p className="text-sm text-navy-500">Register students to see a preview.</p>}</Card>
    </div>
    </div>
  );
}

/* ============================== STUDENT ACADEMIC RECORDS ============================== */

export function StudentAcademicRecords() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'subjects' | 'reports' | 'attendance' | 'assessments' | 'promotion'>('overview');
  const list = activeStudents(s).filter((x) => (grade == null || x.grade === grade) && (section == null || x.section === section) && `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase()));
  const st = open ? studentById(s, open) : null;
  const batch = st ? s.batches.find((b) => b.key === `${st.grade}${st.section}`) : null;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Academic Records" subtitle="Search any enrolled student. Counseling information is never shown here." />
      <Card action={<ClassSectionPicker grade={grade} section={section} allowAllSections onChange={(g, x) => { setGrade(g); setSection(x); }} />}>
        <div className="max-w-sm mb-4"><SearchBox value={q} onChange={setQ} placeholder="Name or student ID" /></div>
        <Table head={['Student ID', 'Name', 'Class', 'Enrolled', 'Average', '']}>
          {list.slice(0, 60).map((x) => { const a = studentAverage(s, x.id); return <tr key={x.id}><td className="font-mono text-xs">{x.studentNo}</td><td className="font-medium">{x.name}</td><td>{className(x.grade, x.section)}</td><td>{x.yearEntered}</td><td>{a ?? '—'}%</td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => { setOpen(x.id); setTab('overview'); }}>Open record</button></td></tr>; })}
        </Table>
        {list.length > 60 && <p className="text-xs text-navy-400 mt-2">Showing 60 of {list.length}. Refine the search.</p>}
      </Card>
      <Dialog open={!!st} onClose={() => setOpen(null)} wide="xl" title={st ? `${st.name} · ${st.studentNo}` : ''}>
        {st && (
          <>
            <Tabs tabs={[{ id: 'overview', label: 'Academic Overview' }, { id: 'subjects', label: 'Subject Results' }, { id: 'reports', label: 'Report Cards' }, { id: 'attendance', label: 'Attendance' }, { id: 'assessments', label: 'Assessment History' }, { id: 'promotion', label: 'Promotion History' }]} value={tab} onChange={setTab} />
            {tab === 'overview' && <div className="grid sm:grid-cols-4 gap-3 text-sm"><Stat label="Current class" value={<span className="text-base">{className(st.grade, st.section)}</span>} /><Stat label="Enrollment year" value={st.yearEntered} /><Stat label="Average" value={`${studentAverage(s, st.id) ?? '—'}%`} /><Stat label="Attendance (20d)" value={`${attendanceSummary([st.id], schoolDays(20)).rate}%`} /></div>}
            {tab === 'subjects' && <Table head={['Subject', 'Teacher', 'Classwork', 'Quizzes', 'Midterm', 'Final', 'Total', 'Grade', 'Status']}>{subjectTotals(s, st.id).map((r) => <tr key={r.subject}><td className="font-medium">{r.subject}</td><td className="text-xs">{staffName(s, r.teacherId)}</td><td>{r.marks?.classwork ?? '—'}</td><td>{r.marks?.quizzes ?? '—'}</td><td>{r.marks?.midterm ?? '—'}</td><td>{r.marks?.final ?? '—'}</td><td className="font-semibold">{r.total ?? '—'}</td><td>{r.total != null ? letterFor(r.total, s.grading).letter : '—'}</td><td><Pill tone={gradebookTone(r.status)}>{r.status}</Pill></td></tr>)}</Table>}
            {tab === 'reports' && (batch ? <><p className="text-sm text-navy-500 mb-3">{s.school.academicYear} — {BATCH_LABEL[batch.status]}</p><ReportCardView school={s} studentId={st.id} /></> : <p className="text-sm text-navy-500">No report card generated yet for this period.</p>)}
            {tab === 'attendance' && <AttendanceHistory studentId={st.id} />}
            {tab === 'assessments' && <Table head={['Assessment', 'Subject', 'Date', 'Status']}>{s.exams.filter((e) => e.grade === st.grade && e.section === st.section).slice(0, 14).map((e) => <tr key={e.id}><td>{e.name}</td><td>{e.subject}</td><td>{fmtDate(e.date)}</td><td>{e.status.replace('_', ' ')}</td></tr>)}</Table>}
            {tab === 'promotion' && <ul className="text-sm space-y-1">{st.previousClasses.map((c) => <li key={c}>✔ {c} — promoted</li>)}<li>● {className(st.grade, st.section)} — current ({s.school.academicYear})</li></ul>}
          </>
        )}
      </Dialog>
    </div>
  );
}

/* ============================== PERFORMANCE / REPORTS ============================== */

export function AcademicPerformance() {
  const s = useSchool();
  const perf = schoolPerformance(s);
  const [grade, setGrade] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const subjects = [...new Set(s.gradebooks.map((g) => g.subject))];
  const subjAvg = subjects.map((sub) => {
    const vals = s.gradebooks.filter((g) => g.subject === sub && g.status !== 'draft' && (grade == null || g.grade === grade)).flatMap((g) => Object.values(g.marks).map((m) => m.total)).filter((x): x is number => x != null);
    return { sub, avg: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0, n: vals.length };
  }).filter((x) => x.n).sort((a, b) => b.avg - a.avg);
  const series = [{ name: 'At-risk', color: CAT_COLORS.at_risk }, { name: 'Moderate', color: CAT_COLORS.moderate }, { name: 'Good / Excellent', color: CAT_COLORS.good }];
  const attention = perf.rows.filter((r) => categoryFor(r.avg, s.grading) === 'at_risk' && (grade == null || r.st.grade === grade)).sort((a, b) => a.avg - b.avg);
  const subjRows = subject ? s.gradebooks.filter((g) => g.subject === subject && g.status !== 'draft') : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Academic Performance" subtitle={`Uses configured thresholds: at-risk below ${s.grading.atRiskBelow}%, good from ${s.grading.goodFrom}%.`} action={
        <label><span className="sr-only">Grade</span><select className="input py-2 text-sm" value={grade ?? ''} onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : null)}><option value="">Whole school</option>{gradesOf(s).map((g) => <option key={g} value={g}>Grade {g}</option>)}</select></label>
      } />
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Overall average" value={`${grade ? perf.byGrade.find((g) => g.grade === grade)?.avg : perf.overall}%`} />
        <Stat label="Highest subject" value={<span className="text-base">{subjAvg[0]?.sub} ({subjAvg[0]?.avg}%)</span>} tone="success" />
        <Stat label="Lowest subject" value={<span className="text-base">{subjAvg[subjAvg.length - 1]?.sub} ({subjAvg[subjAvg.length - 1]?.avg}%)</span>} tone="error" />
        <Stat label="Requiring attention" value={attention.length} tone="warning" />
      </div>
      <div className="grid xl:grid-cols-2 gap-6">
        <Card title={grade ? `Grade ${grade} by section` : 'Distribution by class'}>
          {grade == null ? (
            <StackedBars rows={perf.byGrade.map((g) => ({ label: `Grade ${g.grade}`, values: [g.at_risk, g.moderate, g.good] }))} series={series} onSelect={(i) => setGrade(perf.byGrade[i].grade)} />
          ) : (
            <StackedBars rows={sectionsOf(s, grade).map((sec) => { const r = perf.rows.filter((x) => x.st.grade === grade && x.st.section === sec); const c = (k: 'at_risk' | 'moderate' | 'good') => r.filter((x) => categoryFor(x.avg, s.grading) === k).length; return { label: `${grade}${sec}`, values: [c('at_risk'), c('moderate'), c('good')] }; })} series={series} />
          )}
        </Card>
        <Card title="Average by subject">
          <div className="space-y-2.5">{subjAvg.map((x) => <button key={x.sub} type="button" onClick={() => setSubject(x.sub)} className="w-full text-left"><div className="flex justify-between text-sm"><span>{x.sub}</span><span>{x.avg}%</span></div><Meter value={x.avg} tone={CAT_COLORS[categoryFor(x.avg, s.grading)]} /></button>)}</div>
        </Card>
      </div>
      {subject && (
        <Card title={`${subject} by section`} action={<button type="button" className="text-sm text-navy-600" onClick={() => setSubject('')}>Close</button>}>
          <Table head={['Class', 'Teacher', 'Average', 'Highest', 'Lowest']}>
            {subjRows.map((g) => { const v = Object.values(g.marks).map((m) => m.total).filter((x): x is number => x != null); return <tr key={g.id}><td>{className(g.grade, g.section)}</td><td>{staffName(s, g.teacherId)}</td><td>{v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : '—'}%</td><td>{Math.max(...v)}</td><td>{Math.min(...v)}</td></tr>; })}
          </Table>
        </Card>
      )}
      <Card title="Students requiring academic attention">
        <Table head={['Student', 'Class', 'Average', 'Weakest subjects']}>
          {attention.slice(0, 40).map((r) => <tr key={r.st.id}><td className="font-medium">{r.st.name}</td><td>{className(r.st.grade, r.st.section)}</td><td><Pill tone="error">{r.avg}%</Pill></td><td className="text-xs">{subjectTotals(s, r.st.id).filter((x) => (x.total ?? 0) < s.grading.passMark).map((x) => `${x.subject} (${x.total})`).join(', ')}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

export function AcademicReports() {
  const s = useSchool();
  const stamp = new Date().toISOString().slice(0, 10);
  const perf = schoolPerformance(s);
  const reports: { title: string; header: string[]; rows: () => (string | number | null | undefined)[][] }[] = [
    { title: 'Class performance report', header: ['Class', 'Students', 'Average', 'At-risk', 'Moderate', 'Good/Excellent'], rows: () => allSections(s).map(({ grade, section }) => { const r = perf.rows.filter((x) => x.st.grade === grade && x.st.section === section); const c = (k: 'at_risk' | 'moderate' | 'good') => r.filter((x) => categoryFor(x.avg, s.grading) === k).length; return [className(grade, section), r.length, r.length ? Math.round((r.reduce((a, b) => a + b.avg, 0) / r.length) * 10) / 10 : '', c('at_risk'), c('moderate'), c('good')]; }) },
    { title: 'Subject performance report', header: ['Class', 'Subject', 'Teacher', 'Average', 'Highest', 'Lowest'], rows: () => s.gradebooks.filter((g) => g.status !== 'draft').map((g) => { const v = Object.values(g.marks).map((m) => m.total).filter((x): x is number => x != null); return [className(g.grade, g.section), g.subject, staffName(s, g.teacherId), v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : '', Math.max(...v), Math.min(...v)]; }) },
    { title: 'Student academic history', header: ['Student ID', 'Name', 'Current class', 'Year entered', 'Previous classes', 'Average'], rows: () => activeStudents(s).map((x) => [x.studentNo, x.name, className(x.grade, x.section), x.yearEntered, x.previousClasses.join(' / '), studentAverage(s, x.id)]) },
    { title: 'Examination results report', header: ['Student ID', 'Name', 'Class', 'Subject', 'Midterm', 'Final', 'Total'], rows: () => s.gradebooks.filter((g) => g.status === 'approved').flatMap((g) => Object.entries(g.marks).map(([sid, m]) => { const st = studentById(s, sid); return [st?.studentNo, st?.name, className(g.grade, g.section), g.subject, m.midterm, m.final, m.total]; })) },
    { title: 'Gradebook submission report', header: ['Class', 'Subject', 'Teacher', 'Status', 'Submitted', 'Approved'], rows: () => s.gradebooks.map((g) => [className(g.grade, g.section), g.subject, staffName(s, g.teacherId), GRADEBOOK_LABEL[g.status], g.submittedAt?.slice(0, 10), g.approvedAt?.slice(0, 10)]) },
    { title: 'Report-card completion report', header: ['Class', 'Status', 'Students', 'Gradesheets', 'Reviewed', 'Requires correction'], rows: () => allSections(s).map(({ grade, section }) => { const b = s.batches.find((x) => x.key === `${grade}${section}`); const sh = b ? Object.values(b.sheets) : []; return [className(grade, section), BATCH_LABEL[batchStage(s, grade, section)], roster(s, grade, section).length, sh.length, sh.filter((x) => x.status === 'reviewed').length, sh.filter((x) => x.status === 'requires_correction').length]; }) },
    { title: 'At-risk student report', header: ['Student ID', 'Name', 'Class', 'Average', 'Guardian', 'Phone'], rows: () => perf.rows.filter((r) => categoryFor(r.avg, s.grading) === 'at_risk').map((r) => [r.st.studentNo, r.st.name, className(r.st.grade, r.st.section), r.avg, r.st.guardianName, r.st.guardianPhone]) },
    { title: 'Academic period summary', header: ['Measure', 'Value'], rows: () => [['Academic year', s.school.academicYear], ['Current period', s.school.currentPeriod ?? 'Not configured'], ['Enrolled students', activeStudents(s).length], ['School average', perf.overall], ['Gradebooks approved', s.gradebooks.filter((g) => g.status === 'approved').length], ['Report cards released', s.batches.filter((b) => b.status === 'released').reduce((a, b) => a + Object.keys(b.sheets).length, 0)]] },
    { title: 'Student promotion report', header: ['Student ID', 'Name', 'Class', 'Average', 'Recommendation'], rows: () => perf.rows.map((r) => [r.st.studentNo, r.st.name, className(r.st.grade, r.st.section), r.avg, r.avg >= s.grading.passMark ? 'Promote' : 'Review / remedial']) },
    { title: 'Missing marks report', header: ['Class', 'Subject', 'Student ID', 'Name', 'Missing component'], rows: () => allSections(s).flatMap(({ grade, section }) => validateSection(s, grade, section).missing.map((m) => [className(grade, section), m.subject, studentById(s, m.studentId)?.studentNo, studentById(s, m.studentId)?.name, m.field])) },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Academic Reports" subtitle={`${s.school.academicYear}${s.school.currentPeriod ? ` · ${s.school.currentPeriod}` : ''} · generated from live records`} />
      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((r) => { const rows = r.rows(); return (
          <Card key={r.title} title={r.title} subtitle={`${rows.length} records · ${fmtDate(stamp)}`}>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary text-sm" onClick={() => downloadCsv(`${r.title.replace(/\W+/g, '_')}_${stamp}`, r.header, rows)}><Download className="w-4 h-4" /> Spreadsheet (.csv)</button>
              <button type="button" className="btn-secondary text-sm" onClick={() => printHtml(r.title, `<h1>${s.school.name} — ${r.title}</h1><p class="muted">${s.school.academicYear} · generated ${fmtDate(stamp)}</p>${tableHtml(r.header, rows)}`)}><Printer className="w-4 h-4" /> Print / PDF</button>
            </div>
          </Card>
        ); })}
      </div>
    </div>
  );
}

export function AcademicSettings() {
  const s = useSchool();
  const me = useMe();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Settings" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="My account"><dl className="text-sm divide-y divide-navy-100">{[['Name', me.name], ['Email', me.email], ['Role', 'Academic Officer'], ['School', s.school.name]].map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr] py-2"><dt className="text-navy-500">{k}</dt><dd>{v}</dd></div>)}</dl></Card>
        <Card title="Workflow rules">
          <ul className="text-sm text-navy-700 space-y-2 list-disc pl-5">
            <li>You do not approve teacher gradebooks — the Principal does.</li>
            <li>Report cards can only be released after the Principal authorizes release.</li>
            <li>Subject marks are never edited during report-card processing.</li>
            <li>Students and guardians only ever see their own report cards.</li>
          </ul>
        </Card>
        <Card title="Teaching staff"><p className="text-sm">{teachers(s).length} teachers · {s.assignments.filter((a) => !a.teacherId).length} unassigned subject(s)</p></Card>
        <Card title="Alerts"><div className="flex items-center gap-2 text-sm text-navy-600"><AlertTriangle className="w-4 h-4 text-warning-600" /> {s.gradebooks.filter((g) => g.status === 'draft').length} gradebooks not yet submitted by teachers.</div></Card>
      </div>
    </div>
  );
}
