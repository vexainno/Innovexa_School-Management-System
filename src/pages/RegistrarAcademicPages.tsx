import { useState } from 'react';
import {
  UserPlus, FileText, Grid3x3, ArrowLeftRight, FolderOpen, Users,
  Search, CheckCircle2, AlertCircle, Send, FileCheck, ClipboardList,
  BookOpen, Award, GraduationCap, Upload, Download, Trash2, FileSpreadsheet,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Avatar, Modal } from '@/components/ui';
import {
  SCHOOL_INFO, STUDENTS, CLASSES, GRADEBOOK_SUBMISSIONS, SUBJECTS,
} from '@/data/mockData';
import type { Student } from '@/types';

// --- Registrar Dashboard ---
export function RegistrarDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [showEnroll, setShowEnroll] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Registrar Dashboard"
        subtitle="Student records and enrollment management."
        action={<button onClick={() => setShowEnroll(true)} className="btn-primary"><UserPlus className="w-4 h-4" /> Enroll Student</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={SCHOOL_INFO.totalStudents} icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('students')} />
        <StatCard label="Active Classes" value={SCHOOL_INFO.totalClasses} icon={<Grid3x3 className="w-5 h-5" />} color="accent" onClick={() => onNavigate('classes')} />
        <StatCard label="New This Term" value="12" icon={<UserPlus className="w-5 h-5" />} color="success" onClick={() => onNavigate('admissions')} />
        <StatCard label="Transfers" value="1" icon={<ArrowLeftRight className="w-5 h-5" />} color="warning" onClick={() => onNavigate('transfers')} />
      </div>
      <SectionCard title="Recent Enrollments" action={<button onClick={() => onNavigate('students')} className="btn-ghost text-sm">View All</button>}>
        <div className="space-y-3">
          {STUDENTS.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <Avatar name={s.name} color={s.photoColor} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{s.name}</p>
                <p className="text-xs text-navy-400">{s.grade} — {s.class} — Roll: {s.rollNo}</p>
              </div>
              <span className={s.status === 'active' ? 'badge-success' : s.status === 'transferred' ? 'badge-warning' : 'badge-error'}>{s.status}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <EnrollModal open={showEnroll} onClose={() => setShowEnroll(false)} />
    </div>
  );
}

function EnrollModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', grade: '', class: '', gender: 'M', age: '', guardian: '', phone: '', email: '',
  });
  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const reset = () => { setStep(1); setForm({ name: '', grade: '', class: '', gender: 'M', age: '', guardian: '', phone: '', email: '' }); };

  return (
    <Modal open={open} onClose={onClose} title="Enroll New Student" size="lg">
      <div className="flex items-center gap-2 mb-6">
        {['Student Info', 'Class Placement', 'Guardian', 'Account'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i ? 'bg-success-500 text-white' : step === i + 1 ? 'bg-navy-700 text-white' : 'bg-navy-100 text-navy-400'
            }`}>{step > i ? '✓' : i + 1}</div>
            <span className={`text-xs ${step >= i + 1 ? 'text-navy-700 font-medium' : 'text-navy-400'}`}>{s}</span>
            {i < 3 && <div className="flex-1 h-px bg-navy-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student full name" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="M">Male</option><option value="F">Female</option>
              </select>
            </div>
            <div><label className="label">Age</label><input type="number" className="input" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" /></div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><label className="label">Grade</label>
            <select className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
              <option value="">Select grade</option>
              {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Class Section</label>
            <select className="input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
              <option value="">Select section</option>
              {CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div><label className="label">Guardian / Parent Name</label><input className="input" value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} placeholder="Guardian full name" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+231 ..." /></div>
            <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-success-50 border border-success-200">
            <div className="flex items-center gap-2 text-success-700 mb-2"><CheckCircle2 className="w-5 h-5" /><span className="font-semibold">Student record created successfully</span></div>
            <p className="text-sm text-success-600">The system will generate authorized account credentials for the student and linked parent/guardian.</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between p-3 rounded-lg bg-navy-50"><span className="text-sm text-navy-500">Student Name</span><span className="text-sm font-medium text-navy-800">{form.name || '—'}</span></div>
            <div className="flex justify-between p-3 rounded-lg bg-navy-50"><span className="text-sm text-navy-500">Class</span><span className="text-sm font-medium text-navy-800">{form.grade} {form.class || '—'}</span></div>
            <div className="flex justify-between p-3 rounded-lg bg-navy-50"><span className="text-sm text-navy-500">Guardian</span><span className="text-sm font-medium text-navy-800">{form.guardian || '—'}</span></div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        {step > 1 && step < 4 && <button onClick={prev} className="btn-secondary">Back</button>}
        {step < 4 && <button onClick={next} className="btn-primary ml-auto">Next</button>}
        {step === 4 && (
          <div className="flex gap-3 ml-auto">
            <button onClick={() => { reset(); onClose(); }} className="btn-primary">Done</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function RegistrarAdmissions({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [showEnroll, setShowEnroll] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Registration" subtitle="Create records for students already admitted through the school’s traditional process." action={<button onClick={() => setShowEnroll(true)} className="btn-primary"><UserPlus className="w-4 h-4" /> New Admission</button>} />
      <SectionCard title="Admission Workflow">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {['School admits student offline', 'Registrar creates record', 'Assign to class', 'Verify guardian', 'Optional activation', 'Access issued by school'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-50 border border-navy-200">
                <div className="w-6 h-6 rounded-full bg-navy-700 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <span className="text-xs font-medium text-navy-700 whitespace-nowrap">{s}</span>
              </div>
              {i < 5 && <ArrowLeftRight className="w-3 h-3 text-navy-300 shrink-0" />}
            </div>
          ))}
        </div>
      </SectionCard>
      <EnrollModal open={showEnroll} onClose={() => setShowEnroll(false)} />
    </div>
  );
}

export function RegistrarStudents() {
  const [search, setSearch] = useState('');
  const filtered = STUDENTS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search));
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Records" subtitle="All enrolled students." />
      <SectionCard title={`Students (${filtered.length})`}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input className="input pl-10" placeholder="Search by name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table className="table-base">
          <thead><tr><th>Student</th><th>Grade</th><th>Class</th><th>Roll No</th><th>Guardian</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td><div className="flex items-center gap-2"><Avatar name={s.name} color={s.photoColor} size="sm" /><span className="font-medium text-navy-800">{s.name}</span></div></td>
                <td>{s.grade}</td>
                <td>{s.class}</td>
                <td>{s.rollNo}</td>
                <td>{s.guardianName}</td>
                <td><span className={s.status === 'active' ? 'badge-success' : s.status === 'transferred' ? 'badge-warning' : 'badge-error'}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function RegistrarClasses() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Class Placement" subtitle="Assign and manage student class placements." />
      <SectionCard title="Classes">
        <table className="table-base">
          <thead><tr><th>Class</th><th>Grade</th><th>Section</th><th>Teacher</th><th>Students</th><th>Room</th></tr></thead>
          <tbody>
            {CLASSES.map((c) => (
              <tr key={c.id}>
                <td className="font-medium text-navy-800">{c.name}</td>
                <td>{c.grade}</td><td>{c.section}</td><td>{c.teacherName}</td><td>{c.studentCount}</td><td>{c.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function RegistrarGuardians() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Parent / Guardian Records" subtitle="Guardian information linked to students." />
      <SectionCard title="Guardians">
        <table className="table-base">
          <thead><tr><th>Guardian Name</th><th>Student</th><th>Phone</th><th>Student Class</th></tr></thead>
          <tbody>
            {STUDENTS.map((s) => (
              <tr key={s.id}>
                <td className="font-medium text-navy-800">{s.guardianName}</td>
                <td>{s.name}</td>
                <td>{s.guardianPhone}</td>
                <td>{s.grade} — {s.class}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function RegistrarTransfers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Transfers" subtitle="Student transfers in and out." />
      <SectionCard title="Transfer Records">
        <div className="space-y-3">
          {STUDENTS.filter((s) => s.status === 'transferred').map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-warning-100 text-warning-700"><ArrowLeftRight className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-navy-800">{s.name}</p><p className="text-xs text-navy-400">{s.grade} — {s.class}</p></div>
              <span className="badge-warning">Transferred</span>
            </div>
          ))}
          {STUDENTS.filter((s) => s.status === 'transferred').length === 0 && (
            <EmptyState icon={<ArrowLeftRight className="w-8 h-8" />} title="No transfers" message="No student transfers recorded." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function RegistrarDocuments() {
  type Doc={id:string;name:string;category:string;size:number;date:string;dataUrl?:string};
  const [docs,setDocs]=useState<Doc[]>(()=>{try{return JSON.parse(localStorage.getItem('innosysedu.documents.v2')||'[]')}catch{return []}});
  const [category,setCategory]=useState('Enrollment Forms');
  const save=(next:Doc[])=>{setDocs(next);localStorage.setItem('innosysedu.documents.v2',JSON.stringify(next));};
  const upload=async(file:File)=>{const dataUrl=file.size<=2_500_000?await new Promise<string>(resolve=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.readAsDataURL(file)}):undefined;save([{id:`doc-${Date.now()}`,name:file.name,category,size:file.size,date:new Date().toISOString().slice(0,10),dataUrl},...docs]);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Student Documents" subtitle="Upload, organize, and retrieve registrar documents from one place."/><SectionCard title="Upload Document"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div><label className="label">Document category</label><select className="input" value={category} onChange={e=>setCategory(e.target.value)}>{['Enrollment Forms','Birth Certificates','Transfer Certificates','Medical Records','Guardian ID Copies','Report Cards (Previous)','Other'].map(x=><option key={x}>{x}</option>)}</select></div><label className="btn-primary cursor-pointer justify-center"><Upload className="w-4 h-4"/> Choose File<input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f)}}/></label><div className="text-xs text-navy-400">Files up to 2.5 MB keep a quick preview/download copy in this prototype.</div></div></SectionCard><SectionCard title={`Uploaded Documents (${docs.length})`}>{docs.length===0?<EmptyState icon={<FolderOpen className="w-8 h-8"/>} title="No documents uploaded" message="Use the upload area above to add registrar documents."/>:<table className="table-base"><thead><tr><th>Document</th><th>Category</th><th>Size</th><th>Date</th><th>Action</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td className="font-medium text-navy-800">{d.name}</td><td><span className="badge-info">{d.category}</span></td><td>{Math.max(1,Math.round(d.size/1024))} KB</td><td>{d.date}</td><td>{d.dataUrl?<a href={d.dataUrl} download={d.name} className="btn-secondary text-xs"><Download className="w-3 h-3"/> Download</a>:<span className="text-xs text-navy-400">Metadata saved</span>} <button className="btn-secondary text-xs ml-1" onClick={()=>save(docs.filter(x=>x.id!==d.id))}><Trash2 className="w-3 h-3"/> Remove</button></td></tr>)}</tbody></table>}</SectionCard></div>;
}

export function AcademicDashboard() {
  const submitted = GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'submitted');
  const approved = GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'approved');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Officer Dashboard" subtitle="Examinations, gradebooks, and results management." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Submitted Gradebooks" value={submitted.length} icon={<ClipboardList className="w-5 h-5" />} color="warning" />
        <StatCard label="Approved Grades" value={approved.length} icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Pending Release" value={2} icon={<Send className="w-5 h-5" />} color="navy" />
        <StatCard label="Active Subjects" value={SUBJECTS.length} icon={<BookOpen className="w-5 h-5" />} color="accent" />
      </div>
      <SectionCard title="Result Release Workflow">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {['Teacher submits', 'System calculates', 'Principal reviews', 'Principal approves', 'Academic Officer releases', 'Student + Parent view'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-50 border border-navy-200">
                <div className="w-6 h-6 rounded-full bg-navy-700 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <span className="text-xs font-medium text-navy-700 whitespace-nowrap">{s}</span>
              </div>
              {i < 5 && <ArrowLeftRight className="w-3 h-3 text-navy-300 shrink-0" />}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function AcademicExaminations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Examination Schedules" subtitle="Manage examination schedules and timetables." />
      <SectionCard title="Upcoming Examinations">
        <table className="table-base">
          <thead><tr><th>Exam</th><th>Grade</th><th>Subject</th><th>Date</th><th>Time</th><th>Duration</th><th>Status</th></tr></thead>
          <tbody>
            {[
              { name: 'Midterm — Mathematics', grade: 'Grade 11', subject: 'Mathematics', date: '2026-09-25', time: '9:00 AM', duration: '2 hrs' },
              { name: 'Midterm — Physics', grade: 'Grade 11', subject: 'Physics', date: '2026-09-26', time: '9:00 AM', duration: '2 hrs' },
              { name: 'Midterm — English', grade: 'Grade 11', subject: 'English Language', date: '2026-09-27', time: '9:00 AM', duration: '2 hrs' },
              { name: 'Midterm — Biology', grade: 'Grade 11', subject: 'Biology', date: '2026-09-28', time: '9:00 AM', duration: '2 hrs' },
            ].map((e, i) => (
              <tr key={i}>
                <td className="font-medium text-navy-800">{e.name}</td>
                <td>{e.grade}</td><td>{e.subject}</td><td>{e.date}</td><td>{e.time}</td><td>{e.duration}</td>
                <td><span className="badge-info">Scheduled</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function AcademicSubmittedGradebooks() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Submitted Gradebooks" subtitle="Gradebooks submitted by teachers." />
      <SectionCard title="All Submissions">
        <table className="table-base">
          <thead><tr><th>Teacher</th><th>Subject</th><th>Class</th><th>Term</th><th>Submitted</th><th>Status</th></tr></thead>
          <tbody>
            {GRADEBOOK_SUBMISSIONS.map((s) => (
              <tr key={s.id}>
                <td className="font-medium text-navy-800">{s.teacherName}</td>
                <td>{s.subjectName}</td><td>{s.className}</td><td>{s.term}</td><td>{s.submittedDate}</td>
                <td>
                  <span className={
                    s.status === 'submitted' ? 'badge-info' :
                    s.status === 'under_review' ? 'badge-warning' :
                    s.status === 'approved' ? 'badge-success' : 'badge-error'
                  }>{s.status.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function AcademicApprovedGrades() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Approved Grades" subtitle="Gradebooks approved by the Principal." />
      <SectionCard title="Approved Gradebooks">
        <div className="space-y-3">
          {GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'approved').map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-success-100 text-success-700"><CheckCircle2 className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{s.subjectName} — {s.className}</p>
                <p className="text-xs text-navy-400">{s.teacherName} — {s.term}</p>
              </div>
              <span className="badge-success">Approved</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function AcademicResultsRelease() {
  const [released, setReleased] = useState<string[]>([]);
  const approved = GRADEBOOK_SUBMISSIONS.filter((s) => s.status === 'approved');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Results Release" subtitle="Release approved results to students and parents." />
      <SectionCard title="Ready for Release">
        {approved.length === 0 ? (
          <EmptyState icon={<Send className="w-8 h-8" />} title="No results to release" message="No approved gradebooks are awaiting release." />
        ) : (
          <div className="space-y-3">
            {approved.map((s) => {
              const isReleased = released.includes(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
                  <div className="p-2 rounded-lg bg-success-100 text-success-700"><Award className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-800">{s.subjectName} — {s.className}</p>
                    <p className="text-xs text-navy-400">{s.term} — {s.studentCount} students</p>
                  </div>
                  {isReleased ? (
                    <span className="badge-success">Released</span>
                  ) : (
                    <button onClick={() => setReleased((prev) => [...prev, s.id])} className="btn-primary text-sm">Release Results</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function AcademicClassesSubjects() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Classes & Subjects" subtitle="Manage academic structure." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Classes">
          <table className="table-base">
            <thead><tr><th>Class</th><th>Students</th><th>Teacher</th></tr></thead>
            <tbody>
              {CLASSES.map((c) => (<tr key={c.id}><td className="font-medium text-navy-800">{c.name}</td><td>{c.studentCount}</td><td>{c.teacherName}</td></tr>))}
            </tbody>
          </table>
        </SectionCard>
        <SectionCard title="Subjects">
          <table className="table-base">
            <thead><tr><th>Subject</th><th>Code</th><th>Class</th><th>Teacher</th></tr></thead>
            <tbody>
              {SUBJECTS.map((s) => (<tr key={s.id}><td className="font-medium text-navy-800">{s.name}</td><td>{s.code}</td><td>{s.className}</td><td>{s.teacherName}</td></tr>))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}

export function AcademicReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Reports" subtitle="Examination and results reports." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Examination Report', desc: 'Exam schedules and results', icon: FileCheck },
          { name: 'Grade Distribution', desc: 'Grade breakdown by class', icon: GraduationCap },
          { name: 'Subject Performance', desc: 'Performance by subject', icon: BookOpen },
          { name: 'Pass Rate Analysis', desc: 'Pass/fail statistics', icon: Award },
          { name: 'Results Summary', desc: 'Released results overview', icon: FileText },
          { name: 'Class Rankings', desc: 'Student rankings by class', icon: ClipboardList },
        ].map((r) => (
          <div key={r.name} className="card-hover p-5 cursor-pointer">
            <div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><r.icon className="w-5 h-5" /></div>
            <h3 className="font-semibold text-navy-800">{r.name}</h3>
            <p className="text-sm text-navy-400 mt-1">{r.desc}</p>
            <button className="btn-secondary text-sm mt-4 w-full">Generate</button>
          </div>
        ))}
      </div>
    </div>
  );
}
