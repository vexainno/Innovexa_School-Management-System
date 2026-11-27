import { useMemo, useState } from 'react';
import {
  Award, BookOpenCheck, CalendarCheck, CheckCircle2, ClipboardCheck, Download, FileBarChart, GraduationCap,
  HeartHandshake, Printer, ShieldAlert, Users, UserCheck, Wallet,
} from 'lucide-react';
import {
  actions, activeStudents, allSections, attendanceSummary, batchStage, BATCH_LABEL, CATEGORY_LABEL, categoryFor, className,
  feeAccount, financeSummary, fmtDate, gradesOf, lastSchoolDay, money, roster, schoolDays, schoolPerformance, sectionsOf,
  staffName, studentAttendance, studentAverage, studentById, teachers, useSchool, GRADEBOOK_LABEL,
} from '@/store/store';
import type { Gradebook } from '@/store/types';
import { downloadCsv, printHtml, tableHtml } from '@/store/files';
import {
  CAT_COLORS, Card, ClassSectionPicker, ColumnPairs, Dialog, Header, Meter, Notice, Pill, SearchBox, StackedBars, Stat, Table, Tabs, catTone,
} from '@/components/kit';
import { ReportCardView } from '@/components/ReportCard';
import { AttendanceHistory, GradebookDialog, StudentProfileDialog, gradebookTone } from './common';
import { ContactLinks, greeting, useMe, type PageProps } from './shared';

/* ================================ DASHBOARD ================================ */

export function PrincipalOverview({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const students = activeStudents(s);
  const teacherCount = teachers(s).length;
  const fin = financeSummary(s);
  const today = lastSchoolDay();
  const todayAtt = attendanceSummary(students.map((x) => x.id), [today]);
  const weekAtt = attendanceSummary(students.map((x) => x.id), schoolDays(5));
  const perf = schoolPerformance(s);
  const pending = s.gradebooks.filter((g) => g.status === 'submitted').length;
  const approved = s.gradebooks.filter((g) => g.status === 'approved').length;
  const awaitingReview = s.batches.filter((b) => b.status === 'submitted').length;
  const perfTone = perf.category === 'good' ? 'success' : perf.category === 'moderate' ? 'warning' : 'error';
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} · ${s.school.academicYear} Academic Year${s.school.currentPeriod ? ` · ${s.school.currentPeriod}` : ''}`} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total Students" value={students.length} sub={`${allSections(s).length} class sections · ${students.filter((x) => x.gender === 'F').length} girls, ${students.filter((x) => x.gender === 'M').length} boys`} icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('student-management')}
          footer={<div className="flex items-end gap-1 h-8">{gradesOf(s).map((g) => { const n = roster(s, g).length; return <span key={g} title={`Grade ${g}: ${n}`} className="flex-1 bg-navy-200 rounded-t" style={{ height: `${(n / 60) * 100}%` }} />; })}</div>} />
        <Stat label="Teaching Staff" value={teacherCount} sub={`${s.staffAttendance.filter((a) => a.date === today && ['present', 'late'].includes(a.status) && teachers(s).some((t) => t.id === a.staffId)).length} reported to school today`} icon={<UserCheck className="w-5 h-5" />} onClick={() => onNavigate('staff-management')} />
        <Stat label="Fee Collection" value={money(fin.income)} sub={`${money(fin.collectedThisMonth)} collected this month`} icon={<Wallet className="w-5 h-5" />} tone="success" onClick={() => onNavigate('financial-overview')} />
        <Stat label="Attendance Rate" value={`${weekAtt.rate}%`} sub={`This week, whole school · ${todayAtt.present + todayAtt.late} present today`} icon={<CalendarCheck className="w-5 h-5" />} tone="accent" onClick={() => onNavigate('attendance-reports')}
          footer={<Meter value={weekAtt.rate} tone="#d97706" />} />
        <Stat label="Academic Performance" value={`${perf.overall}%`} sub={<Pill tone={perfTone}>{CATEGORY_LABEL[perf.category]}</Pill>} icon={<GraduationCap className="w-5 h-5" />} tone={perfTone} onClick={() => onNavigate('academic-overview')}
          footer={<Meter value={perf.overall} tone={CAT_COLORS[perf.category]} />} />
        <Stat label="Pending Gradebooks" value={pending} sub="Submitted by teachers, awaiting your approval" icon={<ClipboardCheck className="w-5 h-5" />} tone={pending ? 'warning' : 'navy'} onClick={() => onNavigate('exams-results')} />
        <Stat label="Approved Grades" value={approved} sub={`${awaitingReview} report-card batch${awaitingReview === 1 ? '' : 'es'} awaiting release authorization`} icon={<Award className="w-5 h-5" />} tone="success" onClick={() => onNavigate('report-card-approvals')} />
        <Stat label="Student Affairs" value={s.incidents.filter((i) => i.status !== 'resolved').length} sub={`Open discipline cases · ${s.counseling.filter((c) => c.status !== 'closed').length} counseling`} icon={<ShieldAlert className="w-5 h-5" />} tone="error" onClick={() => onNavigate('discipline-reports')} />
      </div>

      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
        <Card title="Student performance by class" subtitle={`At-risk below ${s.grading.atRiskBelow}%, moderate ${s.grading.atRiskBelow}–${s.grading.goodFrom - 1}%, good/excellent ${s.grading.goodFrom}%+. Click a class for its sections.`}>
          <StackedBars
            rows={perf.byGrade.map((g) => ({ label: `Grade ${g.grade}`, values: [g.at_risk, g.moderate, g.good] }))}
            series={[{ name: 'At-risk', color: CAT_COLORS.at_risk }, { name: 'Moderate', color: CAT_COLORS.moderate }, { name: 'Good / Excellent', color: CAT_COLORS.good }]}
            onSelect={(i) => onNavigate(`academic-overview:${perf.byGrade[i].grade}`)}
          />
        </Card>
        <Card title="Class averages">
          <div className="space-y-3">
            {perf.byGrade.map((g) => (
              <button key={g.grade} type="button" onClick={() => onNavigate(`academic-overview:${g.grade}`)} className="w-full text-left">
                <div className="flex justify-between text-sm mb-1"><span className="font-medium text-navy-800">Grade {g.grade}</span><span className="text-navy-600">{g.avg}%</span></div>
                <Meter value={g.avg} tone={CAT_COLORS[categoryFor(g.avg, s.grading)]} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================ SCHOOL INFORMATION ============================ */

export function SchoolInformation({ onNavigate }: PageProps) {
  const s = useSchool();
  const year = s.years.find((y) => y.status === 'current');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="School Information" subtitle="Official school profile used across the platform." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Profile">
          <dl className="text-sm divide-y divide-navy-100">
            {[['School name', s.school.name], ['Address', s.school.address], ['Phone', s.school.phone], ['Email', s.school.email], ['Motto', s.school.motto], ['Currency', s.school.currency], ['Time zone', s.school.timezone]].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] py-2"><dt className="text-navy-500">{k}</dt><dd className="text-navy-900">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card title="Academic year" action={<button type="button" className="btn-secondary text-sm" onClick={() => onNavigate('settings')}>Settings</button>}>
          <p className="text-2xl font-bold text-navy-900">{s.school.academicYear}</p>
          <p className="text-sm text-navy-500">{fmtDate(year?.start)} – {fmtDate(year?.end)}</p>
          <p className="text-sm mt-2">Current period: <b>{s.school.currentPeriod ?? 'Not configured'}</b></p>
          <p className="text-xs text-navy-400 mt-1">Periods are configured by the Academic Officer. Terms are shown only once the school sets its current period.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-navy-50 p-3"><p className="text-xl font-bold">{gradesOf(s).length}</p><p className="text-xs text-navy-500">Classes</p></div>
            <div className="rounded-lg bg-navy-50 p-3"><p className="text-xl font-bold">{allSections(s).length}</p><p className="text-xs text-navy-500">Sections</p></div>
            <div className="rounded-lg bg-navy-50 p-3"><p className="text-xl font-bold">{s.staff.length}</p><p className="text-xs text-navy-500">Staff</p></div>
          </div>
        </Card>
        <Card title="Classes and sections">
          <div className="flex flex-wrap gap-2">{allSections(s).map((x) => <Pill key={`${x.grade}${x.section}`}>{className(x.grade, x.section)} · {roster(s, x.grade, x.section).length}</Pill>)}</div>
        </Card>
        <Card title="School bank account (for fee deposits)">
          <dl className="text-sm divide-y divide-navy-100">
            {Object.entries({ Bank: s.school.bank.bank, 'Account name': s.school.bank.accountName, 'Account number': s.school.bank.accountNo, Branch: s.school.bank.branch, SWIFT: s.school.bank.swift }).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] py-2"><dt className="text-navy-500">{k}</dt><dd className="text-navy-900">{v}</dd></div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* ============================ STUDENT MANAGEMENT ============================ */

export function StudentManagement() {
  const s = useSchool();
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const list = grade != null ? roster(s, grade, section ?? undefined) : [];
  const searchHits = q.length > 1 ? activeStudents(s).filter((x) => `${x.name} ${x.studentNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Management" subtitle={`${activeStudents(s).length} enrolled students across ${allSections(s).length} class sections. Select a class, then a section.`}
        back={grade != null ? { label: section ? `Grade ${grade}` : 'All classes', onClick: () => (section ? setSection(null) : setGrade(null)) } : undefined} />
      <div className="max-w-md"><SearchBox value={q} onChange={setQ} placeholder="Find a student by name or ID…" /></div>
      {searchHits.length > 0 && (
        <Card title="Search results">
          <div className="flex flex-wrap gap-2">{searchHits.map((x) => <button key={x.id} type="button" className="btn-secondary text-sm" onClick={() => setOpen(x.id)}>{x.name} · {className(x.grade, x.section)}</button>)}</div>
        </Card>
      )}
      {grade == null && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gradesOf(s).map((g) => (
            <button key={g} type="button" onClick={() => setGrade(g)} className="card p-5 text-left hover:border-navy-300">
              <div className="flex justify-between"><h3 className="font-semibold text-lg text-navy-900">Grade {g}</h3><span className="text-2xl font-bold text-navy-800">{roster(s, g).length}</span></div>
              <p className="text-xs text-navy-500 mb-3">{g <= 9 ? 'Junior High' : 'Senior High'} · students</p>
              <div className="flex flex-wrap gap-2">{sectionsOf(s, g).map((sec) => <Pill key={sec}>Section {sec} · {roster(s, g, sec).length}</Pill>)}</div>
            </button>
          ))}
        </div>
      )}
      {grade != null && section == null && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionsOf(s, grade).map((sec) => {
            const r = roster(s, grade, sec);
            const sponsor = s.staff.find((t) => t.sponsorOf === `${grade}${sec}`);
            return (
              <button key={sec} type="button" onClick={() => setSection(sec)} className="card p-5 text-left hover:border-navy-300">
                <h3 className="font-semibold text-lg text-navy-900">Grade {grade}{sec}</h3>
                <p className="text-sm text-navy-600">{r.length} students · {r.filter((x) => x.gender === 'F').length} F / {r.filter((x) => x.gender === 'M').length} M</p>
                <p className="text-xs text-navy-500 mt-1">Class sponsor: {sponsor?.name ?? 'Not assigned'}</p>
              </button>
            );
          })}
        </div>
      )}
      {grade != null && section != null && (
        <Card title={`Grade ${grade}${section} — ${list.length} students`} action={<button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Grade${grade}${section}_students`, ['Student ID', 'Name', 'Gender', 'Year entered', 'Class', 'Guardian', 'Phone'], list.map((x) => [x.studentNo, x.name, x.gender, x.yearEntered, className(x.grade, x.section), x.guardianName, x.guardianPhone]))}><Download className="w-4 h-4" /> Download list</button>}>
          <Table head={['Student', 'Student ID', 'Gender', 'Year entered', 'Current class', 'Guardian', 'Average', '']}>
            {list.map((x) => {
              const avg = studentAverage(s, x.id);
              return (
                <tr key={x.id}>
                  <td className="font-medium">{x.name}</td>
                  <td className="font-mono text-xs">{x.studentNo}</td>
                  <td>{x.gender === 'M' ? 'Male' : 'Female'}</td>
                  <td>{x.yearEntered}</td>
                  <td>Grade {x.grade} · Section {x.section}</td>
                  <td className="text-sm">{x.guardianName}</td>
                  <td>{avg != null ? <Pill tone={catTone(categoryFor(avg, s.grading))}>{avg}%</Pill> : '—'}</td>
                  <td><button type="button" className="text-sm text-navy-700 font-medium hover:underline" onClick={() => setOpen(x.id)}>View</button></td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
      <StudentProfileDialog studentId={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ========================= TEACHER & STAFF MANAGEMENT ========================= */

export function StaffManagement({ onNavigate }: PageProps) {
  const s = useSchool();
  const today = lastSchoolDay();
  const [tab, setTab] = useState<'teachers' | 'admin'>('teachers');
  const [open, setOpen] = useState<string | null>(null);
  const status = (id: string) => s.staffAttendance.find((a) => a.staffId === id && a.date === today)?.status ?? 'not_recorded';
  const tone = (st: string) => (st === 'present' ? 'success' : st === 'late' ? 'warning' : st === 'absent' ? 'error' : st === 'on_leave' ? 'accent' : 'muted');
  const list = s.staff.filter((x) => (tab === 'teachers' ? x.role === 'teacher' : x.role !== 'teacher'));
  const person = s.staff.find((x) => x.id === open);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Teacher and Staff Management" subtitle="Staff directory, assignments and today's attendance (recorded by the Vice Principal)." action={<button type="button" className="btn-secondary text-sm" onClick={() => onNavigate('attendance-reports:teachers')}>Teacher attendance report</button>} />
      <Tabs tabs={[{ id: 'teachers', label: 'Teaching staff', count: teachers(s).length }, { id: 'admin', label: 'Administrative & support', count: s.staff.length - teachers(s).length }]} value={tab} onChange={setTab} />
      <Card>
        <Table head={['Name', 'Staff ID', 'Position / subjects', 'Classes', 'Phone', 'Today', '']}>
          {list.map((x) => {
            const cls = [...new Set(s.assignments.filter((a) => a.teacherId === x.id).map((a) => `${a.grade}${a.section}`))];
            return (
              <tr key={x.id}>
                <td className="font-medium">{x.name}</td>
                <td className="font-mono text-xs">{x.staffNo}</td>
                <td>{x.role === 'teacher' ? x.subjects.join(', ') : x.position}</td>
                <td className="text-xs">{cls.join(', ') || '—'}</td>
                <td><ContactLinks phone={x.phone} email={x.email} /></td>
                <td><Pill tone={tone(status(x.id))}>{status(x.id).replace('_', ' ')}</Pill></td>
                <td><button type="button" className="text-sm text-navy-700 font-medium hover:underline" onClick={() => setOpen(x.id)}>Details</button></td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Dialog open={!!person} onClose={() => setOpen(null)} title={person?.name ?? ''} wide>
        {person && (
          <div className="space-y-4 text-sm">
            <p className="text-navy-600">{person.position}{person.sponsorOf ? ` · Class sponsor of Grade ${person.sponsorOf}` : ''} · joined {fmtDate(person.joined)}</p>
            <Table head={['Class', 'Subject', 'Periods / week']}>
              {s.assignments.filter((a) => a.teacherId === person.id).map((a) => (
                <tr key={`${a.grade}${a.section}${a.subject}`}><td>{className(a.grade, a.section)}</td><td>{a.subject}</td><td>{s.timetable.filter((t) => t.teacherId === person.id && t.grade === a.grade && t.section === a.section && t.subject === a.subject).length}</td></tr>
              ))}
            </Table>
            <p className="text-navy-500">Attendance (last 20 school days): {Math.round((s.staffAttendance.filter((a) => a.staffId === person.id && ['present', 'late'].includes(a.status)).length / Math.max(1, s.staffAttendance.filter((a) => a.staffId === person.id).length)) * 100)}% present</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

/* ============================== ACADEMIC OVERVIEW ============================== */

export function AcademicOverview({ param }: PageProps) {
  const s = useSchool();
  const perf = schoolPerformance(s);
  const [grade, setGrade] = useState<number | null>(param ? Number(param) : null);
  const [section, setSection] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'at_risk' | 'moderate' | 'good'>('all');
  const rows = perf.rows.filter((r) => (grade == null || r.st.grade === grade) && (section == null || r.st.section === section));
  const shown = rows.filter((r) => filter === 'all' || categoryFor(r.avg, s.grading) === filter).sort((a, b) => a.avg - b.avg);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Academic Overview" subtitle={`School average ${perf.overall}% (${CATEGORY_LABEL[perf.category]}). Based on teacher-submitted subject totals.`} />
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="School average" value={`${perf.overall}%`} icon={<GraduationCap className="w-5 h-5" />} />
        {(['at_risk', 'moderate', 'good'] as const).map((c) => (
          <Stat key={c} label={CATEGORY_LABEL[c]} value={perf.rows.filter((r) => categoryFor(r.avg, s.grading) === c).length} tone={catTone(c)} onClick={() => setFilter(c)} sub="students" />
        ))}
      </div>
      <Card title={grade == null ? 'By class' : `Grade ${grade} by section`}>
        {grade == null ? (
          <StackedBars rows={perf.byGrade.map((g) => ({ label: `Grade ${g.grade}`, values: [g.at_risk, g.moderate, g.good] }))}
            series={[{ name: 'At-risk', color: CAT_COLORS.at_risk }, { name: 'Moderate', color: CAT_COLORS.moderate }, { name: 'Good / Excellent', color: CAT_COLORS.good }]}
            onSelect={(i) => setGrade(perf.byGrade[i].grade)} />
        ) : (
          <>
            <StackedBars rows={sectionsOf(s, grade).map((sec) => {
              const r = perf.rows.filter((x) => x.st.grade === grade && x.st.section === sec);
              const c = (k: 'at_risk' | 'moderate' | 'good') => r.filter((x) => categoryFor(x.avg, s.grading) === k).length;
              return { label: `${grade}${sec}`, values: [c('at_risk'), c('moderate'), c('good')] };
            })} series={[{ name: 'At-risk', color: CAT_COLORS.at_risk }, { name: 'Moderate', color: CAT_COLORS.moderate }, { name: 'Good / Excellent', color: CAT_COLORS.good }]}
              onSelect={(i) => setSection(sectionsOf(s, grade)[i])} />
            <button type="button" className="text-sm text-navy-600 mt-4" onClick={() => { setGrade(null); setSection(null); }}>← All classes</button>
          </>
        )}
      </Card>
      <Card title={`Students ${grade ? `in Grade ${grade}${section ?? ''}` : 'school-wide'}`} action={
        <div className="flex flex-wrap gap-2">
          <ClassSectionPicker grade={grade} section={section} allowAllSections onChange={(g, sec) => { setGrade(g); setSection(sec); }} />
          <label><span className="label">Category</span><select className="input py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">All</option><option value="at_risk">At-risk</option><option value="moderate">Moderate</option><option value="good">Good / Excellent</option></select></label>
        </div>
      }>
        <Table head={['Student', 'Class', 'Average', 'Category', '']}>
          {shown.slice(0, 80).map((r) => {
            const c = categoryFor(r.avg, s.grading);
            return <tr key={r.st.id}><td className="font-medium">{r.st.name}</td><td>{className(r.st.grade, r.st.section)}</td><td>{r.avg}%</td><td><Pill tone={catTone(c)}>{CATEGORY_LABEL[c]}</Pill></td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setOpen(r.st.id)}>View</button></td></tr>;
          })}
        </Table>
        {shown.length > 80 && <p className="text-xs text-navy-400 mt-3">Showing 80 of {shown.length}. Narrow by class to see everyone.</p>}
      </Card>
      <StudentProfileDialog studentId={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ============================== ATTENDANCE REPORTS ============================== */

export function AttendanceReports({ param }: PageProps) {
  const s = useSchool();
  const [tab, setTab] = useState<'students' | 'teachers'>(param === 'teachers' ? 'teachers' : 'students');
  const days = schoolDays(20);
  const [date, setDate] = useState(days[0]);
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const all = activeStudents(s).map((x) => x.id);
  const day = attendanceSummary(all, [date]);
  const list = grade != null && section ? roster(s, grade, section) : [];
  const stu = open ? studentById(s, open) : null;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Attendance Reports" subtitle="Daily school-wide attendance, by class and section, and teacher attendance." />
      <Tabs tabs={[{ id: 'students', label: 'Student attendance' }, { id: 'teachers', label: 'Teacher attendance' }]} value={tab} onChange={setTab} />
      {tab === 'students' ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <label><span className="label">Date</span><select className="input py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)}>{days.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}</select></label>
            <p className="text-sm text-navy-500 pb-2">Attendance rate: <b className="text-navy-900">{day.rate}%</b></p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Present" value={day.present} tone="success" />
            <Stat label="Absent" value={day.absent} tone="error" />
            <Stat label="Late" value={day.late} tone="warning" />
            <Stat label="Excused" value={day.excused} />
          </div>
          <Card title="By class" subtitle="Select a class and section to see each student's record.">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {allSections(s).map(({ grade: g, section: sec }) => {
                const a = attendanceSummary(roster(s, g, sec).map((x) => x.id), [date]);
                const sel = grade === g && section === sec;
                return (
                  <button key={`${g}${sec}`} type="button" onClick={() => { setGrade(g); setSection(sec); }} className={`rounded-lg border p-3 text-left ${sel ? 'border-navy-700 bg-navy-50' : 'border-navy-100 hover:border-navy-300'}`}>
                    <p className="font-semibold text-navy-900">Grade {g}{sec}</p>
                    <p className="text-xs text-navy-500">{a.present + a.late} present · {a.absent} absent · {a.late} late</p>
                    <Meter value={a.rate} tone={a.rate >= 90 ? '#16a34a' : a.rate >= 80 ? '#d97706' : '#dc2626'} />
                  </button>
                );
              })}
            </div>
            {list.length > 0 && (
              <Table head={['Student', 'Student ID', `Status (${fmtDate(date)})`, 'Present', 'Absent', 'Late', 'Rate (20 days)', '']}>
                {list.map((x) => {
                  const st = studentAttendance(x.id, date);
                  const sum = attendanceSummary([x.id], days);
                  return (
                    <tr key={x.id}>
                      <td className="font-medium">{x.name}</td><td className="font-mono text-xs">{x.studentNo}</td>
                      <td><Pill tone={st === 'present' ? 'success' : st === 'absent' ? 'error' : st === 'late' ? 'warning' : 'navy'}>{st}</Pill></td>
                      <td>{sum.present}</td><td>{sum.absent}</td><td>{sum.late}</td><td>{sum.rate}%</td>
                      <td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setOpen(x.id)}>Record</button></td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </>
      ) : <TeacherAttendanceReport />}
      <Dialog open={!!stu} onClose={() => setOpen(null)} title={stu ? `${stu.name} — attendance record` : ''}>
        {stu && <><p className="text-sm text-navy-500 mb-3">{className(stu.grade, stu.section)} · last 20 school days</p><AttendanceHistory studentId={stu.id} /></>}
      </Dialog>
    </div>
  );
}

export function TeacherAttendanceReport() {
  const s = useSchool();
  const today = lastSchoolDay();
  const ts = teachers(s);
  const rec = (id: string) => s.staffAttendance.find((a) => a.staffId === id && a.date === today);
  const count = (st: string) => ts.filter((t) => (rec(t.id)?.status ?? 'not_recorded') === st).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Present" value={count('present')} tone="success" /><Stat label="Late" value={count('late')} tone="warning" />
        <Stat label="Absent" value={count('absent')} tone="error" /><Stat label="On leave" value={count('on_leave')} tone="accent" /><Stat label="Not recorded" value={count('not_recorded')} />
      </div>
      <Card title={`Teacher attendance — ${fmtDate(today)}`} subtitle="Recorded by the Vice Principal.">
        <Table head={['Teacher', 'Subjects', 'Status', 'Arrival', 'Note', 'Last 20 days']}>
          {ts.map((t) => {
            const r = rec(t.id);
            const hist = s.staffAttendance.filter((a) => a.staffId === t.id);
            const rate = Math.round((hist.filter((a) => ['present', 'late'].includes(a.status)).length / Math.max(1, hist.length)) * 100);
            const st = r?.status ?? 'not_recorded';
            return <tr key={t.id}><td className="font-medium">{t.name}</td><td>{t.subjects.join(', ')}</td><td><Pill tone={st === 'present' ? 'success' : st === 'late' ? 'warning' : st === 'absent' ? 'error' : st === 'on_leave' ? 'accent' : 'muted'}>{st.replace('_', ' ')}</Pill></td><td>{r?.arrival ?? '—'}</td><td className="text-xs">{r?.note ?? ''}</td><td>{rate}%</td></tr>;
          })}
        </Table>
      </Card>
    </div>
  );
}

/* ============================== FINANCIAL OVERVIEW ============================== */

export function FinancialOverview() {
  const s = useSchool();
  const f = financeSummary(s);
  const byGrade = gradesOf(s).map((g) => {
    const accts = roster(s, g).map((x) => feeAccount(s, x.id));
    return { g, charged: accts.reduce((a, b) => a + b.charged - b.concessions, 0), paid: accts.reduce((a, b) => a + b.paid, 0), bal: accts.reduce((a, b) => a + b.balance, 0) };
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Financial Overview" subtitle="Updates automatically whenever the Finance Director records a payment or expense." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total income (school year)" value={money(f.income)} tone="success" />
        <Stat label="Total expenses" value={money(f.expenses)} tone="error" />
        <Stat label="Net income" value={money(f.net)} tone={f.net >= 0 ? 'success' : 'error'} />
        <Stat label="Outstanding fees" value={money(f.receivables)} tone="warning" />
      </div>
      <Card title="Monthly revenue and expenses">
        <ColumnPairs data={f.monthly.map((m) => ({ label: new Date(`${m.month}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'short' }), values: [m.revenue, m.expenses] }))}
          series={[{ name: 'Revenue', color: '#243d6f' }, { name: 'Expenses', color: '#d97706' }]} format={(n) => money(n)} />
      </Card>
      <Card title="Fee collection by class">
        <Table head={['Class', 'Billed', 'Collected', 'Outstanding', 'Collection rate']}>
          {byGrade.map((r) => <tr key={r.g}><td>Grade {r.g}</td><td>{money(r.charged)}</td><td>{money(r.paid)}</td><td>{money(r.bal)}</td><td className="w-48"><div className="flex items-center gap-2"><Meter value={(r.paid / Math.max(1, r.charged)) * 100} /><span className="text-xs">{Math.round((r.paid / Math.max(1, r.charged)) * 100)}%</span></div></td></tr>)}
        </Table>
      </Card>
      <Card title="Most recent payments">
        <Table head={['Date', 'Receipt', 'Student', 'Method', 'Amount']}>
          {s.payments.slice(-8).reverse().map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td className="font-mono text-xs">{p.receiptNo}</td><td>{studentById(s, p.studentId)?.name}</td><td>{p.method}</td><td className="font-medium">{money(p.amount)}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

/* ============================ DISCIPLINE / STUDENT AFFAIRS ============================ */

type AffairsView = 'active' | 'discipline' | 'serious' | 'counseling' | 'attendance';

export function DisciplineReports() {
  const s = useSchool();
  const [view, setView] = useState<AffairsView>('discipline');
  const [open, setOpen] = useState<string | null>(null);
  const days = schoolDays(20);
  const chronic = activeStudents(s).map((x) => ({ x, a: attendanceSummary([x.id], days) })).filter((r) => r.a.absent >= 3).sort((a, b) => b.a.absent - a.a.absent);
  const openCases = s.incidents.filter((i) => i.status !== 'resolved');
  const serious = s.incidents.filter((i) => i.severity === 'serious' || i.status === 'referred_principal');
  const counsel = s.counseling.filter((c) => c.status !== 'closed');
  const sevTone = (v: string) => (v === 'serious' || v === 'high' ? 'error' : v === 'moderate' || v === 'medium' ? 'warning' : 'navy');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Discipline Reports" subtitle="Student affairs at a glance. Follow up privately using the contact details shown — confidential notes stay with the Dean and Counselor." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Stat label="Active students" value={activeStudents(s).length} icon={<Users className="w-5 h-5" />} onClick={() => setView('active')} />
        <Stat label="Open discipline cases" value={openCases.length} icon={<ShieldAlert className="w-5 h-5" />} tone="warning" onClick={() => setView('discipline')} />
        <Stat label="Serious / referred to you" value={serious.length} icon={<ShieldAlert className="w-5 h-5" />} tone="error" onClick={() => setView('serious')} />
        <Stat label="Counseling cases" value={counsel.length} icon={<HeartHandshake className="w-5 h-5" />} tone="accent" onClick={() => setView('counseling')} />
        <Stat label="Persistent absence" value={chronic.length} sub="3+ absences in 20 days" icon={<CalendarCheck className="w-5 h-5" />} onClick={() => setView('attendance')} />
      </div>
      <Card>
        {(view === 'discipline' || view === 'serious') && (
          <Table head={['Student', 'Class', 'Case', 'Intensity', 'Status', 'Reported', 'Guardian contact']}>
            {(view === 'discipline' ? openCases : serious).map((i) => {
              const st = studentById(s, i.studentId);
              return <tr key={i.id}><td className="font-medium"><button type="button" className="hover:underline" onClick={() => setOpen(i.studentId)}>{st?.name}</button></td><td>{st && className(st.grade, st.section)}</td><td>{i.category}<p className="text-xs text-navy-500 max-w-xs">{i.outcome ?? i.description}</p></td><td><Pill tone={sevTone(i.severity)}>{i.severity}</Pill></td><td className="text-xs">{i.status.replace('_', ' ')}</td><td className="text-xs">{fmtDate(i.reportedAt)} · {i.reportedByName}</td><td>{st && <><p className="text-xs">{st.guardianName}</p><ContactLinks phone={st.guardianPhone} email={st.guardianEmail} /></>}</td></tr>;
            })}
          </Table>
        )}
        {view === 'counseling' && (
          <>
            <Notice>Counseling notes are confidential to the Guidance Counselor. Only the category and intensity are shared with leadership.</Notice>
            <div className="mt-4"><Table head={['Student', 'Class', 'Category', 'Intensity', 'Status', 'Opened', 'Guardian contact']}>
              {counsel.map((c) => { const st = studentById(s, c.studentId); return <tr key={c.id}><td className="font-medium">{st?.name}</td><td>{st && className(st.grade, st.section)}</td><td>{c.category}</td><td><Pill tone={sevTone(c.intensity)}>{c.intensity}</Pill></td><td>{c.status}</td><td>{fmtDate(c.openedAt)}</td><td>{st && <ContactLinks phone={st.guardianPhone} email={st.guardianEmail} />}</td></tr>; })}
            </Table></div>
          </>
        )}
        {view === 'attendance' && (
          <Table head={['Student', 'Class', 'Absences (20 days)', 'Late', 'Rate', 'Guardian contact']}>
            {chronic.map(({ x, a }) => <tr key={x.id}><td className="font-medium">{x.name}</td><td>{className(x.grade, x.section)}</td><td>{a.absent}</td><td>{a.late}</td><td>{a.rate}%</td><td><ContactLinks phone={x.guardianPhone} email={x.guardianEmail} /></td></tr>)}
          </Table>
        )}
        {view === 'active' && (
          <Table head={['Class', 'Active students', 'Girls', 'Boys', 'Open cases']}>
            {allSections(s).map(({ grade, section }) => { const r = roster(s, grade, section); return <tr key={`${grade}${section}`}><td>{className(grade, section)}</td><td>{r.length}</td><td>{r.filter((x) => x.gender === 'F').length}</td><td>{r.filter((x) => x.gender === 'M').length}</td><td>{openCases.filter((i) => r.some((x) => x.id === i.studentId)).length}</td></tr>; })}
          </Table>
        )}
      </Card>
      <StudentProfileDialog studentId={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ============================ EXAMINATION AND RESULTS ============================ */

export function ExamsResults() {
  const s = useSchool();
  const me = useMe();
  const pending = s.gradebooks.filter((g) => g.status === 'submitted');
  const [grade, setGrade] = useState<number | null>(pending[0]?.grade ?? null);
  const [section, setSection] = useState<string | null>(pending[0]?.section ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [returning, setReturning] = useState<Gradebook | null>(null);
  const [reason, setReason] = useState('');
  const [flash, setFlash] = useState('');
  const open = s.gradebooks.find((g) => g.id === openId) ?? null;
  const approvedCount = s.gradebooks.filter((g) => g.status === 'approved').length;
  const awaitingRelease = s.gradebooks.filter((g) => g.status === 'approved' && batchStage(s, g.grade, g.section) !== 'released').length;
  const released = s.gradebooks.filter((g) => batchStage(s, g.grade, g.section) === 'released').length;
  const sectionBooks = grade != null && section ? s.gradebooks.filter((g) => g.grade === grade && g.section === section) : [];
  const approve = (g: Gradebook) => { actions.approveGradebook(g.id, me.name); setFlash(`${className(g.grade, g.section)} ${g.subject} approved. The Academic Officer has been notified.`); setOpenId(null); };
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Examination and Results" subtitle="Review gradebooks submitted by teachers. Choose a class, then a section, then open the gradebook." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Pending gradebooks" value={pending.length} tone="warning" icon={<ClipboardCheck className="w-5 h-5" />} />
        <Stat label="Approved gradebooks" value={approvedCount} tone="success" icon={<CheckCircle2 className="w-5 h-5" />} />
        <Stat label="Awaiting release" value={awaitingRelease} sub="Approved, report cards not yet released" icon={<BookOpenCheck className="w-5 h-5" />} />
        <Stat label="Released" value={released} sub="Gradebooks whose report cards are out" tone="accent" icon={<Award className="w-5 h-5" />} />
      </div>
      {flash && <Notice tone="success">{flash}</Notice>}
      <Card title="Pending gradebooks by class">
        <div className="flex flex-wrap gap-2 mb-4">
          {gradesOf(s).map((g) => {
            const n = pending.filter((x) => x.grade === g).length;
            return <button key={g} type="button" onClick={() => { setGrade(g); setSection(pending.find((x) => x.grade === g)?.section ?? null); }} className={`px-4 py-2 rounded-lg border text-sm font-medium ${grade === g ? 'bg-navy-800 text-white border-navy-800' : 'border-navy-200 text-navy-700 hover:bg-navy-50'}`}>Grade {g}{n > 0 && <span className="ml-2 px-1.5 rounded-full bg-warning-400 text-navy-900 text-xs">{n}</span>}</button>;
          })}
        </div>
        {grade != null && (
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-sm text-navy-500 self-center mr-1">Section:</span>
            {sectionsOf(s, grade).map((sec) => {
              const n = pending.filter((x) => x.grade === grade && x.section === sec).length;
              return <button key={sec} type="button" onClick={() => setSection(sec)} className={`px-4 py-2 rounded-lg border text-sm font-medium ${section === sec ? 'bg-navy-700 text-white border-navy-700' : 'border-navy-200 text-navy-700 hover:bg-navy-50'}`}>{grade}{sec}{n > 0 && <span className="ml-2 px-1.5 rounded-full bg-warning-400 text-navy-900 text-xs">{n}</span>}</button>;
            })}
          </div>
        )}
        {grade != null && section && (
          <Table head={['Subject', 'Teacher', 'File', 'Submitted', 'Status', 'Actions']}>
            {sectionBooks.map((g) => (
              <tr key={g.id}>
                <td className="font-medium">{g.subject}</td>
                <td>{staffName(s, g.teacherId)}</td>
                <td className="text-xs">{g.fileName || '—'}</td>
                <td className="text-xs">{fmtDate(g.submittedAt)}</td>
                <td><Pill tone={gradebookTone(g.status)}>{GRADEBOOK_LABEL[g.status]}</Pill></td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary text-xs py-1.5" disabled={g.status === 'draft'} onClick={() => setOpenId(g.id)}>Open Gradebook</button>
                    {g.status === 'submitted' && <button type="button" className="btn-primary text-xs py-1.5" onClick={() => approve(g)}>Approve</button>}
                    {g.status === 'submitted' && <button type="button" className="btn-ghost text-xs py-1.5 text-error-600" onClick={() => { setReturning(g); setReason(''); }}>Return</button>}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {grade == null && <p className="text-sm text-navy-500">Select a class to begin.</p>}
      </Card>
      <GradebookDialog gradebook={open} onClose={() => setOpenId(null)} actionsSlot={open?.status === 'submitted' ? <>
        <button type="button" className="btn-ghost text-error-600" onClick={() => { setReturning(open); setReason(''); setOpenId(null); }}>Return for correction</button>
        <button type="button" className="btn-primary" onClick={() => approve(open)}><CheckCircle2 className="w-4 h-4" /> Approve gradebook</button>
      </> : undefined} />
      <Dialog open={!!returning} onClose={() => setReturning(null)} title="Return gradebook for correction" footer={<>
        <button type="button" className="btn-secondary" onClick={() => setReturning(null)}>Cancel</button>
        <button type="button" className="btn-danger" disabled={reason.trim().length < 5} onClick={() => { if (returning) { actions.returnGradebook(returning.id, reason.trim(), me.name); setFlash(`${className(returning.grade, returning.section)} ${returning.subject} returned to ${staffName(s, returning.teacherId)}.`); } setReturning(null); }}>Return to teacher</button>
      </>}>
        <label className="block"><span className="label">Reason (sent to the teacher)</span><textarea className="input min-h-[100px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Final exam marks missing for two students." /></label>
      </Dialog>
    </div>
  );
}

/* ============================ REPORT CARD APPROVALS ============================ */

export function ReportCardApprovals() {
  const s = useSchool();
  const me = useMe();
  const ready = s.batches.filter((b) => b.status === 'submitted');
  const [grade, setGrade] = useState<number | null>(ready[0]?.grade ?? null);
  const [section, setSection] = useState<string | null>(ready[0]?.section ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [returning, setReturning] = useState(false);
  const [comment, setComment] = useState('');
  const [flash, setFlash] = useState('');
  const stage = grade != null && section ? batchStage(s, grade, section) : null;
  const batch = grade != null && section ? s.batches.find((b) => b.key === `${grade}${section}`) : undefined;
  const kids = grade != null && section ? roster(s, grade, section) : [];
  const approvedCount = s.gradebooks.filter((g) => g.status === 'approved').length;
  const awaiting = s.gradebooks.filter((g) => g.status === 'approved' && batchStage(s, g.grade, g.section) !== 'released').length;
  const released = s.gradebooks.filter((g) => batchStage(s, g.grade, g.section) === 'released').length;
  const sheetsDone = batch ? Object.values(batch.sheets).filter((x) => x.status === 'reviewed').length : 0;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Report Card Approvals" subtitle="Results and approval: preview each student's gradesheet, then authorize release for the whole class section." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Approved gradebooks" value={approvedCount} tone="success" icon={<CheckCircle2 className="w-5 h-5" />} />
        <Stat label="Awaiting release" value={awaiting} sub="Approved gradebooks not yet released" icon={<BookOpenCheck className="w-5 h-5" />} tone="warning" />
        <Stat label="Ready for your review" value={ready.length} sub="Class batches from the Academic Officer" icon={<FileBarChart className="w-5 h-5" />} tone="accent" />
        <Stat label="Released" value={released} sub={`${s.batches.filter((b) => b.status === 'released').length} class sections`} icon={<Award className="w-5 h-5" />} />
      </div>
      {flash && <Notice tone="success">{flash}</Notice>}
      <Card title="Grades Awaiting Release Authorization" subtitle={`Academic year ${s.school.academicYear}${s.school.currentPeriod ? ` · ${s.school.currentPeriod}` : ''}`}>
        <ClassSectionPicker grade={grade} section={section} onChange={(g, sec) => { setGrade(g); setSection(sec); }} />
        {grade != null && section && stage && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-semibold text-navy-900">Grade {grade}{section}</h3>
              <Pill tone={stage === 'submitted' ? 'warning' : stage === 'released' || stage === 'authorized' ? 'success' : 'muted'}>{BATCH_LABEL[stage]}</Pill>
              {batch && <span className="text-xs text-navy-500">{sheetsDone} of {kids.length} gradesheets complete</span>}
            </div>
            {stage === 'not_ready' && <Notice tone="warning">Not all subject gradebooks for Grade {grade}{section} are approved yet. Approve them in Examination and Results first.</Notice>}
            {(stage === 'awaiting_processing' || stage === 'in_progress' || stage === 'returned') && <Notice tone="warning">The Academic Officer has not yet completed and submitted the gradesheets for Grade {grade}{section}{batch ? ` (${sheetsDone} of ${kids.length} complete)` : ''}. You can authorize release once all gradesheets are submitted to you.</Notice>}
            {stage === 'authorized' && <Notice tone="success">Release authorized on {fmtDate(batch?.authorizedAt)}. The Academic Officer will release report cards privately to each student and guardian.</Notice>}
            {stage === 'released' && <Notice tone="success">Released on {fmtDate(batch?.releasedAt)} by {batch?.releasedBy}.</Notice>}
            {batch && ['submitted', 'authorized', 'released'].includes(stage) && (
              <Table head={['Student', 'Student ID', 'Average', 'Gradesheet', '']}>
                {kids.map((k) => { const avg = studentAverage(s, k.id); return <tr key={k.id}><td className="font-medium">{k.name}</td><td className="font-mono text-xs">{k.studentNo}</td><td>{avg ?? '—'}%</td><td><Pill tone={batch.sheets[k.id]?.status === 'reviewed' ? 'success' : 'warning'}>{batch.sheets[k.id]?.status ?? 'missing'}</Pill></td><td><button type="button" className="text-sm font-medium text-navy-700 hover:underline" onClick={() => setPreview(k.id)}>Preview gradesheet</button></td></tr>; })}
              </Table>
            )}
            {stage === 'submitted' && (
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setReturning(true); setComment(''); }}>Return to Academic Officer</button>
                <button type="button" className="btn-primary" onClick={() => setConfirm(true)}><CheckCircle2 className="w-4 h-4" /> Authorize Release — Grade {grade}{section}</button>
              </div>
            )}
          </div>
        )}
      </Card>
      <Card title="All class sections">
        <Table head={['Class', 'Status', 'Gradesheets', 'Submitted', 'Authorized', 'Released']}>
          {allSections(s).map(({ grade: g, section: sec }) => {
            const st = batchStage(s, g, sec);
            const b = s.batches.find((x) => x.key === `${g}${sec}`);
            return <tr key={`${g}${sec}`} className="cursor-pointer" onClick={() => { setGrade(g); setSection(sec); }}><td className="font-medium">{className(g, sec)}</td><td><Pill tone={st === 'submitted' ? 'warning' : st === 'released' ? 'success' : st === 'authorized' ? 'accent' : 'muted'}>{BATCH_LABEL[st]}</Pill></td><td>{b ? Object.keys(b.sheets).length : '—'}</td><td>{fmtDate(b?.submittedAt)}</td><td>{fmtDate(b?.authorizedAt)}</td><td>{fmtDate(b?.releasedAt)}</td></tr>;
          })}
        </Table>
      </Card>
      <Dialog open={!!preview} onClose={() => setPreview(null)} wide="xl" title="Gradesheet preview" footer={preview && batch?.status === 'submitted' ? (
        <PrincipalRemark key={preview} value={batch.sheets[preview]?.principalRemark ?? ''} onSave={(v) => actions.setSheet(batch.key, preview, { principalRemark: v })} />
      ) : undefined}>
        {preview && <ReportCardView school={s} studentId={preview} />}
      </Dialog>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Authorize release" footer={<>
        <button type="button" className="btn-secondary" onClick={() => setConfirm(false)}>Cancel</button>
        <button type="button" className="btn-primary" onClick={() => { if (batch) { actions.authorizeRelease(batch.key, me.name); setFlash(`Release authorized for Grade ${grade}${section}. The Academic Officer has been notified.`); } setConfirm(false); }}>Authorize release</button>
      </>}>
        <p className="text-sm text-navy-700">You are authorizing release of <b>{kids.length}</b> report cards for <b>Grade {grade}{section}</b>. The Academic Officer will then release each report card privately to the student and their linked guardians. Authorization does not publish the report cards by itself.</p>
      </Dialog>
      <Dialog open={returning} onClose={() => setReturning(false)} title={`Return Grade ${grade}${section} report cards`} footer={<>
        <button type="button" className="btn-secondary" onClick={() => setReturning(false)}>Cancel</button>
        <button type="button" className="btn-danger" disabled={comment.trim().length < 5} onClick={() => { if (batch) { actions.returnBatch(batch.key, comment.trim(), me.name); setFlash(`Grade ${grade}${section} report cards returned to the Academic Officer.`); } setReturning(false); }}>Return for correction</button>
      </>}>
        <label className="block"><span className="label">Corrections required</span><textarea className="input min-h-[100px]" value={comment} onChange={(e) => setComment(e.target.value)} /></label>
      </Dialog>
    </div>
  );
}

function PrincipalRemark({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <input className="input flex-1 min-w-[240px] py-2 text-sm" value={v} onChange={(e) => { setV(e.target.value); setSaved(false); }} placeholder="Principal's remark (optional)" />
      <button type="button" className="btn-secondary text-sm" onClick={() => { onSave(v); setSaved(true); }}>{saved ? 'Saved' : 'Save remark'}</button>
    </div>
  );
}

/* ============================ ADMINISTRATIVE REPORTS ============================ */

export function AdministrativeReports() {
  const s = useSchool();
  const days = schoolDays(20);
  const reports = useMemo(() => [
    {
      id: 'enrollment', title: 'Enrollment report', desc: 'All enrolled students by class and section.',
      header: ['Student ID', 'Name', 'Gender', 'Class', 'Year entered', 'Status', 'Guardian', 'Phone'],
      rows: () => s.students.map((x) => [x.studentNo, x.name, x.gender, className(x.grade, x.section), x.yearEntered, x.status, x.guardianName, x.guardianPhone]),
    },
    {
      id: 'attendance', title: 'Attendance report (last 20 school days)', desc: 'Present, absent, late and rate per student.',
      header: ['Student ID', 'Name', 'Class', 'Present', 'Absent', 'Late', 'Excused', 'Rate %'],
      rows: () => activeStudents(s).map((x) => { const a = attendanceSummary([x.id], days); return [x.studentNo, x.name, className(x.grade, x.section), a.present, a.absent, a.late, a.excused, a.rate]; }),
    },
    {
      id: 'academic', title: 'Academic performance report', desc: 'Average and category for every student.',
      header: ['Student ID', 'Name', 'Class', 'Average', 'Category'],
      rows: () => activeStudents(s).map((x) => { const a = studentAverage(s, x.id); return [x.studentNo, x.name, className(x.grade, x.section), a, a != null ? CATEGORY_LABEL[categoryFor(a, s.grading)] : '']; }),
    },
    {
      id: 'discipline', title: 'Discipline report', desc: 'All incidents with severity, status and outcome.',
      header: ['Date', 'Student', 'Class', 'Category', 'Severity', 'Status', 'Reported by', 'Outcome'],
      rows: () => s.incidents.map((i) => { const st = studentById(s, i.studentId); return [i.reportedAt.slice(0, 10), st?.name, st ? className(st.grade, st.section) : '', i.category, i.severity, i.status, i.reportedByName, i.outcome ?? '']; }),
    },
    {
      id: 'staff', title: 'Staff activity report', desc: 'Teacher attendance over the last 20 school days.',
      header: ['Staff ID', 'Name', 'Position', 'Days recorded', 'Present', 'Late', 'Absent', 'On leave'],
      rows: () => s.staff.filter((x) => x.role !== 'support').map((x) => { const h = s.staffAttendance.filter((a) => a.staffId === x.id); const c = (st: string) => h.filter((a) => a.status === st).length; return [x.staffNo, x.name, x.position, h.length, c('present'), c('late'), c('absent'), c('on_leave')]; }),
    },
    {
      id: 'finance', title: 'Financial summary', desc: 'Fee account per student: billed, paid, balance.',
      header: ['Student ID', 'Name', 'Class', 'Billed', 'Concessions', 'Paid', 'Balance', 'Status'],
      rows: () => activeStudents(s).map((x) => { const f = feeAccount(s, x.id); return [x.studentNo, x.name, className(x.grade, x.section), f.charged, f.concessions, f.paid, f.balance, f.status]; }),
    },
    {
      id: 'gradebooks', title: 'Gradebook status report', desc: 'Submission and approval status of every subject gradebook.',
      header: ['Class', 'Subject', 'Teacher', 'Status', 'Submitted', 'Approved'],
      rows: () => s.gradebooks.map((g) => [className(g.grade, g.section), g.subject, staffName(s, g.teacherId), GRADEBOOK_LABEL[g.status], g.submittedAt?.slice(0, 10) ?? '', g.approvedAt?.slice(0, 10) ?? '']),
    },
  ], [s, days]);
  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Administrative Reports" subtitle="Generated automatically from live school records. Download to your computer (opens in Excel) or print / save as PDF." />
      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.id} title={r.title} subtitle={r.desc}>
            <p className="text-xs text-navy-400 mb-3">{r.rows().length} records · generated {fmtDate(stamp)}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary text-sm" onClick={() => downloadCsv(`${s.school.name.replace(/\s/g, '')}_${r.id}_${stamp}`, r.header, r.rows())}><Download className="w-4 h-4" /> Download (.csv)</button>
              <button type="button" className="btn-secondary text-sm" onClick={() => printHtml(r.title, `<h1>${s.school.name} — ${r.title}</h1><p class="muted">${s.school.academicYear} · generated ${fmtDate(stamp)}</p>${tableHtml(r.header, r.rows())}`)}><Printer className="w-4 h-4" /> Print / PDF</button>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Daily reports from the Vice Principal">
        <div className="divide-y divide-navy-100">
          {s.staffReports.map((r) => <div key={r.id} className="py-3"><p className="text-sm font-medium text-navy-900">{fmtDate(r.date)} — {r.author}</p><p className="text-sm text-navy-700">{r.summary}</p><p className="text-xs text-navy-400">{r.teachersAbsent} teacher(s) absent · {r.incidents} incident(s)</p></div>)}
        </div>
      </Card>
    </div>
  );
}

/* ================================== SETTINGS ================================== */

export function PrincipalSettings() {
  const s = useSchool();
  const me = useMe();
  const [prefs, setPrefs] = useState({ gradebooks: true, reportCards: true, incidents: true, finance: false });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Settings" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="My account">
          <dl className="text-sm divide-y divide-navy-100">
            {[['Name', me.name], ['Email', me.email], ['Role', 'Principal'], ['School', s.school.name]].map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr] py-2"><dt className="text-navy-500">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <button type="button" className="btn-secondary text-sm mt-4" disabled title="Password changes are handled by the school's sign-in provider.">Change password</button>
          <p className="text-xs text-navy-400 mt-1">Password changes will be available once school sign-in is connected.</p>
        </Card>
        <Card title="Notify me about">
          <div className="space-y-3">
            {([['gradebooks', 'New gradebook submissions'], ['reportCards', 'Report cards ready for review'], ['incidents', 'Serious incidents referred by the Dean'], ['finance', 'Financial reports from the Finance Director']] as const).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} /></label>
            ))}
          </div>
        </Card>
        <Card title="Approval delegation">
          <p className="text-sm text-navy-600">You hold final authority for gradebook approval and report-card release. No delegation is active.</p>
          <p className="text-xs text-navy-400 mt-2">Delegations must be scoped and time-limited, and are recorded in the audit history.</p>
        </Card>
        <Card title="Parent–teacher messaging">
          <label className="flex items-center justify-between gap-3 text-sm"><span>Allow parents to message their child's teachers</span><input type="checkbox" checked={s.school.parentTeacherMessaging} onChange={(e) => actions.setMessaging(e.target.checked)} /></label>
          <p className="text-xs text-navy-400 mt-2">School-controlled permission. Teachers only see threads about students they teach.</p>
        </Card>
      </div>
    </div>
  );
}
