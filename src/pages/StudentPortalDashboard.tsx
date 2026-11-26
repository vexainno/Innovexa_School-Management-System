
import {
  BookOpen,
  ClipboardList,
  FileText,
  CalendarCheck,
  GraduationCap,
  Wallet,
  CalendarDays,
  Award,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { PageHeader, StatCard, SectionCard, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

import {
  STUDENTS,
  SUBJECTS,
  ASSESSMENTS,
  GRADES,
  ATTENDANCE,
  INVOICES,
  CLASSES,
} from '@/data/mockData';

// Demo identity mapping.
// Production authentication must supply a verified student record ID.
const DEMO_STUDENT_LINKS: Record<string, string> = {
  u11: 's1',
};

interface Props {
  onNavigate: (page: string) => void;
}

export function StudentPortalDashboard({ onNavigate }: Props) {
  const { user } = useAuth();

  const studentId =
    user?.id
      ? DEMO_STUDENT_LINKS[user.id] ??
        STUDENTS.find((student) => student.name === user.name)?.id
      : undefined;

  const student = STUDENTS.find(
    (item) => item.id === studentId && item.status === 'active'
  );

  if (!student) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Student Dashboard"
          subtitle="Your academic overview."
        />

        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="Student profile not linked"
          message="Your account is not currently linked to an active student record. Please contact your school Registrar."
        />
      </div>
    );
  }

  const studentClass = CLASSES.find(
    (item) =>
      item.grade === student.grade &&
      item.section === student.class.replace(/^\d+/, '')
  );

  const mySubjects = SUBJECTS.filter(
    (subject) => subject.classId === studentClass?.id
  );

  const myAssessments = ASSESSMENTS.filter(
    (assessment) => assessment.classId === studentClass?.id
  );

  const pendingAssessments = myAssessments.filter(
    (assessment) =>
      assessment.status === 'published' &&
      assessment.type !== 'assignment'
  );

  const pendingAssignments = myAssessments.filter(
    (assessment) =>
      assessment.status === 'published' &&
      assessment.type === 'assignment'
  );

  const myAttendance = ATTENDANCE.filter(
    (record) => record.studentId === student.id
  );

  const presentCount = myAttendance.filter(
    (record) =>
      record.status === 'present' ||
      record.status === 'late'
  ).length;

  const attendanceRate =
    myAttendance.length > 0
      ? Math.round((presentCount / myAttendance.length) * 100)
      : 0;

  const releasedResults = GRADES.filter(
    (grade) =>
      grade.studentId === student.id &&
      grade.status === 'released'
  );

  const myInvoices = INVOICES.filter(
    (invoice) => invoice.studentId === student.id
  );

  const outstandingFees = myInvoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.amount - invoice.amountPaid),
    0
  );

  const recentResults = releasedResults.slice(-4).reverse();

  const upcomingAssessments = [
    ...pendingAssessments,
    ...pendingAssignments,
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome, ${student.name.split(' ')[0]}`}
        subtitle={`${student.grade} — Section ${student.class.replace(/^\d+/, '')} | Your academic overview.`}
      />

      {/* Main dashboard statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="My Subjects"
          value={mySubjects.length}
          icon={<BookOpen className="w-5 h-5" />}
          color="navy"
          trend="View your enrolled subjects"
          onClick={() => onNavigate('subjects')}
        />

        <StatCard
          label="Pending Assessment"
          value={pendingAssessments.length}
          icon={<ClipboardList className="w-5 h-5" />}
          color="warning"
          trend="Assessments available to you"
          onClick={() => onNavigate('assessments')}
        />

        <StatCard
          label="Assignments"
          value={pendingAssignments.length}
          icon={<FileText className="w-5 h-5" />}
          color="accent"
          trend="Assignments awaiting submission"
          onClick={() => onNavigate('assignments')}
        />

        <StatCard
          label="Attendance"
          value={`${attendanceRate}%`}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="success"
          trend={`${myAttendance.length} recorded attendance entries`}
          onClick={() => onNavigate('attendance')}
        />

        <StatCard
          label="My Results"
          value={releasedResults.length}
          icon={<GraduationCap className="w-5 h-5" />}
          color="navy"
          trend="Officially released results"
          onClick={() => onNavigate('results')}
        />

        <StatCard
          label="Outstanding Fees"
          value={`L$${outstandingFees.toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          color={outstandingFees > 0 ? 'warning' : 'success'}
          trend={outstandingFees > 0 ? 'View and pay your fees' : 'No outstanding balance'}
          onClick={() => onNavigate('fees')}
        />

        <StatCard
          label="My Class Schedule"
          value="View Schedule"
          icon={<CalendarDays className="w-5 h-5" />}
          color="accent"
          trend="View your weekly timetable"
          onClick={() => onNavigate('classes')}
        />
      </div>

      {/* Recent results and upcoming assessments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="My Recent Results"
          action={
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="btn-ghost text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          }
        >
          {recentResults.length === 0 ? (
            <EmptyState
              icon={<Award className="w-7 h-7" />}
              title="No released results yet"
              message="Your results will appear here after they have been officially released."
            />
          ) : (
            <div className="space-y-3">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-navy-100"
                >
                  <div className="p-2 rounded-lg bg-success-50 text-success-700">
                    <Award className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-800">
                      {result.assessmentTitle}
                    </p>
                    <p className="text-xs text-navy-400">
                      {result.subjectName} · {result.score}/{result.totalMarks}
                    </p>
                  </div>

                  <span className="badge-success">
                    {result.grade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Pending Assessment"
          action={
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="btn-ghost text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          }
        >
          {upcomingAssessments.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-7 h-7" />}
              title="No pending assessments"
              message="New assessments published by your teachers will appear here."
            />
          ) : (
            <div className="space-y-3">
              {upcomingAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-navy-100"
                >
                  <div className="p-2 rounded-lg bg-warning-50 text-warning-700">
                    <Clock className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-800">
                      {assessment.title}
                    </p>
                    <p className="text-xs text-navy-400">
                      {assessment.subjectName} · {assessment.totalMarks} marks
                    </p>
                  </div>

                  <span className="badge-warning">
                    {assessment.type === 'assignment'
                      ? 'Assignment'
                      : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Quick access */}
      <SectionCard title="Quick Access">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('classes')}
            className="btn-secondary justify-between"
          >
            My Class Schedule
            <CalendarDays className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="btn-secondary justify-between"
          >
            Attendance Calendar
            <CalendarCheck className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('results')}
            className="btn-secondary justify-between"
          >
            My Results
            <Award className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('fees')}
            className="btn-secondary justify-between"
          >
            Pay Fees
            <Wallet className="w-4 h-4" />
          </button>
        </div>
      </SectionCard>

      {!studentClass && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning-50 text-warning-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            Your student profile is active, but a matching class record
            has not been found. Some dashboard statistics may be unavailable.
          </p>
        </div>
      )}
    </div>
  );
}
