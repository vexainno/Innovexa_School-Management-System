import { useState } from 'react';
import {
  Users, CalendarCheck, GraduationCap, ClipboardCheck, Award, Megaphone,
  TrendingUp, AlertCircle, CheckCircle2, FileBarChart, UserCheck, Bell, Eye,
  Download, FileSpreadsheet, CalendarClock, Upload, XCircle, Send,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Avatar, ProgressBar, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  SCHOOL_INFO, STUDENTS, CLASSES, GRADEBOOK_SUBMISSIONS, ANNOUNCEMENTS,
  ATTENDANCE, GRADES,
} from '@/data/mockData';
import type { GradebookSubmission } from '@/types';
import { getGradebooks, setGradebooks, getAttendance, getStudentsForClass, getReportRelease, setReportRelease, generateReportCards, saveReportCards, getReportCards, saveGeneratedFile, type WorkflowGradebook } from '@/data/workflow';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    submitted: 'badge-info',
    under_review: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-error',
  };
  return map[status] || 'badge-info';
};

export function PrincipalDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const pendingSubmissions = GRADEBOOK_SUBMISSIONS.filter(
    (s) => s.status === 'submitted' || s.status === 'under_review'
  );
  const approvedSubmissions = GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'approved');
  const todayAttendance = ATTENDANCE.filter((a) => a.date === '2026-09-21');
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`${SCHOOL_INFO.schoolName} — ${SCHOOL_INFO.academicYear} ${SCHOOL_INFO.currentTerm}`}
      />

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={SCHOOL_INFO.totalStudents} icon={<Users className="w-5 h-5" />} color="navy" onClick={() => onNavigate('enrollment')} />
        <StatCard label="Present Today" value={presentCount} icon={<CalendarCheck className="w-5 h-5" />} color="success" trend={`${absentCount} absent`} onClick={() => onNavigate('attendance')} />
        <StatCard label="Pending Gradebooks" value={pendingSubmissions.length} icon={<ClipboardCheck className="w-5 h-5" />} color="warning" onClick={() => onNavigate('gradebook-approvals')} />
        <StatCard label="Approved Grades" value={approvedSubmissions.length} icon={<CheckCircle2 className="w-5 h-5" />} color="success" onClick={() => onNavigate('results')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending gradebook submissions */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Pending Gradebook Submissions"
            action={
              <button onClick={() => onNavigate('gradebook-approvals')} className="btn-ghost text-sm">
                View All
              </button>
            }
          >
            {pendingSubmissions.length === 0 ? (
              <EmptyState icon={<ClipboardCheck className="w-8 h-8" />} title="No pending submissions" message="All gradebooks have been reviewed." />
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((sub) => (
                  <GradebookRow key={sub.id} sub={sub} onApprove={() => onNavigate('gradebook-approvals')} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Enrollment summary */}
          <SectionCard
            title="Enrollment Summary"
            action={
              <button onClick={() => onNavigate('enrollment')} className="btn-ghost text-sm">View Details</button>
            }
          >
            <div className="space-y-3">
              {CLASSES.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-navy-700">{cls.name}</p>
                      <p className="text-sm text-navy-500">{cls.studentCount} students</p>
                    </div>
                    <ProgressBar value={cls.studentCount} max={35} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Announcements */}
          <SectionCard
            title="Recent Announcements"
            action={
              <button onClick={() => onNavigate('announcements')} className="btn-ghost text-sm">View All</button>
            }
          >
            <div className="space-y-4">
              {ANNOUNCEMENTS.slice(0, 3).map((an) => (
                <div key={an.id} className="border-l-2 border-navy-300 pl-3">
                  <p className="text-sm font-medium text-navy-800">{an.title}</p>
                  <p className="text-xs text-navy-400 mt-0.5">{an.date} — by {an.author}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Quick actions */}
          <SectionCard title="Principal Actions">
            <div className="space-y-2">
              <button onClick={() => onNavigate('gradebook-approvals')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><ClipboardCheck className="w-4 h-4" /></div>
                <span className="text-sm font-medium text-navy-700">Review Gradebooks</span>
              </button>
              <button onClick={() => onNavigate('results')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-success-100 text-success-700"><Award className="w-4 h-4" /></div>
                <span className="text-sm font-medium text-navy-700">Approve Final Grades</span>
              </button>
              <button onClick={() => onNavigate('announcements')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-accent-100 text-accent-700"><Megaphone className="w-4 h-4" /></div>
                <span className="text-sm font-medium text-navy-700">Publish Announcement</span>
              </button>
              <button onClick={() => onNavigate('reports')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><FileBarChart className="w-4 h-4" /></div>
                <span className="text-sm font-medium text-navy-700">View School Reports</span>
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function GradebookRow({ sub, onApprove }: { sub: GradebookSubmission; onApprove: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-navy-100 hover:border-navy-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-navy-100 text-navy-700">
          <ClipboardCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-navy-800">{sub.subjectName} — {sub.className}</p>
          <p className="text-xs text-navy-400">Submitted by {sub.teacherName} on {sub.submittedDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={statusBadge(sub.status)}>{sub.status.replace('_', ' ')}</span>
        <button onClick={onApprove} className="btn-secondary text-xs py-1.5 px-3">Review</button>
      </div>
    </div>
  );
}

// --- Gradebook Approvals page ---
export function PrincipalGradebookApprovals() {
  const [submissions, setSubmissions] = useState(GRADEBOOK_SUBMISSIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const pending = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review');
  const selected = submissions.find((s) => s.id === selectedId) || null;
  const sampleMarks = selected
    ? GRADES.filter((g) => g.subjectName === selected.subjectName && g.assessmentTitle && g.status !== 'released')
    : [];
  const reviewRows = selected
    ? STUDENTS.filter((student) => student.class === selected.className.replace('Grade ', '')).map((student) => ({
        student,
        marks: sampleMarks.filter((mark) => mark.studentId === student.id),
      }))
    : [];
  const reviewedCount = reviewRows.length;
  const missingCount = reviewRows.filter((row) => row.marks.length === 0).length;

  const closeReview = () => {
    setSelectedId(null);
    setReturnReason('');
    setFeedback('');
  };
  const approve = () => {
    if (!selected) return;
    setSubmissions((prev) => prev.map((s) => (s.id === selected.id ? { ...s, status: 'approved' } : s)));
    setFeedback('Approved in demo mode. This does not update an official school record.');
    closeReview();
  };
  const returnForCorrection = () => {
    if (!selected || !returnReason.trim()) return;
    setSubmissions((prev) => prev.map((s) => (s.id === selected.id ? { ...s, status: 'rejected' } : s)));
    setFeedback('Returned in demo mode with the review reason recorded for this session.');
    closeReview();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Gradebook Approvals" subtitle="Inspect the student-level marks before approving or returning a teacher gradebook." />
      {feedback && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{feedback}</div>}
      <SectionCard title={`Pending Review (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="All gradebooks reviewed" message="There are no pending gradebook submissions at this time." />
        ) : (
          <div className="space-y-3">
            {pending.map((sub) => (
              <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-navy-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-navy-100 text-navy-700"><ClipboardCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{sub.subjectName} — {sub.className}</p>
                    <p className="text-xs text-navy-400 mt-0.5">{sub.teacherName} · {sub.studentCount} students · {sub.term}</p>
                    <p className="text-xs text-navy-400">Submitted: {sub.submittedDate}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedId(sub.id)} className="btn-primary text-xs py-2 px-3">Open student preview</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      <Modal open={Boolean(selected)} onClose={closeReview} title={selected ? `Review ${selected.subjectName} · ${selected.className}` : 'Review gradebook'} size="xl">
        {selected && <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-navy-50 p-3"><p className="text-xs text-navy-500">Submitted by</p><p className="text-sm font-semibold text-navy-900 mt-1">{selected.teacherName}</p></div>
            <div className="rounded-lg bg-navy-50 p-3"><p className="text-xs text-navy-500">Class size</p><p className="text-sm font-semibold text-navy-900 mt-1">{selected.studentCount}</p></div>
            <div className="rounded-lg bg-navy-50 p-3"><p className="text-xs text-navy-500">Previewed records</p><p className="text-sm font-semibold text-navy-900 mt-1">{reviewedCount} sample rows</p></div>
            <div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-amber-700">Missing sample marks</p><p className="text-sm font-semibold text-amber-900 mt-1">{missingCount}</p></div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Demo preview: approval is disabled until every enrolled student and all required marks are present. The seeded dataset contains only a subset of this class, so this sample cannot be approved as a complete gradebook.</div>
          <div className="overflow-x-auto rounded-lg border border-navy-100">
            <table className="table-base min-w-[680px]">
              <thead><tr><th>Student</th><th>Student ID</th><th>Assessment marks</th><th>Total recorded</th><th>Review flag</th></tr></thead>
              <tbody>{reviewRows.map(({ student, marks }) => {
                const earned = marks.reduce((sum, mark) => sum + mark.score, 0);
                const possible = marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
                return <tr key={student.id}>
                  <td className="font-medium">{student.name}</td><td>{student.rollNo}</td>
                  <td>{marks.length ? marks.map((mark) => `${mark.score}/${mark.totalMarks}`).join(' · ') : 'No marks in demo data'}</td>
                  <td>{marks.length ? `${earned}/${possible}` : '—'}</td>
                  <td><span className={marks.length ? 'badge-success' : 'badge-warning'}>{marks.length ? 'Sample marks found' : 'Missing sample marks'}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <div>
            <label className="label" htmlFor="gradebook-return-reason">Return reason (required if returning)</label>
            <textarea id="gradebook-return-reason" className="input min-h-24" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} placeholder="Explain the correction required for the teacher..." />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={closeReview} className="btn-secondary">Close preview</button>
            <button type="button" onClick={returnForCorrection} disabled={!returnReason.trim()} className="btn-secondary text-error-700">Return for correction</button>
            <button type="button" onClick={approve} disabled={reviewedCount !== selected.studentCount || missingCount > 0} className="btn-primary">Approve demo gradebook</button>
          </div>
        </div>}
      </Modal>
    </div>
  );
}

// --- Results & Approval ---
export function PrincipalResults() {
  const [released, setReleased] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Results & Approval" subtitle="Review approved grades and authorize result release." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard label="Approved Gradebooks" value={GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'approved').length} icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Awaiting Release" value={2} icon={<Award className="w-5 h-5" />} color="warning" />
        <StatCard label="Released" value={released ? '1' : '0'} icon={<TrendingUp className="w-5 h-5" />} color="navy" />
      </div>
      <SectionCard title="Grades Awaiting Release Authorization">
        <div className="space-y-3">
          {GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'approved').map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border border-navy-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success-100 text-success-700"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{sub.subjectName} — {sub.className}</p>
                  <p className="text-xs text-navy-400">{sub.term} — {sub.studentCount} students</p>
                </div>
              </div>
              <button onClick={() => setReleased(true)} className="btn-primary text-sm">Authorize Release</button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// --- Enrollment Overview ---
export function PrincipalEnrollment() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Enrollment Overview" subtitle="School-wide enrollment summary by class." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Enrolled" value={SCHOOL_INFO.totalStudents} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Active Classes" value={SCHOOL_INFO.totalClasses} icon={<GraduationCap className="w-5 h-5" />} color="accent" />
        <StatCard label="Total Staff" value={SCHOOL_INFO.totalStaff} icon={<UserCheck className="w-5 h-5" />} color="success" />
      </div>
      <SectionCard title="Enrollment by Class">
        <table className="table-base">
          <thead><tr><th>Class</th><th>Section</th><th>Homeroom Teacher</th><th>Students</th><th>Room</th></tr></thead>
          <tbody>
            {CLASSES.map((cls) => (
              <tr key={cls.id}>
                <td className="font-medium text-navy-800">{cls.grade}</td>
                <td>{cls.section}</td>
                <td>{cls.teacherName}</td>
                <td>{cls.studentCount}</td>
                <td>{cls.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// --- Attendance Overview ---
export function PrincipalAttendance() {
  const todayRecords = ATTENDANCE.filter((a) => a.date === '2026-09-21');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance Overview" subtitle="School-wide attendance for today." />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Present" value={todayRecords.filter((a) => a.status === 'present').length} icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Absent" value={todayRecords.filter((a) => a.status === 'absent').length} icon={<AlertCircle className="w-5 h-5" />} color="error" />
        <StatCard label="Late" value={todayRecords.filter((a) => a.status === 'late').length} icon={<CalendarCheck className="w-5 h-5" />} color="warning" />
        <StatCard label="Excused" value={todayRecords.filter((a) => a.status === 'excused').length} icon={<CalendarCheck className="w-5 h-5" />} color="navy" />
      </div>
      <SectionCard title="Today's Attendance Records">
        <table className="table-base">
          <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {todayRecords.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-navy-800">{r.studentName}</td>
                <td>{r.className}</td>
                <td>
                  <span className={
                    r.status === 'present' ? 'badge-success' :
                    r.status === 'absent' ? 'badge-error' :
                    r.status === 'late' ? 'badge-warning' : 'badge-info'
                  }>{r.status}</span>
                </td>
                <td className="text-navy-400">{r.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// --- Academic Performance ---
export function PrincipalPerformance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Performance" subtitle="School-wide academic performance overview." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Avg. Pass Rate" value="87%" icon={<TrendingUp className="w-5 h-5" />} color="success" />
        <StatCard label="Honor Roll Students" value="34" icon={<Award className="w-5 h-5" />} color="accent" />
        <StatCard label="At-Risk Students" value="8" icon={<AlertCircle className="w-5 h-5" />} color="error" />
      </div>
      <SectionCard title="Performance by Class">
        <table className="table-base">
          <thead><tr><th>Class</th><th>Average Score</th><th>Pass Rate</th><th>Honor Roll</th><th>At-Risk</th></tr></thead>
          <tbody>
            {CLASSES.map((cls, i) => (
              <tr key={cls.id}>
                <td className="font-medium text-navy-800">{cls.name}</td>
                <td>{[78, 82, 85, 88, 91, 84][i]}%</td>
                <td><span className="badge-success">{[82, 85, 88, 90, 92, 86][i]}%</span></td>
                <td>{[4, 5, 6, 7, 8, 4][i]}</td>
                <td>{[2, 1, 2, 1, 1, 1][i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// --- Student Affairs ---
export function PrincipalStudentAffairs() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Affairs Overview" subtitle="School-wide student affairs summary." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Students" value={STUDENTS.filter((s) => s.status === 'active').length} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Discipline Cases" value="4" icon={<AlertCircle className="w-5 h-5" />} color="warning" />
        <StatCard label="Counseling Cases" value="4" icon={<AlertCircle className="w-5 h-5" />} color="navy" />
      </div>
      <SectionCard title="Recent Student Affairs Items">
        <div className="space-y-3">
          {STUDENTS.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <Avatar name={s.name} color={s.photoColor} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{s.name}</p>
                <p className="text-xs text-navy-400">{s.grade} — {s.class}</p>
              </div>
              <span className={s.status === 'active' ? 'badge-success' : 'badge-warning'}>{s.status}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// --- Reports ---
export function PrincipalReports() {
  const reports = [
    { name:'Enrollment Report', desc:'Total enrollment by class and grade', icon:Users, file:'enrollment-report.csv' },
    { name:'Attendance Report', desc:'Daily attendance by class', icon:CalendarCheck, file:'attendance-report.csv' },
    { name:'Academic Performance', desc:'Grades, averages, and pass rates', icon:GraduationCap, file:'academic-performance.csv' },
    { name:'Financial Summary', desc:'Fees collection and outstanding', icon:FileBarChart, file:'financial-summary.csv' },
    { name:'Discipline Report', desc:'Incidents and actions taken', icon:AlertCircle, file:'discipline-report.csv' },
    { name:'Staff Activity', desc:'Teacher submissions and activity', icon:UserCheck, file:'staff-activity.csv' },
  ];
  const generate=async(name:string,file:string)=>{let rows='Report,Value\n'; if(name==='Enrollment Report') rows += CLASSES.map(c=>`"${c.name}",${c.studentCount}`).join('\n'); else if(name==='Attendance Report') rows += getAttendance().filter(a=>a.date===new Date().toISOString().slice(0,10)).map(a=>`"${a.studentName}","${a.className}","${a.status}","${a.session}"`).join('\n'); else rows += `"${name}","Generated ${new Date().toLocaleString()}"\n"Students",${STUDENTS.filter(s=>s.status==='active').length}`; await saveGeneratedFile(rows,file);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="School Reports" subtitle="Generate a document and choose where to save it on your computer."/><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{reports.map(r=><div key={r.name} className="card-hover p-5"><div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><r.icon className="w-5 h-5"/></div><h3 className="font-semibold text-navy-800">{r.name}</h3><p className="text-sm text-navy-400 mt-1">{r.desc}</p><button onClick={()=>generate(r.name,r.file)} className="btn-secondary text-sm mt-4 w-full"><Download className="w-4 h-4"/> Generate Report</button></div>)}</div></div>;
}

export function PrincipalAnnouncements() {
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const publish = () => {
    if (!title.trim() || !body.trim()) return;
    setAnnouncements((prev) => [
      { id: `an${Date.now()}`, title, body, author: 'Dr. Edward Karpeh', authorRole: 'principal' as const, date: new Date().toISOString().split('T')[0], audience: 'All Students & Staff', priority: 'normal' as const },
      ...prev,
    ]);
    setTitle(''); setBody(''); setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Announcements"
        subtitle="Publish school-wide announcements."
        action={<button onClick={() => setShowCreate(true)} className="btn-primary">New Announcement</button>}
      />
      <SectionCard title="Published Announcements">
        <div className="space-y-4">
          {announcements.map((an) => (
            <div key={an.id} className="p-4 rounded-lg border border-navy-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-navy-800">{an.title}</h3>
                <span className={
                  an.priority === 'urgent' ? 'badge-error' :
                  an.priority === 'important' ? 'badge-warning' : 'badge-info'
                }>{an.priority}</span>
              </div>
              <p className="text-sm text-navy-600">{an.body}</p>
              <p className="text-xs text-navy-400 mt-2">{an.date} — {an.author} — {an.audience}</p>
            </div>
          ))}
        </div>
      </SectionCard>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-up">
            <h2 className="text-lg font-semibold font-display text-navy-900 mb-4">New Announcement</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" /></div>
              <div><label className="label">Message</label><textarea className="input min-h-[100px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement..." /></div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button onClick={publish} className="btn-primary">Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
