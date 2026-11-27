import { useEffect, useState } from 'react';

import {
  Users,
  FileText,
  Library,
  CalendarCheck,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';










import {
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  } from '@/components/ui';



import { useAuth } from '@/context/AuthContext';

import {
  STUDENTS,
  SUBJECTS,
  ATTENDANCE,
  CLASSES,
} from '@/data/mockData';





import { StudentCalendarPanel } from '@/pages/SchoolCalendar';

import {
  getLearningResources,
  type LearningResource,
} from '@/data/learningResources';


// --- Student Dashboard ---

export function StudentClasses() {
  const { user } = useAuth();
  const student = STUDENTS.find(item => item.id === user?.id || item.name === user?.name) || STUDENTS[0];
  const studentClass = student?.class;
  const matchingClass = CLASSES.find(item => `${item.grade.replace('Grade ', '')}${item.section}`.replace(/\s/g, '').toLowerCase() === (studentClass || '').replace(/\s/g, '').toLowerCase());
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Classes" subtitle="Your enrolled class, class information and published school dates." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(matchingClass ? [matchingClass] : CLASSES.filter(c => c.id === 'c5')).map((c) => (
          <div key={c.id} className="card-hover p-5">
            <div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><Users className="w-5 h-5" /></div>
            <h3 className="font-semibold text-navy-800">{c.name}</h3>
            <p className="text-sm text-navy-400 mt-1">{c.studentCount} students — {c.room}</p>
          </div>
        ))}
      </div>
      <StudentCalendarPanel studentClass={studentClass || '11A'} />
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
  }, [student?.class, studentClass]);

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





// --- Parent ---







