import { useState } from 'react';
import {
  Activity, CalendarCheck, Users, BellRing, FileBarChart, AlertCircle,
  CheckCircle2, Clock, TrendingUp, Gavel, CalendarX, ListChecks, UserCheck,
  Save, Plus, X, Download, Eye, Send,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Avatar } from '@/components/ui';
import {
  SCHOOL_INFO, ATTENDANCE, DISCIPLINE_CASES, ANNOUNCEMENTS, CLASSES, SUBJECTS, STUDENTS,
} from '@/data/mockData';
import { getAttendance, getClassAssignments, setClassAssignments, getStudentsForClass, getDisciplineCases, setDisciplineCases, saveGeneratedFile, getSubjectAssignments, setSubjectAssignments } from '@/data/workflow';
import { Modal } from '@/components/ui';

// --- Vice Principal Dashboard ---
export function VicePrincipalDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const todayAttendance = ATTENDANCE.filter((a) => a.date === '2026-09-21');
  const present = todayAttendance.filter((a) => a.status === 'present').length;
  const absent = todayAttendance.filter((a) => a.status === 'absent').length;
  const late = todayAttendance.filter((a) => a.status === 'late').length;
  const openCases = DISCIPLINE_CASES.filter((c) => c.status === 'open' || c.status === 'under_review');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Daily Operations" subtitle={`${SCHOOL_INFO.schoolName} — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} action={<button className="btn-primary" onClick={() => onNavigate('school-calendar')}><CalendarCheck className="w-4 h-4"/> Manage School Calendar</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present Today" value={present} icon={<CheckCircle2 className="w-5 h-5" />} color="success" onClick={() => onNavigate('attendance')} />
        <StatCard label="Absent Today" value={absent} icon={<AlertCircle className="w-5 h-5" />} color="error" onClick={() => onNavigate('attendance')} />
        <StatCard label="Late Arrivals" value={late} icon={<Clock className="w-5 h-5" />} color="warning" onClick={() => onNavigate('attendance')} />
        <StatCard label="Open Discipline Cases" value={openCases.length} icon={<Gavel className="w-5 h-5" />} color="navy" onClick={() => onNavigate('student-affairs')} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Issues Requiring Attention">
          <div className="space-y-3">
            {openCases.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
                <div className="p-2 rounded-lg bg-warning-100 text-warning-700"><AlertCircle className="w-4 h-4" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-800">{c.studentName} — {c.incident}</p>
                  <p className="text-xs text-navy-400">{c.class} — {c.date}</p>
                </div>
                <span className="badge-warning">{c.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Staff Activity Today">
          <div className="space-y-3">
            {[
              { name: 'Mr. Peter Wleh', activity: 'Submitted Gradebook — Mathematics 11A', time: '08:15' },
              { name: 'Ms. Emily Brown', activity: 'Recorded Attendance — English 10A', time: '09:00' },
              { name: 'Mr. Robert Tolbert', activity: 'Verified Payment — INV-2026-001', time: '09:30' },
              { name: 'Mrs. Mary Coleman', activity: 'Enrolled New Student', time: '10:00' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
                <Avatar name={s.name} color="bg-navy-600" size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-800">{s.name}</p>
                  <p className="text-xs text-navy-400">{s.activity}</p>
                </div>
                <span className="text-xs text-navy-400">{s.time}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Operational Notices">
        <div className="space-y-3">
          {ANNOUNCEMENTS.map((an) => (
            <div key={an.id} className="border-l-2 border-navy-300 pl-3">
              <p className="text-sm font-medium text-navy-800">{an.title}</p>
              <p className="text-xs text-navy-400 mt-0.5">{an.date} — {an.author}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function VPOperations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Daily Operations" subtitle="Monitor day-to-day school operations." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Classes in Session" value={SCHOOL_INFO.totalClasses} icon={<Activity className="w-5 h-5" />} />
        <StatCard label="Staff On Duty" value="28" icon={<UserCheck className="w-5 h-5" />} color="success" />
        <StatCard label="Issues Open" value="3" icon={<AlertCircle className="w-5 h-5" />} color="warning" />
      </div>
      <SectionCard title="Class Status">
        <table className="table-base">
          <thead><tr><th>Class</th><th>Teacher</th><th>Students</th><th>Room</th><th>Status</th></tr></thead>
          <tbody>
            {CLASSES.map((c) => (
              <tr key={c.id}>
                <td className="font-medium text-navy-800">{c.name}</td>
                <td>{c.teacherName}</td>
                <td>{c.studentCount}</td>
                <td>{c.room}</td>
                <td><span className="badge-success">In Session</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function VPAttendance() {
  const [selectedClass, setSelectedClass] = useState('c5');
  const [selectedSession, setSelectedSession] = useState<'morning'|'afternoon'|'evening'>('morning');
  const records = getAttendance();
  const students = getStudentsForClass(selectedClass);
  const today = new Date().toISOString().slice(0,10);
  const rows = students.map(s => records.find(r=>r.studentId===s.id && r.classId===selectedClass && r.date===today && r.session===selectedSession));
  const cls=CLASSES.find(c=>c.id===selectedClass);
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Attendance Monitoring" subtitle="Select a specific class and session to monitor attendance quickly."/><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="label">Class</label><select className="input" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>{CLASSES.map(c=><option key={c.id} value={c.id}>{c.grade}{c.section}</option>)}</select></div><div><label className="label">Session</label><select className="input" value={selectedSession} onChange={e=>setSelectedSession(e.target.value as any)}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></div></div><SectionCard title={`${cls?.grade}${cls?.section} — ${selectedSession} — Today`}><table className="table-base"><thead><tr><th>Student</th><th>Roll No</th><th>Status</th><th>Submitted By</th></tr></thead><tbody>{rows.map((r,i)=>{const st=students[i];return <tr key={st.id}><td className="font-medium text-navy-800">{st.name}</td><td>{st.rollNo}</td><td>{r?<span className={r.status==='present'?'badge-success':r.status==='absent'?'badge-error':r.status==='late'?'badge-warning':'badge-info'}>{r.status}</span>:<span className="badge-warning">Not submitted</span>}</td><td>{r?.sponsorName||'—'}</td></tr>})}</tbody></table>{rows.every(r=>!r)&&<EmptyState icon={<CalendarCheck className="w-8 h-8"/>} title="No attendance submitted" message="The class sponsor has not saved attendance for this class and session yet."/>}</SectionCard></div>;
}

export function VPStaff() {
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Staff Activity" subtitle="Monitor staff activity and submissions."/><SectionCard title="Recent Staff Activity"><div className="space-y-3">{['Mr. Peter Wleh — Submitted Gradebook — Mathematics 11A','Ms. Emily Brown — Recorded Attendance — English 10A','Mr. Robert Tolbert — Verified Payment — INV-2026-001','Mrs. Mary Coleman — Enrolled New Student'].map((s,i)=><div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100"><Avatar name={s.split(' — ')[0]} color="bg-navy-600" size="sm"/><span className="text-sm text-navy-700 flex-1">{s}</span><span className="badge-success">Completed</span></div>)}</div></SectionCard></div>;
}

export function VPClassManagement() {
  const [assignments, setAssignments] = useState(getClassAssignments());
  const teachers = SYSTEM_TEACHERS;
  const [studentClass, setStudentClass] = useState(CLASSES[0]?.id || '');
  const [notice, setNotice] = useState('');
  const saveAssignment = (classId:string, sponsorId:string) => {
    const teacher=teachers.find(t=>t.id===sponsorId); if(!teacher)return;
    const next=assignments.map(a=>a.classId===classId?{...a,sponsorId,sponsorName:teacher.name,updatedAt:new Date().toISOString().slice(0,10)}:a);
    setAssignments(next); setClassAssignments(next); setNotice('Class sponsor updated successfully.');
  };
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Class & Student Management" subtitle="The Vice Principal controls class sponsors and keeps teacher class access simple and up to date."/>
    {notice&&<div className="p-3 rounded-lg bg-success-50 border border-success-200 text-sm text-success-700">{notice}</div>}
    <SectionCard title="Assign Class Sponsor"><div className="space-y-3">{CLASSES.map(c=>{const a=assignments.find(x=>x.classId===c.id);return <div key={c.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 rounded-lg border border-navy-100"><div><p className="text-sm font-semibold text-navy-800">{c.grade}{c.section}</p><p className="text-xs text-navy-400">{c.studentCount} students</p></div><div className="md:col-span-2"><select className="input" value={a?.sponsorId||''} onChange={e=>saveAssignment(c.id,e.target.value)}>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><span className="badge-info">Sponsor controls attendance</span></div>})}</div></SectionCard>
    <SectionCard title="View Students by Class"><div className="max-w-md"><label className="label">Class</label><select className="input" value={studentClass} onChange={e=>setStudentClass(e.target.value)}>{CLASSES.map(c=><option key={c.id} value={c.id}>{c.grade}{c.section}</option>)}</select></div><div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{getStudentsForClass(studentClass).map(s=><div key={s.id} className="p-3 rounded-lg border border-navy-100 flex items-center gap-3"><Avatar name={s.name} color={s.photoColor} size="sm"/><div><p className="text-sm font-medium text-navy-800">{s.name}</p><p className="text-xs text-navy-400">{s.rollNo}</p></div></div>)}</div></SectionCard>
    <SectionCard title="Assign Subjects to Teachers"><div className="space-y-3">{SUBJECTS.map(sub=>{const a=getSubjectAssignments().find(x=>x.subjectId===sub.id);return <div key={sub.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 rounded-lg border border-navy-100"><div><p className="text-sm font-semibold text-navy-800">{sub.name}</p><p className="text-xs text-navy-400">{sub.className}</p></div><div className="md:col-span-2"><select className="input" value={a?.teacherId||'u6'} onChange={e=>{const t=teachers.find(x=>x.id===e.target.value);if(!t)return;const next=getSubjectAssignments().map(x=>x.subjectId===sub.id?{...x,teacherId:t.id,teacherName:t.name,updatedAt:new Date().toISOString().slice(0,10)}:x);setSubjectAssignments(next);setNotice('Subject teacher updated successfully.');}}>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><span className="badge-info">Teacher sees it immediately</span></div>})}</div></SectionCard></div>;
}

const SYSTEM_TEACHERS = [{id:'u6',name:'Mr. Peter Wleh'},{id:'su13',name:'Ms. Emily Brown'}];

export function VPStudentAffairs() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Affairs" subtitle="Overview of student affairs and discipline." />
      <SectionCard title="Active Discipline Cases">
        <div className="space-y-3">
          {DISCIPLINE_CASES.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className={`p-2 rounded-lg ${
                c.severity === 'major' ? 'bg-error-100 text-error-700' :
                c.severity === 'moderate' ? 'bg-warning-100 text-warning-700' :
                'bg-navy-100 text-navy-700'
              }`}><Gavel className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{c.studentName} — {c.incident}</p>
                <p className="text-xs text-navy-400">{c.class} — Reported by {c.reportedBy}</p>
              </div>
              <span className={
                c.status === 'open' ? 'badge-error' :
                c.status === 'under_review' ? 'badge-warning' :
                c.status === 'resolved' ? 'badge-success' : 'badge-info'
              }>{c.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function VPNotices() {
  const [notices, setNotices] = useState(ANNOUNCEMENTS);
  const [show, setShow] = useState(false); const [title,setTitle]=useState(''); const [body,setBody]=useState('');
  const create=()=>{if(!title||!body)return;setNotices([{id:`n-${Date.now()}`,title,body,author:'Mrs. Grace Browman',authorRole:'vice_principal',date:new Date().toISOString().slice(0,10),audience:'Students & Staff',priority:'important'},...notices]);setTitle('');setBody('');setShow(false);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Operational Notices" subtitle="Create, review, and manage school operational notices." action={<button className="btn-primary" onClick={()=>setShow(true)}><Plus className="w-4 h-4"/> New Notice</button>}/><SectionCard title="All Notices"><div className="space-y-4">{notices.map(an=><div key={an.id} className="p-4 rounded-lg border border-navy-100"><div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-navy-800">{an.title}</h3><span className={an.priority==='urgent'?'badge-error':an.priority==='important'?'badge-warning':'badge-info'}>{an.priority}</span></div><p className="text-sm text-navy-600">{an.body}</p><p className="text-xs text-navy-400 mt-2">{an.date} — {an.author} — {an.audience}</p></div>)}</div></SectionCard><Modal open={show} onClose={()=>setShow(false)} title="Create Operational Notice"><div className="space-y-4"><div><label className="label">Title</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notice title"/></div><div><label className="label">Message</label><textarea className="input" rows={5} value={body} onChange={e=>setBody(e.target.value)} placeholder="Write the notice..."/></div><div className="flex justify-end"><button onClick={create} className="btn-primary"><Send className="w-4 h-4"/> Publish Notice</button></div></div></Modal></div>;
}

export function VPReports() {
  const reports=[
    {name:'Daily Attendance Report',desc:"Today's attendance summary",icon:CalendarCheck,file:'vp-daily-attendance.csv'},
    {name:'Staff Activity Report',desc:'Staff logins and submissions',icon:Users,file:'vp-staff-activity.csv'},
    {name:'Discipline Summary',desc:'Incidents and actions',icon:Gavel,file:'vp-discipline-summary.csv'},
    {name:'Class Operations',desc:'Class session status',icon:Activity,file:'vp-class-operations.csv'},
    {name:'Issue Log',desc:'Issues requiring attention',icon:AlertCircle,file:'vp-issue-log.csv'},
    {name:'Weekly Summary',desc:'Weekly operations overview',icon:FileBarChart,file:'vp-weekly-summary.csv'},
  ];
  const generate=async(name:string,file:string)=>{let rows=`Report,Value\n"${name}","Generated ${new Date().toLocaleString()}"\n`; if(name==='Daily Attendance Report') rows += getAttendance().filter(a=>a.date===new Date().toISOString().slice(0,10)).map(a=>`"${a.studentName}","${a.className}","${a.session}","${a.status}"`).join('\n'); else rows += CLASSES.map(c=>`"${c.name}","Sponsor: ${c.teacherName}","Students: ${c.studentCount}"`).join('\n'); await saveGeneratedFile(rows,file);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Administrative Reports" subtitle="Generate a document and choose where to save it."/><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{reports.map(r=><div key={r.name} className="card-hover p-5"><div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><r.icon className="w-5 h-5"/></div><h3 className="font-semibold text-navy-800">{r.name}</h3><p className="text-sm text-navy-400 mt-1">{r.desc}</p><button className="btn-secondary text-sm mt-4 w-full" onClick={()=>generate(r.name,r.file)}><Download className="w-4 h-4"/> Generate</button></div>)}</div></div>;
}

export function DeanDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const openCases = DISCIPLINE_CASES.filter((c) => c.status === 'open' || c.status === 'under_review');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dean of Students" subtitle="Student discipline, behavior, and affairs." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Cases" value={openCases.length} icon={<Gavel className="w-5 h-5" />} color="warning" />
        <StatCard label="Resolved This Week" value="2" icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Attendance Concerns" value="3" icon={<CalendarX className="w-5 h-5" />} color="error" />
        <StatCard label="Follow-ups Due" value="2" icon={<ListChecks className="w-5 h-5" />} color="navy" />
      </div>
      <SectionCard title="Active Discipline Cases" action={<button onClick={() => onNavigate('discipline')} className="btn-ghost text-sm">View All</button>}>
        <div className="space-y-3">
          {openCases.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className={`p-2 rounded-lg ${
                c.severity === 'major' ? 'bg-error-100 text-error-700' :
                c.severity === 'moderate' ? 'bg-warning-100 text-warning-700' :
                'bg-navy-100 text-navy-700'
              }`}><Gavel className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{c.studentName} — {c.incident}</p>
                <p className="text-xs text-navy-400">{c.class} — {c.date}</p>
              </div>
              <span className={
                c.status === 'open' ? 'badge-error' :
                c.status === 'under_review' ? 'badge-warning' : 'badge-info'
              }>{c.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function DeanDiscipline() {
  const [cases, setCases] = useState(getDisciplineCases());
  const [studentId,setStudentId]=useState(STUDENTS[0]?.id||''); const [incident,setIncident]=useState(''); const [severity,setSeverity]=useState<'minor'|'moderate'|'major'>('minor'); const [status,setStatus]=useState<'open'|'under_review'|'resolved'|'closed'>('open'); const [action,setAction]=useState(''); const [showForm,setShowForm]=useState(false);
  const record=()=>{const st=STUDENTS.find(s=>s.id===studentId);if(!st||!incident)return;const next=[{id:`dc-${Date.now()}`,studentName:st.name,studentId:st.id,class:`${st.grade}${st.class.replace(/^\d+/,'')}`,incident,date:new Date().toISOString().slice(0,10),severity,status,action:action||'Pending action',reportedBy:'Mr. Samuel Doe'},...cases];setCases(next);setDisciplineCases(next);setIncident('');setAction('');setShowForm(false);};
  const resolve=(id:string)=>{const next=cases.map(c=>c.id===id?{...c,status:'resolved' as const}:c);setCases(next);setDisciplineCases(next);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Discipline Cases" subtitle="Record a case first, then review and manage the saved discipline record." action={<button className="btn-primary" onClick={()=>setShowForm(true)}><Plus className="w-4 h-4"/> Record Discipline Case</button>}/><SectionCard title={`Recorded Cases (${cases.length})`}><table className="table-base"><thead><tr><th>Student</th><th>Class</th><th>Incident</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead><tbody>{cases.map(c=><tr key={c.id}><td className="font-medium text-navy-800">{c.studentName}</td><td>{c.class}</td><td>{c.incident}</td><td><span className={c.severity==='major'?'badge-error':c.severity==='moderate'?'badge-warning':'badge-info'}>{c.severity}</span></td><td><span className={c.status==='open'?'badge-error':c.status==='under_review'?'badge-warning':c.status==='resolved'?'badge-success':'badge-info'}>{c.status.replace('_',' ')}</span></td><td>{(c.status==='open'||c.status==='under_review')&&<button onClick={()=>resolve(c.id)} className="btn-secondary text-xs py-1 px-2">Resolve</button>}</td></tr>)}</tbody></table></SectionCard><Modal open={showForm} onClose={()=>setShowForm(false)} title="Record Discipline Case" size="lg"><div className="space-y-4"><div><label className="label">Student</label><select className="input" value={studentId} onChange={e=>setStudentId(e.target.value)}>{STUDENTS.filter(s=>s.status==='active').map(s=><option key={s.id} value={s.id}>{s.name} — {s.grade}{s.class.replace(/^\d+/,'')}</option>)}</select></div><div><label className="label">Incident / Case</label><textarea className="input" rows={3} value={incident} onChange={e=>setIncident(e.target.value)} placeholder="Describe the incident..."/></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="label">Severity</label><select className="input" value={severity} onChange={e=>setSeverity(e.target.value as any)}><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="major">Major</option></select></div><div><label className="label">Status</label><select className="input" value={status} onChange={e=>setStatus(e.target.value as any)}><option value="open">Open</option><option value="under_review">Under Review</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div><div><label className="label">Action</label><input className="input" value={action} onChange={e=>setAction(e.target.value)} placeholder="Warning, counseling..."/></div></div><div className="flex justify-end"><button className="btn-primary" onClick={record}><Save className="w-4 h-4"/> Save Case</button></div></div></Modal></div>;
}

export function DeanAttendance() {
  const concerns = ATTENDANCE.filter((a) => a.status === 'absent' || a.status === 'late');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance Concerns" subtitle="Students with attendance issues." />
      <SectionCard title="Attendance Concerns">
        <table className="table-base">
          <thead><tr><th>Student</th><th>Class</th><th>Date</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {concerns.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-navy-800">{a.studentName}</td>
                <td>{a.className}</td>
                <td>{a.date}</td>
                <td><span className={a.status === 'absent' ? 'badge-error' : 'badge-warning'}>{a.status}</span></td>
                <td className="text-navy-400">{a.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function DeanActivities() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Activities" subtitle="School activities and events." />
      <SectionCard title="Upcoming Activities">
        <div className="space-y-3">
          {[
            { name: 'Inter-Class Debate', date: '2026-09-25', time: '2:00 PM', organizer: 'Mr. Peter Wleh' },
            { name: 'Sports Day', date: '2026-09-28', time: '9:00 AM', organizer: 'Mr. Samuel Doe' },
            { name: 'Science Fair', date: '2026-10-02', time: '10:00 AM', organizer: 'Ms. Emily Brown' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-accent-100 text-accent-700"><Activity className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{a.name}</p>
                <p className="text-xs text-navy-400">{a.date} at {a.time} — Organized by {a.organizer}</p>
              </div>
              <span className="badge-info">Scheduled</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function DeanFollowUps() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Follow-up Actions" subtitle="Track required follow-up actions." />
      <SectionCard title="Pending Follow-ups">
        <div className="space-y-3">
          {[
            { student: 'Augustine T. Kollie', action: 'Check-in after verbal warning', due: '2026-09-23', status: 'pending' },
            { student: 'Mohammed S. Kromah', action: 'Investigation meeting with parents', due: '2026-09-24', status: 'pending' },
            { student: 'Daniel S. Tuah', action: 'Verify improved punctuality', due: '2026-09-25', status: 'completed' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><ListChecks className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{f.student}</p>
                <p className="text-xs text-navy-400">{f.action} — Due: {f.due}</p>
              </div>
              <span className={f.status === 'pending' ? 'badge-warning' : 'badge-success'}>{f.status}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
