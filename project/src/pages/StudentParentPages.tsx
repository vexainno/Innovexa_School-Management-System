import { useEffect, useState } from 'react';

import {
  Users,
  BookOpen,
  FileText,
  Library,
  CalendarCheck,
  Award,
  FileBadge,
  Megaphone,
  Download,
  Search,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Link2,
  Plus,
  Loader2,
} from 'lucide-react';

import {
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  Avatar,
  ProgressBar,
  Modal,
} from '@/components/ui';

import { useAuth } from '@/context/AuthContext';

import {
  STUDENTS,
  SUBJECTS,
  ASSESSMENTS,
  GRADES,
  ATTENDANCE,
  BOOKS,
  BOOK_REQUESTS,
  ANNOUNCEMENTS,
  INVOICES,
  CLASSES,
} from '@/data/mockData';

import type { Book } from '@/types';

import {
  getLearningResources,
  type LearningResource,
} from '@/data/learningResources';


// --- Student Dashboard ---
export function StudentDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const myResults = GRADES.filter((g) => g.studentId === 's1');
  const myAttendance = ATTENDANCE.filter((a) => a.studentId === 's1');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Dashboard" subtitle="Your academic overview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Subjects" value={SUBJECTS.filter((s) => s.classId === 'c5').length} icon={<BookOpen className="w-5 h-5" />} />
        <StatCard label="My Results" value={myResults.length} icon={<Award className="w-5 h-5" />} color="accent" />
        <StatCard label="Days Present" value={myAttendance.filter((a) => a.status === 'present').length} icon={<CalendarCheck className="w-5 h-5" />} color="success" />
        <StatCard label="Pending Assignments" value={ASSESSMENTS.filter((a) => a.status === 'published').length} icon={<FileText className="w-5 h-5" />} color="warning" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="My Recent Results" action={<button onClick={() => onNavigate('results')} className="btn-ghost text-sm">View All</button>}>
          <div className="space-y-3">
            {myResults.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><Award className="w-4 h-4" /></div>
                <div className="flex-1"><p className="text-sm font-medium text-navy-800">{g.assessmentTitle}</p><p className="text-xs text-navy-400">{g.subjectName} — {g.score}/{g.totalMarks}</p></div>
                <span className={g.status === 'released' ? 'badge-success' : 'badge-warning'}>{g.grade}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Announcements" action={<button onClick={() => onNavigate('announcements')} className="btn-ghost text-sm">View All</button>}>
          <div className="space-y-3">
            {ANNOUNCEMENTS.slice(0, 3).map((an) => (
              <div key={an.id} className="border-l-2 border-navy-300 pl-3">
                <p className="text-sm font-medium text-navy-800">{an.title}</p>
                <p className="text-xs text-navy-400 mt-0.5">{an.date}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function StudentClasses() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Classes" subtitle="Classes you are enrolled in." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLASSES.map((c) => (
          <div key={c.id} className="card-hover p-5">
            <div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><Users className="w-5 h-5" /></div>
            <h3 className="font-semibold text-navy-800">{c.name}</h3>
            <p className="text-sm text-navy-400 mt-1">{c.studentCount} students — {c.room}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudentSubjects() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Subjects" subtitle="Your enrolled subjects." />
      <SectionCard title="Subjects">
        <table className="table-base">
          <thead><tr><th>Subject</th><th>Code</th><th>Class</th><th>Teacher</th></tr></thead>
          <tbody>
            {SUBJECTS.filter((s) => s.classId === 'c5').map((s) => (
              <tr key={s.id}><td className="font-medium text-navy-800">{s.name}</td><td>{s.code}</td><td>{s.className}</td><td>{s.teacherName}</td></tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function StudentAssignments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Assignments" subtitle="Your assignments and due dates." />
      <SectionCard title="Assignments">
        <table className="table-base">
          <thead><tr><th>Assignment</th><th>Type</th><th>Subject</th><th>Date</th><th>Marks</th><th>Status</th></tr></thead>
          <tbody>
            {ASSESSMENTS.filter((a) => a.classId === 'c5').map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-navy-800">{a.title}</td>
                <td><span className="badge-info">{a.type}</span></td>
                <td>{a.subjectName}</td><td>{a.date}</td><td>{a.totalMarks}</td>
                <td><span className={a.status === 'graded' ? 'badge-success' : a.status === 'published' ? 'badge-info' : 'badge-warning'}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function StudentResources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // The demo account uses the signed-in student's ID. The s1 fallback keeps
  // the existing frontend demo usable when authentication is not connected.
  const student = STUDENTS.find((item) => item.id === user?.id) || STUDENTS.find((item) => item.id === 's1');

  const normalize = (value: string | undefined) =>
    (value || '').replace(/\\s+/g, '').toLowerCase();

  const studentClass = student
    ? CLASSES.find((item) => {
        const studentClassValue = normalize(student.class);
        const gradeValue = String(item.grade || '').replace(/^grade\\s*/i, '');
        const gradeSection = normalize(`${gradeValue}${item.section}`);
        const className = normalize(item.name);
        return (
          (studentClassValue && studentClassValue === gradeSection) ||
          (studentClassValue && studentClassValue === className)
        );
      })
    : undefined;

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const allResources = await getLearningResources();
        if (!active) return;

        const visibleResources = allResources.filter((resource) => {
          if (studentClass) {
            return resource.classId === studentClass.id;
          }

          // Fallback for demo records where the student class has no matching
          // class entry in the mock class list.
          const targetClass = normalize(`${resource.className}${resource.section}`);
          return targetClass !== '' && targetClass === normalize(student?.class);
        });

        setResources(
          visibleResources.sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
          ),
        );
      } catch (loadError) {
        console.error('Unable to load learning resources:', loadError);
        if (active) {
          setError('Learning resources could not be loaded. Please refresh and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [student?.class, studentClass?.id]);

  const handleDownload = (resource: LearningResource) => {
    const objectUrl = URL.createObjectURL(resource.file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = resource.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Learning Resources"
        subtitle="Materials shared by your teachers for your class."
      />

      <SectionCard title="Available Resources">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-navy-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading learning resources...
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : resources.length === 0 ? (
          <EmptyState
            icon={<Library className="w-8 h-8" />}
            title="No learning resources yet"
            message="Your teachers have not shared any learning materials with your class yet. New resources will appear here when they are published."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="card-hover flex flex-col p-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                  <FileText className="h-5 w-5" />
                </div>

                <h3 className="text-sm font-semibold text-navy-800 break-words">
                  {resource.title}
                </h3>
                {resource.description && (
                  <p className="mt-2 text-sm text-navy-500 line-clamp-3">
                    {resource.description}
                  </p>
                )}

                <div className="mt-3 space-y-1 text-xs text-navy-400">
                  <p>{resource.subjectName}</p>
                  <p>
                    {resource.fileType || 'File'} · {formatFileSize(resource.fileSize)}
                  </p>
                  <p>
                    Shared {new Date(resource.uploadedAt).toLocaleDateString()}
                  </p>
                  <p>Teacher: {resource.teacherName}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(resource)}
                  className="btn-secondary mt-4 w-full text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Resource
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function StudentAttendance() {
  const myAttendance = ATTENDANCE.filter((a) => a.studentId === 's1');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Attendance" subtitle="Your attendance record. You can only view attendance — submissions are made by your teacher." />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Present" value={myAttendance.filter((a) => a.status === 'present').length} icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Absent" value={myAttendance.filter((a) => a.status === 'absent').length} icon={<AlertCircle className="w-5 h-5" />} color="error" />
        <StatCard label="Late" value={myAttendance.filter((a) => a.status === 'late').length} icon={<CalendarCheck className="w-5 h-5" />} color="warning" />
        <StatCard label="Excused" value={myAttendance.filter((a) => a.status === 'excused').length} icon={<CalendarCheck className="w-5 h-5" />} color="navy" />
      </div>
      <SectionCard title="Attendance History">
        <table className="table-base">
          <thead><tr><th>Date</th><th>Class</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {myAttendance.map((a) => (
              <tr key={a.id}>
                <td>{a.date}</td><td>{a.className}</td>
                <td><span className={a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-error' : a.status === 'late' ? 'badge-warning' : 'badge-info'}>{a.status}</span></td>
                <td className="text-navy-400">{a.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function StudentResults() {
  const myResults = GRADES.filter((g) => g.studentId === 's1');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Results" subtitle="Your released assignment, quiz, test, and exam results." />
      <SectionCard title="Results">
        <table className="table-base">
          <thead><tr><th>Assessment</th><th>Subject</th><th>Score</th><th>Out Of</th><th>Grade</th><th>Status</th></tr></thead>
          <tbody>
            {myResults.map((g) => (
              <tr key={g.id}>
                <td className="font-medium text-navy-800">{g.assessmentTitle}</td>
                <td>{g.subjectName}</td>
                <td className="font-semibold">{g.score}</td><td>{g.totalMarks}</td>
                <td><span className={g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-info' : 'badge-warning'}>{g.grade}</span></td>
                <td><span className={g.status === 'released' ? 'badge-success' : 'badge-warning'}>{g.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function StudentReportCard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Report Card" subtitle="Your term report card." action={<button className="btn-primary"><Download className="w-4 h-4" /> Download Report Card</button>} />
      <SectionCard title="First Term 2026/2027 — Grade 11A">
        <div className="p-6 rounded-lg border-2 border-navy-200 bg-white">
          <div className="text-center mb-6">
            <h2 className="font-display font-bold text-xl text-navy-900">Innosys Academy</h2>
            <p className="text-sm text-navy-500">First Term Report Card — 2026/2027</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="text-xs text-navy-400">Student Name</p><p className="font-semibold text-navy-800">John K. Mensah</p></div>
            <div><p className="text-xs text-navy-400">Class</p><p className="font-semibold text-navy-800">Grade 11A</p></div>
            <div><p className="text-xs text-navy-400">Roll Number</p><p className="font-semibold text-navy-800">11A-001</p></div>
            <div><p className="text-xs text-navy-400">Term</p><p className="font-semibold text-navy-800">First Term</p></div>
          </div>
          <table className="table-base">
            <thead><tr><th>Subject</th><th>Score</th><th>Out Of</th><th>Grade</th><th>Remark</th></tr></thead>
            <tbody>
              {GRADES.filter((g) => g.studentId === 's1').map((g) => (
                <tr key={g.id}><td className="font-medium">{g.subjectName}</td><td>{g.score}</td><td>{g.totalMarks}</td><td>{g.grade}</td><td>{g.grade.startsWith('A') ? 'Excellent' : g.grade.startsWith('B') ? 'Good' : 'Satisfactory'}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-navy-50"><p className="text-xs text-navy-400">Total Average</p><p className="font-semibold text-navy-800">87.5%</p></div>
            <div className="p-3 rounded-lg bg-navy-50"><p className="text-xs text-navy-400">Position</p><p className="font-semibold text-navy-800">3rd of 31</p></div>
          </div>
          <div className="mt-6 pt-4 border-t border-navy-200">
            <p className="text-xs text-navy-400">Principal's Signature</p>
            <div className="mt-8"><p className="text-sm font-medium text-navy-700">Dr. Edward Karpeh</p></div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function StudentLibrary() {
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [requested, setRequested] = useState<string[]>([]);
  const [showActivity, setShowActivity] = useState(false);

  const grades = ['all', ...Array.from(new Set(BOOKS.map((b) => b.gradeLevel)))];
  const categories = ['all', ...Array.from(new Set(BOOKS.map((b) => b.category)))];
  const subjects = ['all', ...Array.from(new Set(BOOKS.map((b) => b.subject)))];

  const filtered = BOOKS.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = filterGrade === 'all' || b.gradeLevel === filterGrade;
    const matchesCategory = filterCategory === 'all' || b.category === filterCategory;
    const matchesSubject = filterSubject === 'all' || b.subject === filterSubject;
    return matchesSearch && matchesGrade && matchesCategory && matchesSubject;
  });

  const myRequests = BOOK_REQUESTS.filter((r) => r.studentId === 's1');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Library"
        subtitle="Browse available books and submit booking requests."
        action={<button onClick={() => setShowActivity(!showActivity)} className="btn-secondary">{showActivity ? 'Browse Books' : 'My Library Activity'}</button>}
      />

      {showActivity ? (
        <SectionCard title="My Library Activity">
          {myRequests.length === 0 ? (
            <EmptyState icon={<BookMarked className="w-8 h-8" />} title="No requests yet" message="You have not requested any books. Browse the catalog to submit a request." />
          ) : (
            <table className="table-base">
              <thead><tr><th>Book</th><th>Request Date</th><th>Status</th><th>Due Date</th><th>Return Date</th></tr></thead>
              <tbody>
                {myRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-navy-800">{r.bookTitle}</td>
                    <td>{r.requestDate}</td>
                    <td><span className={
                      r.status === 'approved' ? 'badge-success' :
                      r.status === 'pending' ? 'badge-warning' :
                      r.status === 'rejected' ? 'badge-error' :
                      r.status === 'borrowed' ? 'badge-info' : 'badge-success'
                    }>{r.status}</span></td>
                    <td>{r.dueDate || '—'}</td>
                    <td>{r.returnDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Available Books">
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input className="input pl-10" placeholder="Search books by title or subject..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Grade Level</label>
                <select className="input" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
                  {grades.map((g) => <option key={g} value={g}>{g === 'all' ? 'All Grades' : g}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select className="input" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                  {subjects.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
                </select>
              </div>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No books found" message="Try adjusting your search or filters." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((b) => (
                <div key={b.id} className="card-hover p-5">
                  <div className={`h-24 ${b.coverColor} rounded-lg mb-3 flex items-center justify-center`}>
                    <BookOpen className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="font-semibold text-navy-800 text-sm">{b.title}</h3>
                  <p className="text-xs text-navy-400 mt-1">{b.author} — {b.subject}</p>
                  <p className="text-xs text-navy-400">{b.gradeLevel} — {b.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-navy-500">{b.copiesAvailable} available</span>
                    <span className={b.status === 'available' ? 'badge-success' : b.status === 'limited' ? 'badge-warning' : 'badge-error'}>{b.status}</span>
                  </div>
                  {requested.includes(b.id) ? (
                    <button disabled className="btn-secondary text-xs w-full mt-3 opacity-50"><CheckCircle2 className="w-3.5 h-3.5" /> Requested</button>
                  ) : (
                    <button onClick={() => setSelectedBook(b)} className="btn-primary text-xs w-full mt-3" disabled={b.status === 'unavailable'}>Request Book</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {selectedBook && (
        <Modal open={true} onClose={() => setSelectedBook(null)} title="Request Book">
          <div className="space-y-4">
            <div className={`h-32 ${selectedBook.coverColor} rounded-lg flex items-center justify-center`}>
              <BookOpen className="w-12 h-12 text-white/80" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-800">{selectedBook.title}</h3>
              <p className="text-sm text-navy-400">{selectedBook.author} — {selectedBook.subject} — {selectedBook.gradeLevel}</p>
            </div>
            <p className="text-sm text-navy-600">By submitting this request, the librarian will review and approve your booking. You will be notified when the book is ready for pickup.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelectedBook(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => { setRequested((prev) => [...prev, selectedBook.id]); setSelectedBook(null); }} className="btn-primary">Submit Request</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function StudentAnnouncements() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Announcements" subtitle="School announcements for students." />
      <SectionCard title="All Announcements">
        <div className="space-y-4">
          {ANNOUNCEMENTS.map((an) => (
            <div key={an.id} className="p-4 rounded-lg border border-navy-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-navy-800">{an.title}</h3>
                <span className={an.priority === 'urgent' ? 'badge-error' : an.priority === 'important' ? 'badge-warning' : 'badge-info'}>{an.priority}</span>
              </div>
              <p className="text-sm text-navy-600">{an.body}</p>
              <p className="text-xs text-navy-400 mt-2">{an.date} — {an.author}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// --- Parent ---
export function ParentDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const myChildren = STUDENTS.filter((s) => childIds.includes(s.id));
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Parent Dashboard" subtitle="Your linked children and their academic information." />
      <SectionCard title="My Children">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myChildren.map((child) => (
            <div key={child.id} className="card-hover p-5 cursor-pointer" onClick={() => onNavigate('results')}>
              <div className="flex items-center gap-4">
                <Avatar name={child.name} color={child.photoColor} size="lg" />
                <div className="flex-1">
                  <h3 className="font-semibold text-navy-800">{child.name}</h3>
                  <p className="text-sm text-navy-400">{child.grade} — {child.class}</p>
                  <p className="text-xs text-navy-400 mt-1">Roll: {child.rollNo}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-navy-300" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Linked Children" value={myChildren.length} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Total Fees" value={`L$${INVOICES.filter((i) => childIds.includes(i.studentId)).reduce((s, i) => s + i.amount, 0).toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="warning" />
        <StatCard label="Outstanding" value={`L$${INVOICES.filter((i) => childIds.includes(i.studentId)).reduce((s, i) => s + (i.amount - i.amountPaid), 0).toLocaleString()}`} icon={<AlertCircle className="w-5 h-5" />} color="error" />
      </div>
    </div>
  );
}

export function ParentChildren({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const myChildren = STUDENTS.filter((s) => childIds.includes(s.id));
  const [showLink, setShowLink] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Children" subtitle="Your linked children." action={<button onClick={() => setShowLink(true)} className="btn-primary"><Link2 className="w-4 h-4" /> Link Child</button>} />
      <SectionCard title="Linked Children">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myChildren.map((child) => (
            <div key={child.id} className="card p-5">
              <div className="flex items-center gap-4">
                <Avatar name={child.name} color={child.photoColor} size="lg" />
                <div className="flex-1">
                  <h3 className="font-semibold text-navy-800">{child.name}</h3>
                  <p className="text-sm text-navy-400">{child.grade} — {child.class}</p>
                  <p className="text-xs text-navy-400 mt-1">Roll: {child.rollNo}</p>
                </div>
                <button onClick={() => onNavigate('results')} className="btn-secondary text-sm">View Info</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      {showLink && (
        <Modal open={true} onClose={() => { setShowLink(false); setLinkSuccess(false); setLinkCode(''); }} title="Link Child with Secret Code">
          {linkSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success-50 border border-success-200">
                <div className="flex items-center gap-2 text-success-700"><CheckCircle2 className="w-5 h-5" /><span className="font-semibold">Child Linked Successfully</span></div>
                <p className="text-sm text-success-600 mt-1">The student relationship has been verified. You can now access their authorized information.</p>
              </div>
              <button onClick={() => { setShowLink(false); setLinkSuccess(false); setLinkCode(''); }} className="btn-primary w-full">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-navy-600">Enter the secret parent-child linking code provided by the school to verify your relationship with a student.</p>
              <div><label className="label">Secret Linking Code</label><input className="input" value={linkCode} onChange={(e) => setLinkCode(e.target.value)} placeholder="Enter linking code" /></div>
              <div className="p-3 rounded-lg bg-navy-50 text-sm text-navy-600">
                <p>After verification, the child will appear under "My Children" and you will be able to access their authorized information.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowLink(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => setLinkSuccess(true)} className="btn-primary" disabled={!linkCode.trim()}>Verify & Link</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export function ParentResults({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const [selectedChild, setSelectedChild] = useState(childIds[0]);
  const childResults = GRADES.filter((g) => g.studentId === selectedChild);
  const child = STUDENTS.find((s) => s.id === selectedChild);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Results" subtitle="View your child's released results." />
      <SectionCard title="Select Child">
        <div className="flex gap-3 flex-wrap">
          {childIds.map((id) => {
            const s = STUDENTS.find((st) => st.id === id);
            if (!s) return null;
            return (
              <button key={id} onClick={() => setSelectedChild(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${selectedChild === id ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'}`}>
                <Avatar name={s.name} color={s.photoColor} size="sm" /> {s.name}
              </button>
            );
          })}
        </div>
      </SectionCard>
      <SectionCard title={`Results — ${child?.name || ''}`}>
        {childResults.length === 0 ? (
          <EmptyState icon={<Award className="w-8 h-8" />} title="No released results" message="No results have been released for this child yet." />
        ) : (
          <table className="table-base">
            <thead><tr><th>Assessment</th><th>Subject</th><th>Score</th><th>Out Of</th><th>Grade</th></tr></thead>
            <tbody>
              {childResults.map((g) => (
                <tr key={g.id}><td className="font-medium text-navy-800">{g.assessmentTitle}</td><td>{g.subjectName}</td><td className="font-semibold">{g.score}</td><td>{g.totalMarks}</td><td><span className={g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-info' : 'badge-warning'}>{g.grade}</span></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

export function ParentAttendance({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const [selectedChild, setSelectedChild] = useState(childIds[0]);
  const childAttendance = ATTENDANCE.filter((a) => a.studentId === selectedChild);
  const child = STUDENTS.find((s) => s.id === selectedChild);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance" subtitle="View your child's attendance record." />
      <SectionCard title="Select Child">
        <div className="flex gap-3 flex-wrap">
          {childIds.map((id) => {
            const s = STUDENTS.find((st) => st.id === id);
            if (!s) return null;
            return (
              <button key={id} onClick={() => setSelectedChild(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${selectedChild === id ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'}`}>
                <Avatar name={s.name} color={s.photoColor} size="sm" /> {s.name}
              </button>
            );
          })}
        </div>
      </SectionCard>
      <SectionCard title={`Attendance — ${child?.name || ''}`}>
        <table className="table-base">
          <thead><tr><th>Date</th><th>Class</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {childAttendance.map((a) => (
              <tr key={a.id}><td>{a.date}</td><td>{a.className}</td><td><span className={a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-error' : a.status === 'late' ? 'badge-warning' : 'badge-info'}>{a.status}</span></td><td className="text-navy-400">{a.note || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function ParentReportCard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const [selectedChild, setSelectedChild] = useState(childIds[0]);
  const child = STUDENTS.find((s) => s.id === selectedChild);
  const childResults = GRADES.filter((g) => g.studentId === selectedChild);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Report Card" subtitle="View and download your child's report card." action={<button className="btn-primary"><Download className="w-4 h-4" /> Download</button>} />
      <SectionCard title="Select Child">
        <div className="flex gap-3 flex-wrap">
          {childIds.map((id) => {
            const s = STUDENTS.find((st) => st.id === id);
            if (!s) return null;
            return (
              <button key={id} onClick={() => setSelectedChild(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${selectedChild === id ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'}`}>
                <Avatar name={s.name} color={s.photoColor} size="sm" /> {s.name}
              </button>
            );
          })}
        </div>
      </SectionCard>
      <SectionCard title={`Report Card — ${child?.name || ''}`}>
        <div className="p-6 rounded-lg border-2 border-navy-200 bg-white">
          <div className="text-center mb-6">
            <h2 className="font-display font-bold text-xl text-navy-900">Innosys Academy</h2>
            <p className="text-sm text-navy-500">First Term Report Card — 2026/2027</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="text-xs text-navy-400">Student Name</p><p className="font-semibold text-navy-800">{child?.name}</p></div>
            <div><p className="text-xs text-navy-400">Class</p><p className="font-semibold text-navy-800">{child?.grade} — {child?.class}</p></div>
            <div><p className="text-xs text-navy-400">Roll Number</p><p className="font-semibold text-navy-800">{child?.rollNo}</p></div>
            <div><p className="text-xs text-navy-400">Term</p><p className="font-semibold text-navy-800">First Term</p></div>
          </div>
          {childResults.length > 0 ? (
            <table className="table-base">
              <thead><tr><th>Subject</th><th>Score</th><th>Out Of</th><th>Grade</th><th>Remark</th></tr></thead>
              <tbody>
                {childResults.map((g) => (
                  <tr key={g.id}><td className="font-medium">{g.subjectName}</td><td>{g.score}</td><td>{g.totalMarks}</td><td>{g.grade}</td><td>{g.grade.startsWith('A') ? 'Excellent' : g.grade.startsWith('B') ? 'Good' : 'Satisfactory'}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={<FileBadge className="w-8 h-8" />} title="Report card not yet released" message="The report card will be available once results are released by the school." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function ParentFees({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const [selectedChild, setSelectedChild] = useState(childIds[0]);
  const [payInvoice, setPayInvoice] = useState<typeof INVOICES[0] | null>(null);
  const [slipInvoice, setSlipInvoice] = useState<typeof INVOICES[0] | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);
  const childInvoices = INVOICES.filter((i) => i.studentId === selectedChild);
  const child = STUDENTS.find((s) => s.id === selectedChild);
  const totalFees = childInvoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = childInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = totalFees - totalPaid;

  const handlePay = () => {
    setPaySuccess(true);
    setTimeout(() => {
      setPayInvoice(null);
      setPaySuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Fees & Payments" subtitle="View and pay your child's school fees." />
      <SectionCard title="Select Child">
        <div className="flex gap-3 flex-wrap">
          {childIds.map((id) => {
            const s = STUDENTS.find((st) => st.id === id);
            if (!s) return null;
            return (
              <button key={id} onClick={() => setSelectedChild(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${selectedChild === id ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'}`}>
                <Avatar name={s.name} color={s.photoColor} size="sm" /> {s.name}
              </button>
            );
          })}
        </div>
      </SectionCard>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Fees" value={`L${totalFees.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} />
        <StatCard label="Amount Paid" value={`L${totalPaid.toLocaleString()}`} icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Outstanding" value={`L${outstanding.toLocaleString()}`} icon={<AlertCircle className="w-5 h-5" />} color="error" />
      </div>
      <SectionCard title={`Invoices — ${child?.name || ''}`}>
        <table className="table-base">
          <thead><tr><th>Description</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {childInvoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium text-navy-800">{inv.description}</td>
                <td>L${inv.amount.toLocaleString()}</td><td>L${inv.amountPaid.toLocaleString()}</td>
                <td className="font-semibold text-error-600">L${(inv.amount - inv.amountPaid).toLocaleString()}</td>
                <td>{inv.dueDate}</td>
                <td><span className={inv.status === 'paid' ? 'badge-success' : inv.status === 'partial' ? 'badge-warning' : inv.status === 'overdue' ? 'badge-error' : 'badge-info'}>{inv.status}</span></td>
                <td>
                  {inv.status !== 'paid' && (
                    <div className="flex gap-2">
                      <button onClick={() => setPayInvoice(inv)} className="btn-primary text-xs py-1 px-2">Pay Online</button>
                      <button onClick={() => setSlipInvoice(inv)} className="btn-secondary text-xs py-1 px-2"><Download className="w-3 h-3" /> Slip</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {payInvoice && (
        <Modal open={true} onClose={() => { setPayInvoice(null); setPaySuccess(false); }} title="Online Payment">
          {paySuccess ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success-600" />
                </div>
                <h3 className="font-semibold text-navy-800">Payment Submitted Successfully</h3>
                <p className="text-sm text-navy-400 mt-1 text-center max-w-xs">Your payment of L${(payInvoice.amount - payInvoice.amountPaid).toLocaleString()} has been submitted. The Finance Officer will verify your payment, and the official receipt will be available once verified.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-navy-50 space-y-2">
                <div className="flex justify-between"><span className="text-sm text-navy-500">Student</span><span className="text-sm font-medium text-navy-800">{child?.name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-navy-500">Invoice</span><span className="text-sm font-medium text-navy-800">{payInvoice.description}</span></div>
                <div className="flex justify-between"><span className="text-sm text-navy-500">Outstanding Balance</span><span className="text-sm font-bold text-error-600">L${(payInvoice.amount - payInvoice.amountPaid).toLocaleString()}</span></div>
              </div>
              <div><label className="label">Card Number</label><input className="input" placeholder="0000 0000 0000 0000" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Expiry Date</label><input className="input" placeholder="MM/YY" /></div>
                <div><label className="label">CVV</label><input className="input" placeholder="000" /></div>
              </div>
              <div><label className="label">Cardholder Name</label><input className="input" placeholder="Name on card" /></div>
              <p className="text-xs text-navy-400">Payment is processed through the school's configured payment integration. After Finance verifies the payment, the official receipt will become available.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setPayInvoice(null)} className="btn-secondary">Cancel</button>
                <button onClick={handlePay} className="btn-primary">Pay L${(payInvoice.amount - payInvoice.amountPaid).toLocaleString()}</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {slipInvoice && (
        <Modal open={true} onClose={() => setSlipInvoice(null)} title="Bank Payment Slip">
          <div className="space-y-4">
            <div className="p-6 rounded-lg border-2 border-navy-200 bg-white">
              <div className="text-center mb-4">
                <h2 className="font-display font-bold text-lg text-navy-900">Innosys Academy</h2>
                <p className="text-xs text-navy-500">Bank Payment Slip</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-navy-500">Student Name</span><span className="font-medium text-navy-800">{child?.name}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Class</span><span className="font-medium text-navy-800">{child?.grade} — {child?.class}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Invoice</span><span className="font-medium text-navy-800">{slipInvoice.description}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Amount Due</span><span className="font-bold text-navy-800">L${(slipInvoice.amount - slipInvoice.amountPaid).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Due Date</span><span className="font-medium text-navy-800">{slipInvoice.dueDate}</span></div>
                <div className="border-t border-navy-200 my-3" />
                <div className="flex justify-between"><span className="text-navy-500">Bank</span><span className="font-medium text-navy-800">Ecobank Liberia</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Account Name</span><span className="font-medium text-navy-800">Innosys Academy</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Account Number</span><span className="font-mono font-medium text-navy-800">100-200-3000</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-navy-200 text-center">
                <p className="text-xs text-navy-400">Present this slip at the bank to make your payment. After verification by the Finance Office, your receipt will be available online.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSlipInvoice(null)} className="btn-secondary">Close</button>
              <button onClick={() => {
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(`<html><head><title>Bank Payment Slip</title></head><body style="font-family:sans-serif;padding:40px;"><h2>Innosys Academy</h2><p>Bank Payment Slip</p><hr/><table style="width:100%"><tr><td>Student:</td><td>${child?.name || ''}</td></tr><tr><td>Invoice:</td><td>${slipInvoice.description}</td></tr><tr><td>Amount:</td><td>L${(slipInvoice.amount - slipInvoice.amountPaid).toLocaleString()}</td></tr><tr><td>Bank:</td><td>Ecobank Liberia</td></tr><tr><td>Account:</td><td>Innosys Academy — 100-200-3000</td></tr></table></body></html>`);
                  w.document.close();
                  w.print();
                }
              }} className="btn-primary"><Download className="w-4 h-4" /> Download Slip</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function ParentLibrary({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const childIds = user?.linkedStudentIds || ['s1', 's2'];
  const myRequests = BOOK_REQUESTS.filter((r) => childIds.includes(r.studentId));
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Library" subtitle="Your children's library activity." />
      <SectionCard title="Book Requests">
        {myRequests.length === 0 ? (
          <EmptyState icon={<BookMarked className="w-8 h-8" />} title="No library activity" message="Your children have not requested any books yet." />
        ) : (
          <table className="table-base">
            <thead><tr><th>Book</th><th>Student</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {myRequests.map((r) => (
                <tr key={r.id}><td className="font-medium text-navy-800">{r.bookTitle}</td><td>{r.studentName}</td><td>{r.requestDate}</td><td><span className={r.status === 'approved' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : r.status === 'rejected' ? 'badge-error' : 'badge-info'}>{r.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

export function ParentAnnouncements({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Announcements" subtitle="School announcements for parents." />
      <SectionCard title="All Announcements">
        <div className="space-y-4">
          {ANNOUNCEMENTS.map((an) => (
            <div key={an.id} className="p-4 rounded-lg border border-navy-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-navy-800">{an.title}</h3>
                <span className={an.priority === 'urgent' ? 'badge-error' : an.priority === 'important' ? 'badge-warning' : 'badge-info'}>{an.priority}</span>
              </div>
              <p className="text-sm text-navy-600">{an.body}</p>
              <p className="text-xs text-navy-400 mt-2">{an.date} — {an.author}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
