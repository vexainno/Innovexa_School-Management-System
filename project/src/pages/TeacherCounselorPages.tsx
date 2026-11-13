import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users, BookOpen, CalendarCheck, FileText, ClipboardList, ClipboardEdit,
  Library, MessageSquare, GraduationCap, CheckCircle2, AlertCircle,
  Clock, Save, Send, Plus, Upload, FileSpreadsheet, Check, UsersRound,
  CalendarDays, Pencil, X, CalendarClock, ShieldCheck, UserRoundPlus,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Avatar, ProgressBar, Modal } from '@/components/ui';
import {
  CLASSES, SUBJECTS, STUDENTS, ASSESSMENTS, GRADES, ATTENDANCE, ANNOUNCEMENTS,
} from '@/data/mockData';
import type { Assessment, AttendanceRecord } from '@/types';
import { getTeacherClasses, getTeacherSubjects, getSubjectAssignments, getStudentsForClass, getAttendance, setAttendance, getGradebooks, setGradebooks, type WorkflowAttendance, type WorkflowGradebook } from '@/data/workflow';
import {
  getCounselorCases, createCounselorCase, updateCounselorCase,
  getStudentRiskRecords, upsertStudentRisk,
  getCounselingInterventions, createCounselingIntervention, updateCounselingIntervention,
  getCounselorAvailability, saveCounselorAvailability,
  getCounselingAppointments, scheduleCounselingAppointment, denyCounselingAppointment,
  type CounselorSupportCase, type SupportCaseCategory, type SupportCaseStatus,
  type StudentRiskLevel, type InterventionStatus, type CounselorAvailabilitySlot,
} from '@/data/counselorWorkflow';

// Return the classes a teacher is allowed to work with in the frontend demo.
// A class sponsor can see the class, and a subject teacher can see the class
// associated with their assigned subject. Backend authorization must enforce this later.
function getClassesVisibleToTeacher(teacherId: string) {
  const sponsoredClasses = getTeacherClasses(teacherId);
  const assignedSubjectIds = getSubjectAssignments()
    .filter((assignment) => assignment.teacherId === teacherId)
    .map((assignment) => assignment.subjectId);
  const subjectClassIds = SUBJECTS
    .filter((subject) => assignedSubjectIds.includes(subject.id))
    .map((subject) => subject.classId);
  const visibleClassIds = new Set([
    ...sponsoredClasses.map((classInfo) => classInfo.id),
    ...subjectClassIds,
  ]);

  return CLASSES.filter((classInfo) => visibleClassIds.has(classInfo.id));
}

// --- Teacher Dashboard ---
export function TeacherDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const teacherId = user?.id ?? '';
  const myClasses = teacherId ? getClassesVisibleToTeacher(teacherId) : [];
  const mySubjects = teacherId ? getTeacherSubjects(teacherId) : [];
  const classIds = new Set(myClasses.map((classInfo) => classInfo.id));
  const subjectIds = new Set(mySubjects.map((subject) => subject.id));
  const studentIds = new Set(
    myClasses.flatMap((classInfo) =>
      getStudentsForClass(classInfo.id).map((student) => student.id)
    )
  );
  const draftAssessments = ASSESSMENTS.filter(
    (assessment) =>
      assessment.status === 'draft' &&
      classIds.has(assessment.classId) &&
      subjectIds.has(assessment.subjectId)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Your assigned classes, subjects, students, and teaching activities."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Classes"
          value={myClasses.length}
          icon={<Users className="w-5 h-5" />}
          onClick={() => onNavigate('classes')}
        />
        <StatCard
          label="My Subjects"
          value={mySubjects.length}
          icon={<BookOpen className="w-5 h-5" />}
          color="accent"
          onClick={() => onNavigate('subjects')}
        />
        <StatCard
          label="My Students"
          value={studentIds.size}
          icon={<Users className="w-5 h-5" />}
          color="success"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          label="Draft Assessments"
          value={draftAssessments.length}
          icon={<ClipboardList className="w-5 h-5" />}
          color="warning"
          onClick={() => onNavigate('assessments')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="My Classes"
          action={
            <button onClick={() => onNavigate('classes')} className="btn-ghost text-sm">
              View All
            </button>
          }
        >
          {myClasses.length > 0 ? (
            <div className="space-y-3">
              {myClasses.slice(0, 4).map((classInfo) => {
                const classStudentCount = getStudentsForClass(classInfo.id).length;
                return (
                  <button
                    key={classInfo.id}
                    type="button"
                    onClick={() => onNavigate('classes')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors text-left"
                  >
                    <span className="p-2 rounded-lg bg-navy-100 text-navy-700">
                      <Users className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-navy-800">
                        {classInfo.name}
                      </span>
                      <span className="block text-xs text-navy-400">
                        {classStudentCount} students · {classInfo.room}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No classes assigned"
              message="Your assigned classes will appear here when the school updates your teaching assignments."
            />
          )}
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="space-y-2">
            <button onClick={() => onNavigate('attendance')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
              <span className="p-2 rounded-lg bg-navy-100 text-navy-700"><CalendarCheck className="w-4 h-4" /></span>
              <span className="text-sm font-medium text-navy-700">Take Attendance</span>
            </button>
            <button onClick={() => onNavigate('gradebook')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
              <span className="p-2 rounded-lg bg-navy-100 text-navy-700"><ClipboardEdit className="w-4 h-4" /></span>
              <span className="text-sm font-medium text-navy-700">Open Gradebook</span>
            </button>
            <button onClick={() => onNavigate('assignments')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
              <span className="p-2 rounded-lg bg-navy-100 text-navy-700"><FileText className="w-4 h-4" /></span>
              <span className="text-sm font-medium text-navy-700">Create Assignment</span>
            </button>
            <button onClick={() => onNavigate('resources')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left">
              <span className="p-2 rounded-lg bg-navy-100 text-navy-700"><Library className="w-4 h-4" /></span>
              <span className="text-sm font-medium text-navy-700">Upload Resources</span>
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function TeacherClasses() {
  const classes = getTeacherClasses('u6');
  return <div className="space-y-6 animate-fade-in"><PageHeader title="My Classes" subtitle="Only classes currently assigned to you by the Vice Principal." /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{classes.map(c=><div key={c.id} className="card-hover p-5"><div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><Users className="w-5 h-5" /></div><h3 className="font-semibold text-navy-800">{c.grade}{c.section}</h3><p className="text-sm text-navy-400 mt-1">{c.studentCount} students — {c.room}</p><div className="mt-3"><ProgressBar value={c.studentCount} max={35}/></div></div>)}</div></div>;
}

export function TeacherSubjects() {
  const subjects = getTeacherSubjects('u6');
  return <div className="space-y-6 animate-fade-in"><PageHeader title="My Subjects" subtitle="Subjects assigned to you by the school." /><SectionCard title="Subjects"><table className="table-base"><thead><tr><th>Subject</th><th>Code</th><th>Class</th></tr></thead><tbody>{subjects.map(s=><tr key={s.id}><td className="font-medium text-navy-800">{s.name}</td><td>{s.code}</td><td>{s.className}</td></tr>)}</tbody></table></SectionCard></div>;
}

export function TeacherStudents() {
  const subjects = getTeacherSubjects('u6');
  const classIds = Array.from(new Set(subjects.map(s => s.classId)));
  const classes = getTeacherClasses('u6').filter(c => classIds.includes(c.id) || getTeacherClasses('u6').some(x => x.id === c.id));
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const students = selectedClass ? getStudentsForClass(selectedClass) : [];
  return <div className="space-y-6 animate-fade-in"><PageHeader title="My Students" subtitle="Select a class to quickly view every student in the classes and subjects you teach." /><div className="max-w-md"><label className="label">Class / Section</label><select className="input" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.grade}{c.section} — {c.name}</option>)}</select></div><SectionCard title={`Students (${students.length})`}><table className="table-base"><thead><tr><th>Student</th><th>Grade</th><th>Class</th><th>Roll No</th><th>Guardian</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td><div className="flex items-center gap-2"><Avatar name={s.name} color={s.photoColor} size="sm"/><span className="font-medium text-navy-800">{s.name}</span></div></td><td>{s.grade}</td><td>{s.class}</td><td>{s.rollNo}</td><td>{s.guardianName}</td></tr>)}</tbody></table></SectionCard></div>;
}

export function TeacherAttendance() {
  const classes = getTeacherClasses('u6');
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const [session, setSession] = useState<'morning'|'afternoon'|'evening'>('morning');
  const [records, setRecords] = useState<WorkflowAttendance[]>(getAttendance());
  const students = selectedClass ? getStudentsForClass(selectedClass) : [];
  const today = new Date().toISOString().slice(0,10);
  const existing = records.filter(r => r.classId === selectedClass && r.date === today && r.session === session);
  const [status, setStatus] = useState<Record<string, WorkflowAttendance['status']>>(() => Object.fromEntries(existing.map(r=>[r.studentId,r.status])));
  const setAll = (value: WorkflowAttendance['status']) => setStatus(Object.fromEntries(students.map(s=>[s.id,value])));
  const saveNow = () => {
    const assignment = classes.find(c=>c.id===selectedClass);
    if (!assignment) return;
    const kept = records.filter(r => !(r.classId===selectedClass && r.date===today && r.session===session));
    const next = students.map(s => ({ id:`att-${today}-${selectedClass}-${session}-${s.id}`, studentId:s.id, studentName:s.name, classId:selectedClass, className:`${assignment.grade}${assignment.section}`, date:today, status:status[s.id] || 'present', session, recordedBy:'u6', sponsorId:'u6', sponsorName:'Mr. Peter Wleh', submittedAt:new Date().toISOString() } as WorkflowAttendance));
    const all=[...kept,...next]; setRecords(all); setAttendance(all); window.alert('Attendance saved and sent to the Principal and Vice Principal.');
  };
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Attendance" subtitle="The assigned class sponsor is the only teacher allowed to submit attendance for that class and session." action={<button onClick={saveNow} className="btn-primary"><Save className="w-4 h-4"/> Save Attendance</button>}/><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="label">Class</label><select className="input" value={selectedClass} onChange={e=>{setSelectedClass(e.target.value);setStatus({});}}>{classes.map(c=><option key={c.id} value={c.id}>{c.grade}{c.section} — {c.name}</option>)}</select></div><div><label className="label">Session</label><select className="input" value={session} onChange={e=>{setSession(e.target.value as any);setStatus({});}}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></div></div><SectionCard title={`${classes.find(c=>c.id===selectedClass)?.grade}${classes.find(c=>c.id===selectedClass)?.section} — ${session} — ${today}`} action={<div className="flex gap-2"><button className="btn-secondary text-xs" onClick={()=>setAll('present')}>Mark All Present</button><button className="btn-secondary text-xs" onClick={()=>setAll('absent')}>Mark All Absent</button></div>}><div className="space-y-2">{students.map(s=>{const v=status[s.id]||'present';return <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100"><Avatar name={s.name} color={s.photoColor} size="sm"/><span className="text-sm font-medium text-navy-800 flex-1">{s.name}</span><div className="flex flex-wrap gap-1"><button onClick={()=>setStatus(p=>({...p,[s.id]:'present'}))} className={v==='present'?'badge-success':'btn-secondary text-xs'}>Present</button><button onClick={()=>setStatus(p=>({...p,[s.id]:'absent'}))} className={v==='absent'?'badge-error':'btn-secondary text-xs'}>Absent</button><button onClick={()=>setStatus(p=>({...p,[s.id]:'excused'}))} className={v==='excused'?'badge-info':'btn-secondary text-xs'}>Excuse</button><button onClick={()=>setStatus(p=>({...p,[s.id]:'late'}))} className={v==='late'?'badge-warning':'btn-secondary text-xs'}>Late</button></div></div>})}</div></SectionCard></div>;
}

export function TeacherAssignments() {
  const [showCreate, setShowCreate] = useState(false);
  const [assessments, setAssessments] = useState(ASSESSMENTS);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Assignments" subtitle="Create and manage assignments." action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Assignment</button>} />
      <SectionCard title="My Assignments">
        <table className="table-base">
          <thead><tr><th>Title</th><th>Type</th><th>Subject</th><th>Class</th><th>Date</th><th>Total Marks</th><th>Status</th></tr></thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-navy-800">{a.title}</td>
                <td><span className="badge-info">{a.type}</span></td>
                <td>{a.subjectName}</td><td>{a.className}</td><td>{a.date}</td><td>{a.totalMarks}</td>
                <td><span className={a.status === 'graded' ? 'badge-success' : a.status === 'published' ? 'badge-info' : 'badge-warning'}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
      {showCreate && <CreateAssessmentModal onClose={() => setShowCreate(false)} onCreate={(a) => { setAssessments((prev) => [a, ...prev]); setShowCreate(false); }} />}
    </div>
  );
}

function CreateAssessmentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (a: Assessment) => void }) {
  const [form, setForm] = useState({ title: '', type: 'assignment' as Assessment['type'], subjectId: 'sub1', classId: 'c5', totalMarks: '20', date: '2026-09-21' });
  const subject = SUBJECTS.find((s) => s.id === form.subjectId);
  const cls = CLASSES.find((c) => c.id === form.classId);
  return (
    <Modal open={true} onClose={onClose} title="Create Assignment">
      <div className="space-y-4">
        <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Assessment['type'] })}>
              {['assignment', 'quiz', 'test', 'participation', 'midterm', 'final'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Total Marks</label><input type="number" className="input" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Subject</label>
            <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.className}</option>)}
            </select>
          </div>
          <div><label className="label">Class</label>
            <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => {
            if (!form.title.trim()) return;
            onCreate({
              id: `a${Date.now()}`, title: form.title, type: form.type,
              subjectId: form.subjectId, subjectName: subject?.name || '', classId: form.classId, className: cls?.name || '',
              date: form.date, totalMarks: parseInt(form.totalMarks) || 20, status: 'draft',
            });
          }} className="btn-primary">Create</button>
        </div>
      </div>
    </Modal>
  );
}

export function TeacherAssessments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Assessments" subtitle="All assessment components." />
      <SectionCard title="Assessment Components">
        <table className="table-base">
          <thead><tr><th>Title</th><th>Type</th><th>Subject</th><th>Class</th><th>Marks</th><th>Status</th></tr></thead>
          <tbody>
            {ASSESSMENTS.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-navy-800">{a.title}</td>
                <td><span className="badge-info">{a.type}</span></td>
                <td>{a.subjectName}</td><td>{a.className}</td><td>{a.totalMarks}</td>
                <td><span className={a.status === 'graded' ? 'badge-success' : a.status === 'published' ? 'badge-info' : 'badge-warning'}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function TeacherGradebook() {
  const classes = getTeacherClasses('u6');
  const subjects = getTeacherSubjects('u6');
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const classSubjects = subjects.filter(s=>s.classId===selectedClass);
  const [selectedSubject, setSelectedSubject] = useState(classSubjects[0]?.id || '');
  const [session, setSession] = useState<'morning'|'afternoon'|'evening'>('morning');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submit = async () => {
    if (!file || !selectedClass || !selectedSubject) return;
    const cls=classes.find(c=>c.id===selectedClass); const sub=subjects.find(s=>s.id===selectedSubject); if(!cls||!sub) return;
    const current=getGradebooks();
    const fileDataUrl=file.size <= 2_500_000 ? await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file);}) : undefined;
    const submission: WorkflowGradebook={id:`gs-${Date.now()}`,teacherName:'Mr. Peter Wleh',teacherId:'u6',subjectName:sub.name,subjectId:sub.id,className:`${cls.grade}${cls.section}`,classId:cls.id,term:'First Term 2026/2027',submittedDate:new Date().toISOString().slice(0,10),status:'submitted',studentCount:getStudentsForClass(cls.id).length,session,fileName:file.name,fileSize:file.size,fileType:file.type || 'Excel workbook',fileDataUrl};
    setGradebooks([submission,...current]); setSubmitted(true); setFile(null);
  };
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Gradebook Submission" subtitle="Select the class, subject, session, then upload the prepared Excel gradebook. It is sent directly to the Principal for review."/><SectionCard title="Submission Details"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="label">Class</label><select className="input" value={selectedClass} onChange={e=>{setSelectedClass(e.target.value);setSelectedSubject('');}}>{classes.map(c=><option key={c.id} value={c.id}>{c.grade}{c.section}</option>)}</select></div><div><label className="label">Subject</label><select className="input" value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}>{classSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="label">Class Session</label><select className="input" value={session} onChange={e=>setSession(e.target.value as any)}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></div></div><div className="mt-5"><label className="label">Gradebook file</label><label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-navy-200 rounded-xl hover:bg-navy-50 cursor-pointer"><Upload className="w-7 h-7 text-navy-500"/><span className="text-sm font-medium text-navy-700">Choose Excel gradebook</span><span className="text-xs text-navy-400">.xlsx, .xls, .csv — prepared gradebook from your computer</span><input type="file" className="hidden" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{file&&<div className="mt-3 p-3 rounded-lg bg-navy-50 flex items-center gap-3"><FileSpreadsheet className="w-5 h-5 text-navy-600"/><div className="flex-1"><p className="text-sm font-medium text-navy-800">{file.name}</p><p className="text-xs text-navy-400">{Math.round(file.size/1024)} KB</p></div><button onClick={()=>setFile(null)} className="text-navy-400 hover:text-error-600">×</button></div>}</div><div className="flex justify-end mt-5"><button onClick={submit} disabled={!file||!selectedSubject} className="btn-primary disabled:opacity-50"><Send className="w-4 h-4"/> Submit Grades</button></div>{submitted&&<div className="mt-4 p-3 rounded-lg bg-success-50 border border-success-200 text-sm text-success-700"><CheckCircle2 className="inline w-4 h-4 mr-2"/> Gradebook submitted successfully. The Principal can now view, approve, or reject it.</div>}</SectionCard></div>;
}

export function TeacherResources() {
  const [showUpload, setShowUpload] = useState(false);
  const [resources, setResources] = useState([
    { name: 'Algebra Notes — Chapter 1', subject: 'Mathematics', type: 'PDF', date: '2026-09-10' },
    { name: 'Physics Lab Manual', subject: 'Physics', type: 'PDF', date: '2026-09-08' },
    { name: 'Equations Worksheet', subject: 'Mathematics', type: 'DOC', date: '2026-09-12' },
    { name: "Newton's Laws Slides", subject: 'Physics', type: 'PPT', date: '2026-09-07' },
  ]);
  const [form, setForm] = useState({ name: '', subject: 'Mathematics', type: 'PDF' });
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Learning Resources" subtitle="Upload and share learning materials." action={<button onClick={() => setShowUpload(true)} className="btn-primary"><Plus className="w-4 h-4" /> Upload Resource</button>} />
      <SectionCard title="My Resources">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r, i) => (
            <div key={i} className="card-hover p-5">
              <div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><FileText className="w-5 h-5" /></div>
              <h3 className="font-semibold text-navy-800 text-sm">{r.name}</h3>
              <p className="text-xs text-navy-400 mt-1">{r.subject} — {r.type} — {r.date}</p>
            </div>
          ))}
        </div>
      </SectionCard>
      {showUpload && (
        <Modal open={true} onClose={() => setShowUpload(false)} title="Upload Resource">
          <div className="space-y-4">
            <div><label className="label">Resource Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chapter 5 Notes" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Subject</label>
                <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">File Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['PDF', 'DOC', 'PPT', 'IMG', 'VIDEO'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 border-2 border-dashed border-navy-200 rounded-lg text-center">
              <FileText className="w-8 h-8 text-navy-400 mx-auto mb-2" />
              <p className="text-sm text-navy-500">Drag and drop a file here, or click to browse</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => {
                if (!form.name.trim()) return;
                setResources((prev) => [{ name: form.name, subject: form.subject, type: form.type, date: new Date().toISOString().split('T')[0] }, ...prev]);
                setShowUpload(false);
                setForm({ name: '', subject: 'Mathematics', type: 'PDF' });
              }} className="btn-primary">Upload</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function TeacherMessages() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Messages & Announcements" subtitle="Communicate with students and parents." />
      <SectionCard title="Recent Messages">
        <div className="space-y-3">
          {ANNOUNCEMENTS.map((an) => (
            <div key={an.id} className="p-4 rounded-lg border border-navy-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-navy-800 text-sm">{an.title}</h3>
                <span className="text-xs text-navy-400">{an.date}</span>
              </div>
              <p className="text-sm text-navy-600">{an.body}</p>
              <p className="text-xs text-navy-400 mt-2">— {an.author}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// --- Counselor workspace ---
const CASE_CATEGORY_LABELS: Record<SupportCaseCategory, string> = {
  academic: 'Academic',
  behavioral: 'Behavioral',
  social: 'Social',
  family: 'Family',
  other: 'Other',
};
const CASE_STATUS_LABELS: Record<SupportCaseStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  follow_up: 'Follow-up',
  closed: 'Closed',
};
const RISK_LABELS: Record<StudentRiskLevel, string> = {
  at_risk: 'At Risk',
  moderate: 'Moderate',
  fine: 'Fine',
};
const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  ongoing: 'Ongoing',
  improving: 'Improving',
  done: 'Done',
  denied: 'Denied',
};

function statusBadge(status: string) {
  if (['open', 'at_risk', 'denied'].includes(status)) return 'badge-error';
  if (['in_progress', 'ongoing', 'moderate'].includes(status)) return 'badge-warning';
  if (['done', 'fine', 'improving', 'scheduled'].includes(status)) return 'badge-success';
  return 'badge-info';
}

function CounselorFormField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="label">{label}</label>{children}</div>;
}

export function CounselorDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const cases = getCounselorCases();
  const risks = getStudentRiskRecords();
  const appointments = getCounselingAppointments();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const sessionsThisWeek = appointments.filter((item) => {
    if (item.status !== 'scheduled' || !item.scheduledDate) return false;
    const date = new Date(`${item.scheduledDate}T12:00:00`);
    return date >= weekStart && date <= weekEnd;
  }).length;
  const followUpsDue = appointments.filter((item) => item.status === 'pending').length;
  const activeCases = cases.filter((item) => item.status !== 'closed');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Guidance Counselor Dashboard" subtitle="Manage student support, counseling appointments, interventions, and follow-ups." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Cases" value={activeCases.length} icon={<AlertCircle className="w-5 h-5" />} color="warning" onClick={() => onNavigate('cases')} />
        <StatCard label="At-Risk Students" value={risks.filter((item) => item.level === 'at_risk').length} icon={<AlertCircle className="w-5 h-5" />} color="error" onClick={() => onNavigate('at-risk')} />
        <StatCard label="Sessions This Week" value={sessionsThisWeek} icon={<CheckCircle2 className="w-5 h-5" />} color="success" onClick={() => onNavigate('follow-ups')} />
        <StatCard label="Follow-ups Due" value={followUpsDue} icon={<Clock className="w-5 h-5" />} color="navy" onClick={() => onNavigate('follow-ups')} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SectionCard title="Active Support Cases" action={<button onClick={() => onNavigate('cases')} className="btn-ghost text-sm">View All</button>}>
            <div className="space-y-3">
              {activeCases.slice(0, 5).map((item) => (
                <button key={item.id} onClick={() => onNavigate('cases')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-navy-100 hover:bg-navy-50 text-left">
                  <span className="p-2 rounded-lg bg-navy-100 text-navy-700"><AlertCircle className="w-4 h-4" /></span>
                  <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-navy-800">{item.studentName}</span><span className="block text-xs text-navy-400">{CASE_CATEGORY_LABELS[item.category]} · Opened {item.dateOpened}</span></span>
                  <span className={statusBadge(item.status)}>{CASE_STATUS_LABELS[item.status]}</span>
                </button>
              ))}
              {activeCases.length === 0 && <EmptyState icon={<CheckCircle2 className="w-6 h-6" />} title="No active cases" message="New support cases will appear here." />}
            </div>
          </SectionCard>
        </div>
        <SectionCard title="Counselor Workspace">
          <div className="space-y-2">
            {[
              ['cases', 'Manage Support Cases', <FileText className="w-4 h-4" />],
              ['at-risk', 'Review Student Risk', <AlertCircle className="w-4 h-4" />],
              ['interventions', 'Intervention Records', <ClipboardList className="w-4 h-4" />],
              ['follow-ups', 'Appointments & Follow-ups', <CalendarClock className="w-4 h-4" />],
              ['availability', 'My Availability', <CalendarDays className="w-4 h-4" />],
            ].map(([page, label, icon]) => (
              <button key={String(page)} onClick={() => onNavigate(String(page))} className="w-full flex items-center gap-3 rounded-lg p-3 text-left hover:bg-navy-50 text-sm font-medium text-navy-700">
                <span className="text-navy-600">{icon}</span>{label}<span className="ml-auto text-navy-400">→</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function CounselorCases() {
  const [cases, setCases] = useState<CounselorSupportCase[]>(getCounselorCases());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { studentId: '', category: 'academic' as SupportCaseCategory, status: 'open' as SupportCaseStatus, dateOpened: new Date().toISOString().slice(0, 10), lastSession: '', confidential: true, summary: '' };
  const [form, setForm] = useState(emptyForm);

  const refresh = () => setCases(getCounselorCases());
  const startEdit = (item: CounselorSupportCase) => {
    setEditingId(item.id);
    setForm({ studentId: item.studentId, category: item.category, status: item.status, dateOpened: item.dateOpened, lastSession: item.lastSession || '', confidential: item.confidential, summary: item.summary });
    setShowForm(true);
  };
  const save = () => {
    if (!form.studentId || !form.summary.trim()) return;
    if (editingId) {
      updateCounselorCase(editingId, { ...form, lastSession: form.lastSession || undefined });
    } else {
      createCounselorCase({ ...form, lastSession: form.lastSession || undefined, createdBy: 'u7' });
    }
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Support Cases" subtitle="Create, review, and update student support and counseling cases." action={<button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm((value) => !value); }} className="btn-primary"><Plus className="w-4 h-4" /> New Case</button>} />
      {showForm && <SectionCard title={editingId ? 'Edit Support Case' : 'Create Support Case'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CounselorFormField label="Student"><select className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}><option value="">Select student</option>{STUDENTS.map((student) => <option key={student.id} value={student.id}>{student.name} · Grade {student.class}</option>)}</select></CounselorFormField>
          <CounselorFormField label="Category"><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SupportCaseCategory })}>{Object.entries(CASE_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CounselorFormField>
          <CounselorFormField label="Status"><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SupportCaseStatus })}>{Object.entries(CASE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CounselorFormField>
          <CounselorFormField label="Date Opened"><input type="date" className="input" value={form.dateOpened} onChange={(e) => setForm({ ...form, dateOpened: e.target.value })} /></CounselorFormField>
          <CounselorFormField label="Last Session"><input type="date" className="input" value={form.lastSession} onChange={(e) => setForm({ ...form, lastSession: e.target.value })} /></CounselorFormField>
          <CounselorFormField label="Confidentiality"><label className="flex items-center gap-2 text-sm text-navy-700"><input type="checkbox" checked={form.confidential} onChange={(e) => setForm({ ...form, confidential: e.target.checked })} /> Mark this case confidential</label></CounselorFormField>
          <div className="md:col-span-2"><CounselorFormField label="Case summary"><textarea className="input min-h-24" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Record a concise case summary. Avoid unnecessary sensitive details." /></CounselorFormField></div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={!form.studentId || !form.summary.trim()}><Save className="w-4 h-4" /> Save Case</button></div>
      </SectionCard>}
      <SectionCard title={`All Cases (${cases.length})`}>
        <div className="overflow-x-auto"><table className="table-base"><thead><tr><th>Student</th><th>Category</th><th>Status</th><th>Opened</th><th>Last Session</th><th>Confidential</th><th>Action</th></tr></thead><tbody>
          {cases.map((item) => <tr key={item.id}><td className="font-medium text-navy-800">{item.studentName}</td><td><span className="badge-info">{CASE_CATEGORY_LABELS[item.category]}</span></td><td><span className={statusBadge(item.status)}>{CASE_STATUS_LABELS[item.status]}</span></td><td>{item.dateOpened}</td><td>{item.lastSession || '—'}</td><td>{item.confidential ? <span className="badge-error">Confidential</span> : 'Standard'}</td><td><button className="btn-secondary text-xs" onClick={() => startEdit(item)}><Pencil className="w-3 h-3" /> Edit</button></td></tr>)}
          {cases.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-navy-400">No support cases have been created.</td></tr>}
        </tbody></table></div>
      </SectionCard>
    </div>
  );
}

export function CounselorAtRisk() {
  const [records, setRecords] = useState(getStudentRiskRecords());
  const [studentId, setStudentId] = useState('');
  const [level, setLevel] = useState<StudentRiskLevel>('moderate');
  const [reason, setReason] = useState('');
  const save = () => {
    if (!studentId) return;
    upsertStudentRisk(studentId, level, reason, 'u7');
    setRecords(getStudentRiskRecords());
    setStudentId('');
    setReason('');
  };
  return <div className="space-y-6 animate-fade-in">
    <PageHeader title="At-Risk Students" subtitle="Review and update each student's support risk level." />
    <SectionCard title="Update Student Risk">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <CounselorFormField label="Student"><select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Select student</option>{STUDENTS.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></CounselorFormField>
        <CounselorFormField label="Risk Level"><select className="input" value={level} onChange={(e) => setLevel(e.target.value as StudentRiskLevel)}><option value="at_risk">At Risk</option><option value="moderate">Moderate</option><option value="fine">Fine</option></select></CounselorFormField>
        <CounselorFormField label="Reason / Review Note"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief reason or note" /></CounselorFormField>
        <button className="btn-primary" disabled={!studentId} onClick={save}><Save className="w-4 h-4" /> Save Risk Level</button>
      </div>
    </SectionCard>
    <SectionCard title={`Student Risk Register (${records.length})`}>
      <div className="overflow-x-auto"><table className="table-base"><thead><tr><th>Student</th><th>Class</th><th>Risk Level</th><th>Reason</th><th>Last Reviewed</th></tr></thead><tbody>
        {records.map((item) => <tr key={item.studentId}><td className="font-medium text-navy-800">{item.studentName}</td><td>{item.className}</td><td><span className={statusBadge(item.level)}>{RISK_LABELS[item.level]}</span></td><td>{item.reason || '—'}</td><td>{item.reviewedAt}</td></tr>)}
        {records.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-navy-400">No student risk reviews recorded.</td></tr>}
      </tbody></table></div>
    </SectionCard>
  </div>;
}

export function CounselorInterventions() {
  const [records, setRecords] = useState(getCounselingInterventions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ studentId: '', type: '', description: '', status: 'ongoing' as InterventionStatus, startDate: new Date().toISOString().slice(0, 10) });
  const save = () => {
    if (!form.studentId || !form.type.trim()) return;
    if (editingId) updateCounselingIntervention(editingId, form);
    else createCounselingIntervention({ ...form, counselorId: 'u7' });
    setRecords(getCounselingInterventions());
    setEditingId(null);
    setForm({ studentId: '', type: '', description: '', status: 'ongoing', startDate: new Date().toISOString().slice(0, 10) });
  };
  const edit = (item: (typeof records)[number]) => {
    setEditingId(item.id);
    setForm({ studentId: item.studentId, type: item.type, description: item.description, status: item.status, startDate: item.startDate });
  };
  return <div className="space-y-6 animate-fade-in">
    <PageHeader title="Intervention Records" subtitle="Create support plans and update their progress as counseling work continues." />
    <SectionCard title={editingId ? 'Edit Intervention' : 'Create Intervention'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CounselorFormField label="Student"><select className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}><option value="">Select student</option>{STUDENTS.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></CounselorFormField>
        <CounselorFormField label="Intervention Type"><input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Academic support plan" /></CounselorFormField>
        <CounselorFormField label="Status"><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InterventionStatus })}>{Object.entries(INTERVENTION_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CounselorFormField>
        <CounselorFormField label="Start Date"><input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></CounselorFormField>
        <div className="md:col-span-2"><CounselorFormField label="Description"><textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the support plan or intervention." /></CounselorFormField></div>
      </div>
      <div className="flex justify-end gap-2 mt-4">{editingId && <button className="btn-secondary" onClick={() => { setEditingId(null); setForm({ studentId: '', type: '', description: '', status: 'ongoing', startDate: new Date().toISOString().slice(0, 10) }); }}>Cancel Edit</button>}<button className="btn-primary" onClick={save} disabled={!form.studentId || !form.type.trim()}><Save className="w-4 h-4" /> Save Intervention</button></div>
    </SectionCard>
    <SectionCard title={`Intervention Register (${records.length})`}>
      <div className="space-y-3">{records.map((item) => <div key={item.id} className="rounded-lg border border-navy-100 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1"><p className="font-medium text-navy-800">{item.studentName}</p><p className="text-sm text-navy-600">{item.type}</p><p className="text-xs text-navy-400 mt-1">{item.description} · Started {item.startDate}</p></div>
        <select aria-label={`Update status for ${item.studentName}`} className="input md:w-40" value={item.status} onChange={(e) => { updateCounselingIntervention(item.id, { status: e.target.value as InterventionStatus }); setRecords(getCounselingInterventions()); }}>{Object.entries(INTERVENTION_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="btn-secondary text-xs" onClick={() => edit(item)}><Pencil className="w-3 h-3" /> Edit</button>
      </div>)}{records.length === 0 && <EmptyState icon={<ClipboardList className="w-6 h-6" />} title="No interventions yet" message="Create an intervention to start tracking support progress." />}</div>
    </SectionCard>
  </div>;
}

export function CounselorFollowUps() {
  const [appointments, setAppointments] = useState(getCounselingAppointments());
  const [availability, setAvailability] = useState(getCounselorAvailability());
  const [selected, setSelected] = useState<string | null>(null);
  const [schedule, setSchedule] = useState({ date: '', time: '', note: '' });
  const [error, setError] = useState('');
  const refresh = () => setAppointments(getCounselingAppointments());
  const pending = appointments.filter((item) => item.status === 'pending');
  const scheduled = appointments.filter((item) => item.status === 'scheduled');
  const denied = appointments.filter((item) => item.status === 'denied');
  const saveSchedule = () => {
    if (!selected || !schedule.date || !schedule.time) return;
    try {
      scheduleCounselingAppointment(selected, schedule.date, schedule.time, schedule.note);
      setSelected(null);
      setSchedule({ date: '', time: '', note: '' });
      setError('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to schedule this appointment.');
    }
  };
  const deny = (id: string) => {
    const note = window.prompt('Optional reason for denying this appointment request:') || '';
    denyCounselingAppointment(id, note);
    refresh();
  };
  return <div className="space-y-6 animate-fade-in">
    <PageHeader title="Follow-up Activities" subtitle="Review student requests, schedule appointments, and manage appointment outcomes." />
    <SectionCard title={`Pending Requests (${pending.length})`}>
      <div className="space-y-3">{pending.map((item) => <div key={item.id} className="rounded-lg border border-navy-100 p-4">
        <div className="flex flex-col md:flex-row md:items-start gap-3"><div className="flex-1"><p className="font-medium text-navy-800">{item.studentName}</p><p className="text-sm text-navy-600">{item.requestType} · {item.className}</p><p className="text-sm text-navy-400 mt-1">{item.studentMessage || 'No additional message'}</p><p className="text-xs text-navy-400 mt-1">Requested {new Date(item.requestedAt).toLocaleString()}</p></div><span className="badge-warning">Pending</span></div>
        {selected === item.id ? <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <CounselorFormField label="Appointment Date"><input type="date" min={new Date().toISOString().slice(0, 10)} className="input" value={schedule.date} onChange={(e) => setSchedule({ ...schedule, date: e.target.value })} /></CounselorFormField>
          <CounselorFormField label="Appointment Time"><input type="time" className="input" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} /></CounselorFormField>
          <CounselorFormField label="Student-facing note"><input className="input" value={schedule.note} onChange={(e) => setSchedule({ ...schedule, note: e.target.value })} placeholder="Optional scheduling note" /></CounselorFormField>
          <div className="md:col-span-3"><p className="text-xs text-navy-500">The selected date and time must fall within your published availability.</p>{error && <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>}</div>
          <div className="md:col-span-3 flex justify-end gap-2"><button className="btn-secondary" onClick={() => { setSelected(null); setError(''); }}>Cancel</button><button className="btn-primary" onClick={saveSchedule} disabled={!schedule.date || !schedule.time}><CalendarCheck className="w-4 h-4" /> Confirm & Schedule</button></div>
        </div> : <div className="flex justify-end gap-2 mt-3"><button className="btn-secondary text-xs" onClick={() => { setSelected(item.id); setError(''); }}><CalendarClock className="w-3 h-3" /> Accept & Schedule</button><button className="btn-secondary text-xs text-red-600" onClick={() => deny(item.id)}><X className="w-3 h-3" /> Deny</button></div>}
      </div>)}{pending.length === 0 && <EmptyState icon={<CheckCircle2 className="w-6 h-6" />} title="No pending requests" message="New student appointment requests will appear here." />}</div>
    </SectionCard>
    <SectionCard title={`Scheduled Appointments (${scheduled.length})`}>
      <div className="space-y-3">{scheduled.map((item) => <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg border border-navy-100"><div className="p-2 rounded-lg bg-navy-100 text-navy-700"><CalendarDays className="w-4 h-4" /></div><div className="flex-1"><p className="font-medium text-navy-800">{item.studentName}</p><p className="text-sm text-navy-500">{item.requestType} · {item.scheduledDate} at {item.scheduledTime}</p></div><span className="badge-success">Scheduled</span></div>)}{scheduled.length === 0 && <p className="text-sm text-navy-400">No appointments scheduled.</p>}</div>
    </SectionCard>
    <SectionCard title={`Denied Requests (${denied.length})`}>
      <div className="space-y-2">{denied.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-navy-100"><div><p className="font-medium text-navy-800">{item.studentName}</p><p className="text-xs text-navy-400">{item.requestType}{item.counselorNote ? ` · ${item.counselorNote}` : ''}</p></div><span className="badge-error">Denied</span></div>)}{denied.length === 0 && <p className="text-sm text-navy-400">No denied requests.</p>}</div>
    </SectionCard>
    <CounselorAvailabilityPanel availability={availability} onChange={(next) => { saveCounselorAvailability(next); setAvailability(next); }} />
  </div>;
}

export function CounselorAvailability() {
  const [availability, setAvailability] = useState(getCounselorAvailability());
  return <div className="space-y-6 animate-fade-in"><PageHeader title="My Availability" subtitle="Publish the days and time ranges when students may request counseling appointments." /><CounselorAvailabilityPanel availability={availability} onChange={(next) => { saveCounselorAvailability(next); setAvailability(next); }} /></div>;
}

function CounselorAvailabilityPanel({ availability, onChange }: { availability: CounselorAvailabilitySlot[]; onChange: (next: CounselorAvailabilitySlot[]) => void }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const addSlot = () => onChange([...availability, { id: `slot-${Date.now()}`, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', active: true }]);
  const updateSlot = (id: string, changes: Partial<CounselorAvailabilitySlot>) => onChange(availability.map((slot) => slot.id === id ? { ...slot, ...changes } : slot));
  return <SectionCard title="Weekly Availability" action={<button className="btn-primary text-sm" onClick={addSlot}><Plus className="w-4 h-4" /> Add Time Slot</button>}>
    <p className="text-sm text-navy-500 mb-4">Only active availability slots can be used when confirming student appointment requests.</p>
    <div className="space-y-3">{availability.map((slot) => <div key={slot.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end rounded-lg border border-navy-100 p-3">
      <CounselorFormField label="Day"><select className="input" value={slot.dayOfWeek} onChange={(e) => updateSlot(slot.id, { dayOfWeek: Number(e.target.value) })}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></CounselorFormField>
      <CounselorFormField label="Start"><input type="time" className="input" value={slot.startTime} onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })} /></CounselorFormField>
      <CounselorFormField label="End"><input type="time" className="input" value={slot.endTime} onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })} /></CounselorFormField>
      <label className="flex items-center gap-2 text-sm text-navy-700 pb-2"><input type="checkbox" checked={slot.active} onChange={(e) => updateSlot(slot.id, { active: e.target.checked })} /> Available</label>
      <button className="btn-secondary text-xs" onClick={() => onChange(availability.filter((item) => item.id !== slot.id))}><X className="w-3 h-3" /> Remove</button>
    </div>)}{availability.length === 0 && <EmptyState icon={<CalendarDays className="w-6 h-6" />} title="No availability published" message="Add at least one day and time range before scheduling student requests." />}</div>
  </SectionCard>;
}
